// trigger/jobs/qualify-lead.ts
import { task, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/lib/supabase/server"
import { qualifyLead } from "@/lib/ai/claude"

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

    // Call Claude for qualification
    logger.info("Calling Claude for qualification")

    const qualification = await qualifyLead({
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      source: lead.source,
      utm_campaign: lead.utm_campaign,
      utm_source: lead.utm_source,
    })

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
