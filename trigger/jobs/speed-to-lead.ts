// trigger/jobs/speed-to-lead.ts
import { task, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/lib/supabase/server"
import { sendNewLeadAlert, sendWhatsAppText } from "@/lib/integrations/whatsapp"
import { sendLeadToZapier, type ZapierLead, type ZapierOrgSettings } from "@/lib/integrations/zapier"
import { sendSlackNotification } from "@/lib/integrations/slack"
import { sendEmail } from "@/lib/integrations/resend"
import { systemLog } from "@/lib/system-log"
import Anthropic from "@anthropic-ai/sdk"

export const speedToLeadTask = task({
  id: "speed-to-lead",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: { leadId: string; sendWelcomeEmail?: boolean }) => {
    const { leadId, sendWelcomeEmail } = payload

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
      speed_to_lead_email_enabled?: boolean
      booking_link?: string
      whatsapp_notification_numbers?: string[]
      zapier_webhook_url?: string
      zapier_enabled?: boolean
      ai_responder_enabled?: boolean
      ai_responder_persona?: string
      ai_responder_welcome_template?: string
    } | null

    // Check if speed-to-lead is enabled
    if (!orgSettings?.speed_to_lead_enabled) {
      logger.info("Speed-to-lead disabled for org", {
        orgId: lead.organization_id
      })
      return { success: true, skipped: true, reason: "disabled" }
    }

    const leadName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown'
    const results: { whatsapp?: boolean; email?: boolean; email_notifications?: boolean; zapier?: boolean; slack?: boolean; ai_welcome?: boolean } = {}

    // Build AI score string (e.g. "8/10 - Hot")
    const tempLabel = lead.temperature
      ? lead.temperature.charAt(0).toUpperCase() + lead.temperature.slice(1)
      : null
    const aiScore = lead.score != null && tempLabel
      ? `${lead.score}/10 - ${tempLabel}`
      : null

    // 1. Notify CLIENT via WhatsApp about the new lead
    const whatsappNumbers = orgSettings.whatsapp_notification_numbers || []

    if (whatsappNumbers.length > 0) {
      let allSent = true

      for (const number of whatsappNumbers) {
        try {
          const result = await sendNewLeadAlert({
            to: number,
            leadName,
            leadCompany: lead.company,
            aiScore,
          })

          logger.info("WhatsApp notification sent to client", {
            to: number,
            messageId: result.messageId,
          })

          // Log activity
          await supabase
            .from('lead_activities')
            .insert({
              lead_id: leadId,
              organization_id: lead.organization_id,
              type: 'notification_sent',
              direction: 'outbound',
              channel: 'whatsapp',
              content: `New lead alert sent to client (${number})`,
              metadata: { message_id: result.messageId, recipient: number },
              is_automated: true,
            })
        } catch (error) {
          logger.error("WhatsApp notification failed", { to: number, error })
          await systemLog('error', 'whatsapp', 'WhatsApp notification failed', lead.organization_id, { leadId, error: String(error) })
          allSent = false
        }
      }

      results.whatsapp = allSent
    } else {
      logger.info("No WhatsApp notification numbers configured for org", {
        orgId: lead.organization_id,
      })
      results.whatsapp = false
    }

    // 1b. Email notification to org team members who have new_lead.email enabled
    try {
      const { data: orgUsers } = await supabase
        .from('users')
        .select('email, first_name, notification_preferences')
        .eq('organization_id', lead.organization_id)

      if (orgUsers && orgUsers.length > 0) {
        const usersToNotify = orgUsers.filter(u => {
          const prefs = u.notification_preferences as Record<string, { email?: boolean }> | null
          return prefs?.new_lead?.email === true && u.email
        })

        for (const member of usersToNotify) {
          try {
            await sendEmail({
              to: member.email,
              subject: `New Lead: ${leadName}${lead.company ? ` from ${lead.company}` : ''}`,
              text: [
                `Hi ${member.first_name || 'there'},`,
                '',
                `A new lead has been captured in :Impact.`,
                '',
                `Name: ${leadName}`,
                lead.company ? `Company: ${lead.company}` : '',
                lead.email ? `Email: ${lead.email}` : '',
                lead.phone ? `Phone: ${lead.phone}` : '',
                aiScore ? `AI Score: ${aiScore}` : '',
                lead.source ? `Source: ${lead.source}` : '',
                '',
                `View in dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://driveimpact.io'}/dashboard/leads/${leadId}`,
              ].filter(Boolean).join('\n'),
              html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:#1a1a2e;padding:20px 24px;color:#f5f5dc;">
        <h2 style="margin:0;font-size:18px;">New Lead Captured</h2>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 16px;font-size:20px;font-weight:600;color:#1a1a2e;">${leadName}</p>
        ${lead.company ? `<p style="margin:0 0 8px;color:#666;"><strong>Company:</strong> ${lead.company}</p>` : ''}
        ${lead.email ? `<p style="margin:0 0 8px;color:#666;"><strong>Email:</strong> ${lead.email}</p>` : ''}
        ${lead.phone ? `<p style="margin:0 0 8px;color:#666;"><strong>Phone:</strong> ${lead.phone}</p>` : ''}
        ${aiScore ? `<p style="margin:0 0 8px;color:#666;"><strong>AI Score:</strong> ${aiScore}</p>` : ''}
        ${lead.source ? `<p style="margin:0 0 16px;color:#666;"><strong>Source:</strong> ${lead.source}</p>` : ''}
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://driveimpact.io'}/dashboard/leads/${leadId}"
           style="display:inline-block;background:#6E0F1A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          View Lead
        </a>
      </div>
    </div>
  </div>
</body></html>`,
            })
            logger.info("Email notification sent to team member", { to: member.email })
          } catch (emailErr) {
            logger.error("Email notification to team member failed", { to: member.email, error: emailErr })
          }
        }

        if (usersToNotify.length > 0) {
          results.email_notifications = true
          logger.info("Email notifications sent to team members", { count: usersToNotify.length })
        }
      }
    } catch (notifError) {
      logger.error("Failed to process email notifications", { error: notifError })
    }

    // 2. Prospect auto-response email
    // Webhook routes send their own branded email inline, so we only send here
    // when explicitly requested (e.g. manual lead creation with "Send Welcome Email" toggled on)
    if (sendWelcomeEmail && lead.email) {
      try {
        const orgName = lead.organization?.name || 'Our team'
        const firstName = lead.first_name || 'there'
        const bookingLink = orgSettings?.booking_link

        await sendEmail({
          to: lead.email,
          replyTo: 'hello@mediampm.com',
          subject: `Thanks for getting in touch, ${firstName}!`,
          text: [
            `Hi ${firstName},`,
            '',
            `Thank you for connecting with ${orgName}! We're excited to chat with you.`,
            '',
            `A member of our team will be in touch within 24 hours.`,
            '',
            bookingLink ? `Want to skip the wait? Book a call here: ${bookingLink}` : '',
            '',
            `Best regards,`,
            `The ${orgName} Team`,
          ].filter(Boolean).join('\n'),
          html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align:center;">
        <img src="https://driveimpact.io/ampm-header-logo.png" alt="${orgName}" style="width:100%;max-width:600px;height:auto;display:block;" />
      </div>
      <div style="padding:32px 24px;">
        <p style="margin:0 0 16px;">Hi ${firstName},</p>
        <p style="margin:0 0 16px;">Thank you for connecting with <strong>${orgName}</strong>! We're excited to chat with you.</p>
        <p style="margin:0 0 16px;">A member of our team will be in touch within 24 hours.</p>
        ${bookingLink ? `
        <p style="margin:0 0 24px;">Want to skip the wait?</p>
        <div style="text-align:center;margin:0 0 24px;">
          <a href="${bookingLink}" style="display:inline-block;background:#ef4444;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Book a Call Now</a>
        </div>` : ''}
        <p style="margin:24px 0 0;">Best regards,<br><strong>The ${orgName} Team</strong></p>
      </div>
      <div style="padding:16px 24px;background:#f3f4f6;text-align:center;font-size:12px;color:#9ca3af;">
        <p style="margin:0;"><a href="https://mediampm.com" style="color:#9ca3af;text-decoration:none;">${orgName}</a> &bull; mediampm.com</p>
      </div>
    </div>
  </div>
</body>
</html>`,
        })

        results.email = true
        logger.info("Welcome email sent to lead", { leadId, email: lead.email })

        // Log activity
        await supabase.from('lead_activities').insert({
          lead_id: leadId,
          organization_id: lead.organization_id,
          type: 'email_sent',
          direction: 'outbound',
          channel: 'email',
          content: `Welcome email sent to ${lead.email}`,
          metadata: { is_welcome_email: true },
          is_automated: true,
        })
      } catch (error) {
        logger.error("Welcome email failed", { leadId, error })
        await systemLog('error', 'email', 'Email send failed', lead.organization_id, { leadId, error: String(error) })
        results.email = false
      }
    } else {
      logger.info("Skipping email — not requested or no email on lead", { leadId, sendWelcomeEmail })
    }

    // 3. POST to Zapier webhook if enabled
    if (orgSettings?.zapier_enabled && orgSettings?.zapier_webhook_url) {
      try {
        const zapierResult = await sendLeadToZapier(
          lead as unknown as ZapierLead,
          orgSettings as ZapierOrgSettings,
        )
        results.zapier = zapierResult.success
        logger.info("Zapier webhook result", { leadId, zapierResult })
      } catch (error) {
        logger.error("Zapier webhook failed", { leadId, error })
        results.zapier = false
      }
    }

    // 4. Slack notification if org has Slack connected
    const { data: slackIntegration } = await supabase
      .from('integrations')
      .select('access_token, metadata')
      .eq('organization_id', lead.organization_id)
      .eq('provider', 'slack')
      .eq('status', 'connected')
      .single()

    if (slackIntegration?.metadata) {
      const meta = slackIntegration.metadata as { incoming_webhook?: { url?: string } }
      const webhookUrl = meta.incoming_webhook?.url

      if (webhookUrl) {
        try {
          await sendSlackNotification({
            webhookUrl,
            leadName,
            leadCompany: lead.company || undefined,
            leadEmail: lead.email || undefined,
            leadPhone: lead.phone || undefined,
            aiScore: aiScore || undefined,
            source: lead.source || undefined,
          })
          results.slack = true
          logger.info("Slack notification sent", { leadId })
        } catch (error) {
          logger.error("Slack notification failed", { leadId, error })
          results.slack = false
        }
      }
    }

    // 5. AI Responder welcome message to the LEAD via WhatsApp
    if (orgSettings?.ai_responder_enabled && lead.phone) {
      try {
        logger.info("Generating AI welcome message for lead", { leadId })

        // Build context for welcome message
        const sourceDetail = lead.source_detail as Record<string, unknown> | null
        const inquiryContext = sourceDetail
          ? Object.entries(sourceDetail)
              .filter(([, v]) => v && typeof v === 'string')
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ')
          : lead.source || 'website inquiry'

        // Generate welcome message with Claude
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY!,
        })

        const welcomeTemplate = orgSettings.ai_responder_welcome_template || ''
        const persona = orgSettings.ai_responder_persona || 'friendly and professional'

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250514',
          max_tokens: 200,
          messages: [
            {
              role: 'user',
              content: `Generate a short, warm welcome message (1-2 sentences) for a new lead via WhatsApp.

Business name: ${lead.organization?.name || 'our team'}
Lead name: ${lead.first_name || 'there'}
What they inquired about: ${inquiryContext}
Persona: ${persona}
${welcomeTemplate ? `Template/style to follow: ${welcomeTemplate}` : ''}
${orgSettings.booking_link ? `Include booking link if relevant: ${orgSettings.booking_link}` : ''}

Rules:
- Be personal and helpful, not robotic
- Keep it short (suitable for WhatsApp)
- Do not use markdown formatting
- Mention their name if available
- Reference what they inquired about if possible
- End with an open question to encourage engagement

Return ONLY the message text, nothing else.`,
            },
          ],
        })

        const welcomeText =
          response.content[0].type === 'text'
            ? response.content[0].text
            : `Hi ${lead.first_name || 'there'}! Thanks for your interest. How can we help you today?`

        // Send welcome message to lead via WhatsApp
        const waResult = await sendWhatsAppText({
          to: lead.phone,
          body: welcomeText,
        })

        logger.info("AI welcome message sent to lead", {
          leadId,
          messageId: waResult.messageId,
        })

        // Create/find conversation with AI handling active
        let { data: conversation } = await supabase
          .from('conversations')
          .select('id')
          .eq('lead_id', leadId)
          .eq('channel', 'whatsapp')
          .eq('organization_id', lead.organization_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!conversation) {
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({
              lead_id: leadId,
              organization_id: lead.organization_id,
              channel: 'whatsapp',
              status: 'open',
              ai_handling: 'active',
              ai_message_count: 1,
              last_message_at: new Date().toISOString(),
            })
            .select('id')
            .single()

          conversation = newConv
        } else {
          await supabase
            .from('conversations')
            .update({
              ai_handling: 'active',
              ai_message_count: 1,
              last_message_at: new Date().toISOString(),
            })
            .eq('id', conversation.id)
        }

        // Store outbound message
        if (conversation) {
          await supabase.from('messages').insert({
            conversation_id: conversation.id,
            organization_id: lead.organization_id,
            direction: 'outbound',
            content: welcomeText,
            status: 'sent',
            external_id: waResult.messageId || null,
            is_ai_generated: true,
            sent_at: new Date().toISOString(),
          })
        }

        // Log activity
        await supabase.from('lead_activities').insert({
          lead_id: leadId,
          organization_id: lead.organization_id,
          type: 'whatsapp_sent',
          direction: 'outbound',
          channel: 'whatsapp',
          content: welcomeText,
          metadata: {
            message_id: waResult.messageId,
            is_ai_generated: true,
            is_welcome_message: true,
          },
          is_automated: true,
        })

        results.ai_welcome = true
      } catch (error) {
        logger.error("AI welcome message failed", { leadId, error })
        await systemLog('error', 'whatsapp', 'WhatsApp notification failed', lead.organization_id, { leadId, error: String(error) })
        results.ai_welcome = false
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
