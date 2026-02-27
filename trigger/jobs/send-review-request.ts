// trigger/jobs/send-review-request.ts
import { task, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/integrations/resend"
import { sendWhatsAppText } from "@/lib/integrations/whatsapp"

export const sendReviewRequestTask = task({
  id: "send-review-request",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: {
    lead_id: string
    organization_id: string
  }): Promise<{ success?: boolean; skipped?: boolean; reason?: string; results?: Array<{ channel: string; success: boolean; error?: string }> }> => {
    const { lead_id, organization_id } = payload

    logger.info("Starting review request", { lead_id, organization_id })

    const supabase = createAdminClient()

    // Get org settings and plan
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('plan, reputation_settings, name')
      .eq('id', organization_id)
      .single()

    if (orgError || !org) {
      logger.error("Failed to fetch organization", { orgError })
      return { skipped: true, reason: 'Organization not found' }
    }

    // Only Pro accounts
    if (org.plan !== 'pro') {
      logger.info("Skipping — not Pro account", { plan: org.plan })
      return { skipped: true, reason: 'Not Pro account' }
    }

    const settings = org.reputation_settings as {
      enabled: boolean
      send_via: string[]
      email_subject: string
      email_message: string
      whatsapp_message: string
      sms_message: string
      max_requests_per_lead: number
    } | null

    if (!settings?.enabled) {
      logger.info("Skipping — reputation management disabled")
      return { skipped: true, reason: 'Reputation management disabled' }
    }

    // Get lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) {
      logger.error("Lead not found", { lead_id, leadError })
      return { skipped: true, reason: 'Lead not found' }
    }

    // Check if already sent max requests
    const { count } = await supabase
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('lead_id', lead_id)

    if ((count ?? 0) >= settings.max_requests_per_lead) {
      logger.info("Max requests already sent", { count, max: settings.max_requests_per_lead })
      return { skipped: true, reason: 'Max requests already sent' }
    }

    // Get active review platforms
    const { data: platforms } = await supabase
      .from('review_platforms')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('is_active', true)

    if (!platforms?.length) {
      logger.info("No review platforms configured")
      return { skipped: true, reason: 'No review platforms configured' }
    }

    // Pick primary platform (Google first, then first available)
    const primaryPlatform = platforms.find(p => p.platform === 'google') || platforms[0]
    const reviewUrl = primaryPlatform.review_url
    const leadName = lead.first_name || lead.name || 'there'

    const results: Array<{ channel: string; success: boolean; error?: string }> = []

    // Send via each configured channel
    for (const channel of settings.send_via) {
      try {
        if (channel === 'email' && lead.email) {
          const message = settings.email_message
            .replace(/\{\{name\}\}/g, leadName)
            .replace(/\{\{review_link\}\}/g, reviewUrl)

          await sendEmail({
            to: lead.email,
            subject: settings.email_subject,
            html: buildReviewEmailHtml(leadName, reviewUrl, org.name || 'Our Team', message),
            tags: [
              { name: 'type', value: 'review_request' },
              { name: 'platform', value: primaryPlatform.platform },
            ],
          })

          results.push({ channel: 'email', success: true })
          logger.info("Review email sent", { to: lead.email })
        }

        if (channel === 'whatsapp' && lead.phone) {
          const message = settings.whatsapp_message
            .replace(/\{\{name\}\}/g, leadName)
            .replace(/\{\{review_link\}\}/g, reviewUrl)

          await sendWhatsAppText({ to: lead.phone, body: message })
          results.push({ channel: 'whatsapp', success: true })
          logger.info("Review WhatsApp sent", { to: lead.phone })
        }

        if (channel === 'sms' && lead.phone) {
          // SMS via Twilio — not currently active, log for tracking
          logger.warn("SMS channel requested but Twilio not configured")
          results.push({ channel: 'sms', success: false, error: 'SMS not configured' })
        }

        // Log the review request
        if (channel !== 'sms') {
          await supabase.from('review_requests').insert({
            organization_id,
            lead_id,
            platform: primaryPlatform.platform,
            review_url: reviewUrl,
            sent_via: channel,
          })
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        logger.error(`Failed to send via ${channel}`, { error: errorMessage })
        results.push({ channel, success: false, error: errorMessage })
      }
    }

    logger.info("Review request complete", { results })
    return { success: true, results }
  },
})

function buildReviewEmailHtml(
  name: string,
  reviewUrl: string,
  orgName: string,
  message: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #E8642C, #d4531e); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600;">We'd Love Your Feedback!</h1>
          </div>
          <!-- Content -->
          <div style="padding: 30px; text-align: center;">
            <div style="font-size: 36px; margin: 16px 0;">⭐⭐⭐⭐⭐</div>
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">${message}</p>
            <a href="${reviewUrl}" style="display: inline-block; background: #E8642C; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
              Leave a Review
            </a>
          </div>
          <!-- Footer -->
          <div style="padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0; color: #888; font-size: 12px;">
              Thank you for being a valued customer of ${orgName}
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}
