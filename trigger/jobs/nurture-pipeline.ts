// trigger/jobs/nurture-pipeline.ts
// Daily pipeline nurture — generates AI follow-ups for stale leads and sends via email/WhatsApp
import { task, schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/lib/supabase/server"
import { generateFollowUp } from "@/lib/ai/follow-up"
import { sendEmail } from "@/lib/integrations/resend"
import { sendWhatsAppText } from "@/lib/integrations/whatsapp"
import { systemLog } from "@/lib/system-log"

const COOLDOWN_HOURS = 48
const MAX_LEADS_PER_ORG = 20
const ACTIVE_STAGES = ['qualified', 'contacted', 'booked']

interface NurturePayload {
  organizationId?: string
}

interface NurtureResult {
  orgId: string
  nurtured: number
  skipped: number
  errors: number
}

// Scheduled cron — runs daily at 9 AM UTC for all orgs with nurture enabled
export const nurturePipelineSchedule = schedules.task({
  id: "nurture-pipeline-schedule",
  cron: "0 9 * * *",
  retry: {
    maxAttempts: 2,
    factor: 2,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 30000,
  },
  run: async () => {
    logger.info("Scheduled pipeline nurture starting (all orgs)")
    return await runNurture({})
  },
})

// Manual trigger — for single-org on-demand nurture via API
export const nurturePipelineTask = task({
  id: "nurture-pipeline",
  retry: {
    maxAttempts: 2,
    factor: 2,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 30000,
  },
  run: async (payload: NurturePayload): Promise<{ success: boolean; results: NurtureResult[] }> => {
    logger.info("Manual pipeline nurture starting", { organizationId: payload.organizationId })
    return await runNurture(payload)
  },
})

async function runNurture(payload: NurturePayload): Promise<{ success: boolean; results: NurtureResult[] }> {
    logger.info("Starting pipeline nurture", { organizationId: payload.organizationId })

    const supabase = createAdminClient()

    // Determine which orgs to process
    let orgQuery = supabase
      .from('organizations')
      .select('id, name, settings')

    if (payload.organizationId) {
      orgQuery = orgQuery.eq('id', payload.organizationId)
    }

    const { data: orgs, error: orgsError } = await orgQuery

    if (orgsError || !orgs) {
      logger.error("Failed to fetch organizations", { error: orgsError })
      return { success: false, results: [] }
    }

    // Filter to orgs with nurture enabled
    const eligibleOrgs = orgs.filter(org => {
      const settings = org.settings as Record<string, unknown> | null
      return settings?.nurture_enabled === true
    })

    if (eligibleOrgs.length === 0) {
      logger.info("No organizations with nurture enabled")
      return { success: true, results: [] }
    }

    logger.info(`Processing ${eligibleOrgs.length} organizations`)

    const results: NurtureResult[] = []

    for (const org of eligibleOrgs) {
      const result = await processOrg(supabase, org)
      results.push(result)
    }

    const totalNurtured = results.reduce((sum, r) => sum + r.nurtured, 0)
    logger.info("Pipeline nurture complete", {
      orgs: results.length,
      totalNurtured,
    })

    return { success: true, results }
}

async function processOrg(
  supabase: ReturnType<typeof createAdminClient>,
  org: { id: string; name: string; settings: unknown }
): Promise<NurtureResult> {
  const orgSettings = org.settings as Record<string, unknown> | null
  const bookingLink = orgSettings?.booking_link as string | undefined
  const persona = orgSettings?.ai_responder_persona as string | undefined

  const result: NurtureResult = {
    orgId: org.id,
    nurtured: 0,
    skipped: 0,
    errors: 0,
  }

  try {
    // Calculate cooldown cutoff
    const cooldownCutoff = new Date()
    cooldownCutoff.setHours(cooldownCutoff.getHours() - COOLDOWN_HOURS)
    const cutoffISO = cooldownCutoff.toISOString()

    // Fetch leads in active stages
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, first_name, last_name, email, phone, company, stage')
      .eq('organization_id', org.id)
      .in('stage', ACTIVE_STAGES)
      .limit(MAX_LEADS_PER_ORG * 2) // fetch extra since some will be filtered out

    if (leadsError || !leads || leads.length === 0) {
      logger.info("No active leads for org", { orgId: org.id })
      return result
    }

    // For each lead, check if they've been contacted recently
    const leadsToNurture: typeof leads = []

    for (const lead of leads) {
      if (leadsToNurture.length >= MAX_LEADS_PER_ORG) break

      // Check most recent outbound activity
      const { data: recentOutbound } = await supabase
        .from('messages')
        .select('created_at')
        .eq('organization_id', org.id)
        .in('conversation_id',
          (await supabase
            .from('conversations')
            .select('id')
            .eq('lead_id', lead.id)
            .eq('organization_id', org.id)
          ).data?.map(c => c.id) || []
        )
        .eq('direction', 'outbound')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Also check lead_activities for outbound
      const { data: recentActivity } = await supabase
        .from('lead_activities')
        .select('created_at')
        .eq('lead_id', lead.id)
        .eq('organization_id', org.id)
        .eq('direction', 'outbound')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const lastOutbound = [recentOutbound?.created_at, recentActivity?.created_at]
        .filter(Boolean)
        .sort()
        .reverse()[0]

      if (lastOutbound && new Date(lastOutbound) > cooldownCutoff) {
        result.skipped++
        continue
      }

      leadsToNurture.push(lead)
    }

    if (leadsToNurture.length === 0) {
      logger.info("All leads recently contacted, skipping org", { orgId: org.id })
      return result
    }

    logger.info(`Nurturing ${leadsToNurture.length} leads for ${org.name}`, { orgId: org.id })

    // Process each lead
    for (const lead of leadsToNurture) {
      try {
        await nurtureLead(supabase, lead, org, bookingLink, persona)
        result.nurtured++
      } catch (error) {
        logger.error("Failed to nurture lead", {
          leadId: lead.id,
          orgId: org.id,
          error: String(error),
        })
        await systemLog('error', 'email', `Nurture follow-up failed for lead ${lead.id}`, org.id, {
          leadId: lead.id,
          error: String(error),
        })
        result.errors++
      }
    }

    // Send summary to client via WhatsApp
    if (result.nurtured > 0) {
      await sendClientSummary(org, result.nurtured)
    }
  } catch (error) {
    logger.error("Org nurture processing failed", { orgId: org.id, error: String(error) })
    await systemLog('error', 'email', `Pipeline nurture failed for org`, org.id, { error: String(error) })
  }

  return result
}

async function nurtureLead(
  supabase: ReturnType<typeof createAdminClient>,
  lead: { id: string; first_name: string | null; last_name: string | null; email: string | null; phone: string | null; company: string | null; stage: string },
  org: { id: string; name: string; settings: unknown },
  bookingLink?: string,
  persona?: string,
): Promise<void> {
  const leadName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'there'

  // Load conversation history (last 10 messages from most recent conversation)
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, channel')
    .eq('lead_id', lead.id)
    .eq('organization_id', org.id)
    .order('last_message_at', { ascending: false })
    .limit(1)

  let conversationHistory: { direction: string; content: string; sent_at: string | null }[] = []

  if (conversations && conversations.length > 0) {
    const { data: messages } = await supabase
      .from('messages')
      .select('direction, content, sent_at')
      .eq('conversation_id', conversations[0].id)
      .order('created_at', { ascending: false })
      .limit(10)

    conversationHistory = (messages || []).reverse()
  }

  // Load recent activities
  const { data: activities } = await supabase
    .from('lead_activities')
    .select('type, content, created_at')
    .eq('lead_id', lead.id)
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const recentActivities = (activities || []).map(a => ({
    type: a.type,
    content: a.content,
    created_at: a.created_at,
  }))

  // Generate follow-up with AI
  const followUp = await generateFollowUp({
    leadName,
    leadEmail: lead.email,
    leadPhone: lead.phone,
    company: lead.company,
    stage: lead.stage,
    conversationHistory,
    recentActivities,
    orgName: org.name,
    bookingLink,
    persona,
  })

  // Send the follow-up
  let externalId: string | null = null

  if (followUp.channel === 'email' && lead.email) {
    await sendEmail({
      to: lead.email,
      replyTo: 'hello@mediampm.com',
      subject: followUp.subject,
      text: followUp.message,
      html: generateFollowUpEmail(leadName, followUp.message, org.name, bookingLink),
      tags: [
        { name: 'type', value: 'nurture_follow_up' },
        { name: 'stage', value: lead.stage },
      ],
    })
    logger.info("Nurture email sent", { leadId: lead.id, email: lead.email })
  } else if (lead.phone) {
    const waResult = await sendWhatsAppText({
      to: lead.phone,
      body: followUp.message,
    })
    externalId = waResult.messageId
    logger.info("Nurture WhatsApp sent", { leadId: lead.id, phone: lead.phone })
  } else {
    logger.warn("Lead has no email or phone, skipping", { leadId: lead.id })
    return
  }

  // Store message in conversation
  const channel = followUp.channel === 'email' ? 'email' : 'whatsapp'

  // Find or create conversation for this channel
  let { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('lead_id', lead.id)
    .eq('channel', channel)
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!conversation) {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        lead_id: lead.id,
        organization_id: org.id,
        channel,
        status: 'open',
        last_message_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    conversation = newConv
  } else {
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id)
  }

  if (conversation) {
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      organization_id: org.id,
      direction: 'outbound',
      content: followUp.message,
      status: 'sent',
      external_id: externalId,
      is_ai_generated: true,
      sent_at: new Date().toISOString(),
    })
  }

  // Log lead activity
  await supabase.from('lead_activities').insert({
    lead_id: lead.id,
    organization_id: org.id,
    type: 'follow_up_sent',
    direction: 'outbound',
    channel,
    content: followUp.message,
    subject: followUp.channel === 'email' ? followUp.subject : undefined,
    metadata: {
      is_ai_generated: true,
      nurture_stage: lead.stage,
      conversation_id: conversation?.id,
    },
    is_automated: true,
  })
}

async function sendClientSummary(
  org: { id: string; name: string; settings: unknown },
  nurturedCount: number,
): Promise<void> {
  const orgSettings = org.settings as Record<string, unknown> | null
  const whatsappNumbers = (orgSettings?.whatsapp_notification_numbers as string[]) || []

  if (whatsappNumbers.length === 0) return

  const message = `Morning nurture complete — ${nurturedCount} lead${nurturedCount === 1 ? '' : 's'} followed up today for ${org.name}.`

  for (const number of whatsappNumbers) {
    try {
      await sendWhatsAppText({ to: number, body: message })
      logger.info("Nurture summary sent to client", { to: number, orgId: org.id })
    } catch (error) {
      logger.error("Failed to send nurture summary", { to: number, error: String(error) })
    }
  }
}

function generateFollowUpEmail(
  leadName: string,
  messageBody: string,
  orgName: string,
  bookingLink?: string,
): string {
  // Convert newlines in message to <br> for HTML
  const htmlBody = messageBody.replace(/\n/g, '<br>')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align:center;">
        <img src="https://driveimpact.io/ampm-header-logo.png" alt="${orgName}" style="width:100%;max-width:600px;height:auto;display:block;" />
      </div>
      <div style="padding:32px 24px;">
        <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">${htmlBody}</p>
        ${bookingLink ? `
        <div style="text-align:center;margin:24px 0;">
          <a href="${bookingLink}" style="display:inline-block;background:#6E0F1A;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Book a Call</a>
        </div>` : ''}
      </div>
      <div style="padding:16px 24px;background:#f3f4f6;text-align:center;font-size:12px;color:#9ca3af;">
        <p style="margin:0;"><a href="https://mediampm.com" style="color:#9ca3af;text-decoration:none;">${orgName}</a> &bull; mediampm.com</p>
      </div>
    </div>
  </div>
</body>
</html>`
}
