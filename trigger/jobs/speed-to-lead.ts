// trigger/jobs/speed-to-lead.ts
import { task, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/lib/supabase/server"
import { sendSMS } from "@/lib/integrations/twilio"
import { sendEmail } from "@/lib/integrations/resend"

export const speedToLeadTask = task({
  id: "speed-to-lead",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: { leadId: string }) => {
    const { leadId } = payload

    logger.info("Starting speed-to-lead", { leadId })

    const supabase = createAdminClient()

    // Fetch lead with organization settings
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        organization:organizations(
          name,
          settings
        )
      `)
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      logger.error("Lead not found", { leadId, error: leadError })
      return { success: false, error: "Lead not found" }
    }

    const orgSettings = lead.organization?.settings as {
      speed_to_lead_enabled?: boolean
      speed_to_lead_sms_template?: string
      speed_to_lead_email_enabled?: boolean
      booking_link?: string
    } | null

    // Check if speed-to-lead is enabled
    if (!orgSettings?.speed_to_lead_enabled) {
      logger.info("Speed-to-lead disabled for org", {
        orgId: lead.organization_id
      })
      return { success: true, skipped: true, reason: "disabled" }
    }

    const results: { sms?: boolean; email?: boolean } = {}

    // Send SMS if phone available
    if (lead.phone) {
      const template = orgSettings.speed_to_lead_sms_template ||
        `Hi ${lead.first_name || 'there'}! Thanks for reaching out to ${lead.organization?.name}. We'll be in touch shortly. Reply STOP to opt out.`

      try {
        const result = await sendSMS({
          to: lead.phone,
          body: template.replace('{{first_name}}', lead.first_name || 'there')
            .replace('{{booking_link}}', orgSettings.booking_link || '')
        })

        // Log activity
        await supabase
          .from('lead_activities')
          .insert({
            lead_id: leadId,
            organization_id: lead.organization_id,
            type: 'sms_sent',
            direction: 'outbound',
            channel: 'sms',
            content: template,
            metadata: { message_sid: result.sid },
            is_automated: true
          })

        results.sms = true
      } catch (error) {
        logger.error("SMS send failed", { error })
        results.sms = false
      }
    }

    // Send email if enabled and email available
    if (orgSettings.speed_to_lead_email_enabled && lead.email) {
      try {
        const result = await sendEmail({
          to: lead.email,
          subject: `Thanks for contacting ${lead.organization?.name}!`,
          html: `
            <p>Hi ${lead.first_name || 'there'},</p>
            <p>Thank you for reaching out! We received your inquiry and will be in touch within 24 hours.</p>
            ${orgSettings.booking_link ? `
              <p>Want to skip the wait? <a href="${orgSettings.booking_link}">Book a call now</a></p>
            ` : ''}
            <p>Best,<br>${lead.organization?.name} Team</p>
          `
        })

        // Log activity
        await supabase
          .from('lead_activities')
          .insert({
            lead_id: leadId,
            organization_id: lead.organization_id,
            type: 'email_sent',
            direction: 'outbound',
            channel: 'email',
            subject: `Thanks for contacting ${lead.organization?.name}!`,
            content: 'Speed-to-lead welcome email',
            metadata: { email_id: result?.id },
            is_automated: true
          })

        results.email = true
      } catch (error) {
        logger.error("Email send failed", { error })
        results.email = false
      }
    }

    // Update lead stage
    await supabase
      .from('leads')
      .update({
        contacted_at: new Date().toISOString(),
        stage: lead.stage === 'new' ? 'contacted' : lead.stage
      })
      .eq('id', leadId)

    logger.info("Speed-to-lead complete", { leadId, results })

    return { success: true, results }
  }
})
