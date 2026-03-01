// trigger/jobs/qualify-lead.ts
import { task, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/lib/supabase/server"
import { qualifyLead } from "@/lib/ai/claude"
import { triggerAutomations } from './run-automation'

export const qualifyLeadTask = task({
  id: "qualify-lead",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: { leadId: string }) => {
    const { leadId } = payload

    logger.info("Qualifying lead", { leadId })

    const supabase = createAdminClient()

    // Fetch lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      logger.error("Lead not found", { leadId, error: leadError })
      return { success: false, error: "Lead not found" }
    }

    // Skip if already qualified
    if (lead.qualified_at) {
      logger.info("Lead already qualified, skipping", { leadId })
      return { success: true, skipped: true }
    }

    // Fetch any notes from activities (manual leads store notes here)
    const { data: activities } = await supabase
      .from('lead_activities')
      .select('content')
      .eq('lead_id', leadId)
      .eq('type', 'created')
      .limit(1)
      .single()

    const notes = activities?.content && activities.content !== 'Lead created'
      ? activities.content
      : null

    // Call Claude for qualification — pass all context including notes
    logger.info("Calling Claude for qualification", { hasNotes: !!notes })

    const qualification = await qualifyLead({
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      source: lead.source,
      source_detail: lead.source_detail,
      utm_campaign: lead.utm_campaign,
      utm_source: lead.utm_source,
    }, notes)

    logger.info("Qualification result", qualification)

    // Update lead with qualification
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        score: qualification.score,
        temperature: qualification.temperature,
        ai_summary: qualification.summary,
        buying_signals: qualification.buying_signals,
        objections: qualification.objections,
        recommended_action: qualification.recommended_action,
        qualified_at: new Date().toISOString(),
        stage: qualification.temperature === 'hot' ? 'qualified' : 'new'
      })
      .eq('id', leadId)

    if (updateError) {
      logger.error("Failed to update lead", { error: updateError })
      return { success: false, error: "Failed to update lead" }
    }

    // Trigger automations based on qualification results
    triggerAutomations({
      organizationId: lead.organization_id,
      leadId: leadId,
      triggerType: 'lead_scored',
      triggerData: { score: qualification.score, temperature: qualification.temperature },
    }).catch(() => {})

    if (qualification.temperature) {
      triggerAutomations({
        organizationId: lead.organization_id,
        leadId: leadId,
        triggerType: 'lead_qualified',
        triggerData: { temperature: qualification.temperature },
      }).catch(() => {})
    }

    // Log activity
    await supabase
      .from('lead_activities')
      .insert({
        lead_id: leadId,
        organization_id: lead.organization_id,
        type: 'ai_qualified',
        content: qualification.summary,
        metadata: {
          score: qualification.score,
          temperature: qualification.temperature
        },
        is_automated: true
      })

    // If hot, trigger speed-to-lead
    if (qualification.temperature === 'hot') {
      await speedToLeadTask.trigger({ leadId })
    }

    return {
      success: true,
      qualification
    }
  }
})

// Import here to avoid circular dependency at module level
import { speedToLeadTask } from './speed-to-lead'
