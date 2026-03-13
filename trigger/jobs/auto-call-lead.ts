// trigger/jobs/auto-call-lead.ts
// After a new lead arrives, wait 30 seconds then initiate a VAPI outbound call
import { task, wait, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/lib/supabase/server"
import {
  createOutboundCall,
  isWithinBusinessHours,
  type BusinessHours,
} from "@/lib/integrations/vapi"
import { systemLog } from "@/lib/system-log"

export const autoCallLeadTask = task({
  id: "auto-call-lead",
  retry: {
    maxAttempts: 2,
    factor: 2,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
  },
  run: async (payload: { leadId: string }): Promise<{ success: boolean; reason?: string; vapiCallId?: string }> => {
    const { leadId } = payload

    logger.info("Auto-call: starting", { leadId })

    // 1. Wait 30 seconds before calling (gives client time to see WhatsApp alert)
    await wait.for({ seconds: 30 })

    const supabase = createAdminClient()

    // 2. Fetch lead with org settings
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        id, phone, first_name, last_name, email, source, organization_id,
        organization:organizations(
          id, name, plan, settings,
          membership_status
        )
      `)
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      logger.error("Auto-call: lead not found", { leadId, error: leadError })
      return { success: false, reason: "lead_not_found" }
    }

    // 3. Guard: lead must have a phone number
    if (!lead.phone) {
      logger.info("Auto-call: no phone number on lead", { leadId })
      return { success: false, reason: "no_phone" }
    }

    const org = lead.organization as any
    const orgSettings = (org?.settings || {}) as Record<string, any>

    // 4. Guard: AI receptionist must be enabled
    if (!orgSettings.ai_receptionist_enabled) {
      logger.info("Auto-call: receptionist disabled for org", { orgId: lead.organization_id })
      return { success: false, reason: "receptionist_disabled" }
    }

    // 5. Guard: must have an assistant configured
    const assistantId = orgSettings.ai_receptionist_assistant_id as string | undefined
    if (!assistantId) {
      logger.info("Auto-call: no assistant configured", { orgId: lead.organization_id })
      return { success: false, reason: "no_assistant" }
    }

    // 6. Guard: must have a VAPI phone number ID to call from
    const phoneNumberId = orgSettings.ai_receptionist_phone_number_id as string | undefined
    if (!phoneNumberId) {
      logger.warn("Auto-call: no VAPI phone number ID configured (ai_receptionist_phone_number_id)", {
        orgId: lead.organization_id,
      })
      return { success: false, reason: "no_phone_number_id" }
    }

    // 7. Guard: plan check (Growth+ or active ai_receptionist addon)
    const plan = org?.plan as string
    const isGrowthOrHigher = plan === 'growth' || plan === 'pro'

    if (!isGrowthOrHigher) {
      // Check for active addon
      const { data: addon } = await supabase
        .from('account_addons')
        .select('id')
        .eq('organization_id', lead.organization_id)
        .eq('addon_key', 'ai_receptionist')
        .eq('status', 'active')
        .single()

      if (!addon) {
        logger.info("Auto-call: org not on Growth+ and no active addon", { orgId: lead.organization_id })
        return { success: false, reason: "plan_not_eligible" }
      }
    }

    // 8. Guard: don't double-call -- check if we already called this lead today
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    const { count: existingCalls } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', lead.organization_id)
      .eq('lead_id', leadId)
      .eq('direction', 'outbound')
      .gte('created_at', todayStart.toISOString())

    if (existingCalls && existingCalls > 0) {
      logger.info("Auto-call: lead already called today", { leadId, existingCalls })
      return { success: false, reason: "already_called_today" }
    }

    // 9. Check business hours (affects system prompt behavior, not whether we call)
    const businessHours = orgSettings.ai_receptionist_business_hours as BusinessHours | null
    const withinHours = isWithinBusinessHours(businessHours)

    logger.info("Auto-call: initiating VAPI outbound call", {
      leadId,
      phone: lead.phone,
      assistantId,
      withinHours,
    })

    try {
      // 10. Make the call
      const vapiCall = await createOutboundCall({
        assistantId,
        phoneNumberId,
        customerNumber: lead.phone,
        metadata: {
          organization_id: lead.organization_id,
          lead_id: leadId,
          lead_name: [lead.first_name, lead.last_name].filter(Boolean).join(' '),
          within_business_hours: withinHours,
          source: 'auto_call',
        },
      })

      logger.info("Auto-call: VAPI call initiated", {
        leadId,
        vapiCallId: vapiCall.id,
      })

      // 11. Create call record in our DB
      await supabase
        .from('calls')
        .insert({
          vapi_call_id: vapiCall.id,
          organization_id: lead.organization_id,
          lead_id: leadId,
          phone_number: lead.phone,
          caller_name: [lead.first_name, lead.last_name].filter(Boolean).join(' ') || null,
          direction: 'outbound',
          status: 'in_progress',
          metadata: {
            assistant_id: assistantId,
            source: 'auto_call',
            within_business_hours: withinHours,
          },
        })

      // 12. Log activity on lead
      await supabase
        .from('lead_activities')
        .insert({
          lead_id: leadId,
          organization_id: lead.organization_id,
          type: 'call',
          direction: 'outbound',
          channel: 'call',
          content: 'AI Receptionist auto-call initiated',
          is_automated: true,
          metadata: {
            vapi_call_id: vapiCall.id,
            source: 'auto_call',
          },
        })

      return { success: true, vapiCallId: vapiCall.id }
    } catch (error) {
      logger.error("Auto-call: VAPI call failed", { leadId, error })
      await systemLog(
        'error',
        'vapi',
        `Auto-call failed for lead ${leadId}: ${error instanceof Error ? error.message : String(error)}`,
        lead.organization_id,
        { leadId, error: String(error) }
      )
      return { success: false, reason: "vapi_call_failed" }
    }
  },
})
