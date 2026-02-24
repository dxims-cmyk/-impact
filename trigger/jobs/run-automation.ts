// trigger/jobs/run-automation.ts
import { task, wait, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/integrations/resend"
import { sendWhatsAppText } from "@/lib/integrations/whatsapp"
import { sendSlackNotification } from "@/lib/integrations/slack"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AutomationAction {
  id: string
  action_type: string
  action_config: Record<string, unknown>
  action_order: number
}

interface Lead {
  id: string
  email: string | null
  phone: string | null
  first_name: string | null
  last_name: string | null
  company: string | null
  organization_id: string
  assigned_to: string | null
  metadata: Record<string, unknown> | null
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Task: run-automation
// ---------------------------------------------------------------------------

export const runAutomationTask = task({
  id: "run-automation",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: {
    automationId: string
    leadId: string
    triggerType: string
  }) => {
    const { automationId, leadId, triggerType } = payload

    logger.info("Starting run-automation", { automationId, leadId, triggerType })

    const supabase = createAdminClient()

    // -----------------------------------------------------------------------
    // 1. Fetch automation & verify active
    // -----------------------------------------------------------------------
    const { data: automation, error: autoError } = await supabase
      .from("automations")
      .select("*")
      .eq("id", automationId)
      .single()

    if (autoError || !automation) {
      logger.error("Automation not found", { automationId, error: autoError })
      return { success: false, error: "Automation not found" }
    }

    if (!automation.is_active) {
      logger.info("Automation is inactive, skipping", { automationId })
      return { success: true, skipped: true, reason: "inactive" }
    }

    // -----------------------------------------------------------------------
    // 2. Fetch actions ordered by action_order
    // -----------------------------------------------------------------------
    const { data: actions, error: actionsError } = await supabase
      .from("automation_actions")
      .select("*")
      .eq("automation_id", automationId)
      .order("action_order", { ascending: true })

    if (actionsError) {
      logger.error("Failed to fetch automation actions", { automationId, error: actionsError })
      return { success: false, error: "Failed to fetch actions" }
    }

    if (!actions || actions.length === 0) {
      logger.info("Automation has no actions", { automationId })
      return { success: true, skipped: true, reason: "no_actions" }
    }

    // -----------------------------------------------------------------------
    // 3. Fetch lead
    // -----------------------------------------------------------------------
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single()

    if (leadError || !lead) {
      logger.error("Lead not found", { leadId, error: leadError })
      return { success: false, error: "Lead not found" }
    }

    const typedLead = lead as Lead

    // -----------------------------------------------------------------------
    // 4. Create automation_runs record
    // -----------------------------------------------------------------------
    const { data: runRecord, error: runError } = await supabase
      .from("automation_runs")
      .insert({
        automation_id: automationId,
        lead_id: leadId,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (runError || !runRecord) {
      logger.error("Failed to create automation run record", { error: runError })
      return { success: false, error: "Failed to create run record" }
    }

    const runId = runRecord.id

    // -----------------------------------------------------------------------
    // 5. Execute each action in order
    // -----------------------------------------------------------------------
    const actionResults: { actionId: string; type: string; success: boolean; error?: string }[] = []

    try {
      for (const action of actions as AutomationAction[]) {
        const config = (action.action_config || {}) as Record<string, unknown>
        let actionSuccess = true
        let actionError: string | undefined

        try {
          switch (action.action_type) {
            // ----- send_email -----
            case "send_email": {
              if (!typedLead.email) {
                throw new Error("Lead has no email address")
              }
              await sendEmail({
                to: typedLead.email,
                subject: (config.subject as string) || "Automated message",
                html: (config.html_body as string) || (config.template as string) || "",
              })
              logger.info("send_email completed", { leadId, actionId: action.id })
              break
            }

            // ----- send_whatsapp -----
            case "send_whatsapp": {
              if (!typedLead.phone) {
                throw new Error("Lead has no phone number")
              }
              await sendWhatsAppText({
                to: typedLead.phone,
                body: (config.message as string) || "",
              })
              logger.info("send_whatsapp completed", { leadId, actionId: action.id })
              break
            }

            // ----- send_sms -----
            case "send_sms": {
              // Twilio SMS is being migrated to WhatsApp — log only for now
              logger.info("send_sms action (Twilio migration pending, logging only)", {
                leadId,
                actionId: action.id,
                message: config.message,
              })
              break
            }

            // ----- send_slack -----
            case "send_slack": {
              // Look up Slack integration for the org
              const { data: slackIntegration } = await supabase
                .from("integrations")
                .select("metadata")
                .eq("organization_id", typedLead.organization_id)
                .eq("provider", "slack")
                .eq("status", "connected")
                .single()

              const slackMeta = slackIntegration?.metadata as {
                incoming_webhook?: { url?: string }
              } | null

              const webhookUrl = slackMeta?.incoming_webhook?.url

              if (!webhookUrl) {
                throw new Error("Slack not connected or no webhook URL for this organization")
              }

              const leadName = [typedLead.first_name, typedLead.last_name]
                .filter(Boolean)
                .join(" ") || "Unknown"

              await sendSlackNotification({
                webhookUrl,
                leadName,
                leadCompany: typedLead.company || undefined,
                leadEmail: typedLead.email || undefined,
                leadPhone: typedLead.phone || undefined,
              })
              logger.info("send_slack completed", { leadId, actionId: action.id })
              break
            }

            // ----- add_tag -----
            case "add_tag": {
              const tag = config.tag as string
              if (!tag) {
                throw new Error("add_tag action missing tag in config")
              }

              const existingMeta = (typedLead.metadata || {}) as Record<string, unknown>
              const existingTags = Array.isArray(existingMeta.tags) ? existingMeta.tags : []

              if (!existingTags.includes(tag)) {
                existingTags.push(tag)
              }

              const updatedMeta = { ...existingMeta, tags: existingTags }

              await supabase
                .from("leads")
                .update({ metadata: updatedMeta })
                .eq("id", leadId)

              // Update local copy so subsequent actions see the change
              typedLead.metadata = updatedMeta

              logger.info("add_tag completed", { leadId, tag, actionId: action.id })
              break
            }

            // ----- assign_user -----
            case "assign_user": {
              const userId = config.user_id as string
              if (!userId) {
                throw new Error("assign_user action missing user_id in config")
              }

              await supabase
                .from("leads")
                .update({ assigned_to: userId })
                .eq("id", leadId)

              typedLead.assigned_to = userId

              logger.info("assign_user completed", { leadId, userId, actionId: action.id })
              break
            }

            // ----- wait -----
            case "wait": {
              const seconds =
                (config.seconds as number) ||
                ((config.minutes as number) || 0) * 60

              if (seconds > 0) {
                logger.info("wait action: pausing", { seconds, actionId: action.id })
                await wait.for({ seconds })
                logger.info("wait action: resumed", { actionId: action.id })
              }
              break
            }

            // ----- webhook -----
            case "webhook": {
              const url = config.url as string
              if (!url) {
                throw new Error("webhook action missing url in config")
              }

              const headers: Record<string, string> = {
                "Content-Type": "application/json",
                ...((config.headers as Record<string, string>) || {}),
              }

              const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify({
                  lead_id: typedLead.id,
                  email: typedLead.email,
                  phone: typedLead.phone,
                  first_name: typedLead.first_name,
                  last_name: typedLead.last_name,
                  company: typedLead.company,
                  organization_id: typedLead.organization_id,
                  metadata: typedLead.metadata,
                }),
              })

              if (!response.ok) {
                throw new Error(`Webhook POST to ${url} returned ${response.status}`)
              }

              logger.info("webhook completed", { url, status: response.status, actionId: action.id })
              break
            }

            // ----- create_task -----
            case "create_task": {
              const content = (config.content as string) || "Automated task created"

              // Log as lead_activity (task/note)
              await supabase.from("lead_activities").insert({
                lead_id: leadId,
                organization_id: typedLead.organization_id,
                type: "task",
                content,
                is_automated: true,
              })

              logger.info("create_task completed", { leadId, actionId: action.id })
              break
            }

            default:
              logger.warn("Unknown action type, skipping", {
                actionType: action.action_type,
                actionId: action.id,
              })
          }
        } catch (err) {
          actionSuccess = false
          actionError = err instanceof Error ? err.message : String(err)
          logger.error("Action execution failed", {
            actionId: action.id,
            actionType: action.action_type,
            error: actionError,
          })
        }

        actionResults.push({
          actionId: action.id,
          type: action.action_type,
          success: actionSuccess,
          error: actionError,
        })

        // ---------------------------------------------------------------
        // 7. Log each action as lead_activity with type='automation'
        // ---------------------------------------------------------------
        await supabase.from("lead_activities").insert({
          lead_id: leadId,
          organization_id: typedLead.organization_id,
          type: "automation",
          content: `Automation action "${action.action_type}" ${actionSuccess ? "completed" : "failed"}${actionError ? `: ${actionError}` : ""}`,
          metadata: {
            automation_id: automationId,
            action_id: action.id,
            action_type: action.action_type,
            success: actionSuccess,
            run_id: runId,
          },
          is_automated: true,
        })
      }

      // -------------------------------------------------------------------
      // 6. Update automation_runs — success
      // -------------------------------------------------------------------
      const allSucceeded = actionResults.every((r) => r.success)

      await supabase
        .from("automation_runs")
        .update({
          status: allSucceeded ? "completed" : "failed",
          completed_at: new Date().toISOString(),
          error: allSucceeded
            ? null
            : actionResults
                .filter((r) => !r.success)
                .map((r) => `${r.type}: ${r.error}`)
                .join("; "),
        })
        .eq("id", runId)

      logger.info("Automation run finished", {
        automationId,
        runId,
        allSucceeded,
        actionResults,
      })

      return { success: allSucceeded, runId, actionResults }
    } catch (fatalError) {
      // -------------------------------------------------------------------
      // 6. Update automation_runs — fatal error
      // -------------------------------------------------------------------
      const errorMessage =
        fatalError instanceof Error ? fatalError.message : String(fatalError)

      await supabase
        .from("automation_runs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error: errorMessage,
        })
        .eq("id", runId)

      logger.error("Automation run failed fatally", {
        automationId,
        runId,
        error: errorMessage,
      })

      return { success: false, runId, error: errorMessage, actionResults }
    }
  },
})

// ---------------------------------------------------------------------------
// Helper: triggerAutomations
// ---------------------------------------------------------------------------
// Fire-and-forget helper that finds active automations matching the trigger
// and enqueues a run-automation task for each one.
// ---------------------------------------------------------------------------

export async function triggerAutomations({
  organizationId,
  leadId,
  triggerType,
  triggerData,
}: {
  organizationId: string
  leadId: string
  triggerType: string
  triggerData?: Record<string, unknown>
}): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Fetch active automations for this org + trigger type
    const { data: automations, error } = await supabase
      .from("automations")
      .select("id, trigger_type, trigger_config")
      .eq("organization_id", organizationId)
      .eq("trigger_type", triggerType)
      .eq("is_active", true)

    if (error) {
      logger.error("Failed to query automations", { organizationId, triggerType, error })
      return
    }

    if (!automations || automations.length === 0) {
      logger.info("No matching automations found", { organizationId, triggerType })
      return
    }

    for (const automation of automations) {
      const config = (automation.trigger_config || {}) as Record<string, unknown>

      // ----- Conditional checks based on trigger type -----

      if (triggerType === "lead_scored") {
        const minScore = config.min_score as number | undefined
        const actualScore = triggerData?.score as number | undefined

        if (minScore != null && actualScore != null && actualScore < minScore) {
          logger.info("Skipping automation — score below min_score", {
            automationId: automation.id,
            minScore,
            actualScore,
          })
          continue
        }
      }

      if (triggerType === "lead_qualified") {
        const requiredTemp = config.temperature as string | undefined
        const actualTemp = triggerData?.temperature as string | undefined

        if (requiredTemp && actualTemp && requiredTemp !== actualTemp) {
          logger.info("Skipping automation — temperature mismatch", {
            automationId: automation.id,
            requiredTemp,
            actualTemp,
          })
          continue
        }
      }

      // Trigger the run-automation task
      try {
        await runAutomationTask.trigger({
          automationId: automation.id,
          leadId,
          triggerType,
        })

        logger.info("Triggered run-automation", {
          automationId: automation.id,
          leadId,
          triggerType,
        })
      } catch (triggerError) {
        logger.error("Failed to trigger run-automation task", {
          automationId: automation.id,
          leadId,
          error: triggerError instanceof Error ? triggerError.message : String(triggerError),
        })
      }
    }
  } catch (outerError) {
    // Catch-all so this helper never throws to the caller
    logger.error("triggerAutomations unexpected error", {
      organizationId,
      leadId,
      triggerType,
      error: outerError instanceof Error ? outerError.message : String(outerError),
    })
  }
}
