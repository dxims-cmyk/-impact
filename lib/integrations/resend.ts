// lib/integrations/resend.ts
import { Resend } from 'resend'

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Resend API key not configured. Set RESEND_API_KEY.')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  react?: React.ReactElement
  replyTo?: string
  attachments?: {
    filename: string
    content: Buffer | string
  }[]
  tags?: { name: string; value: string }[]
}

// Send email
export async function sendEmail({
  to,
  subject,
  html,
  text,
  react,
  replyTo,
  attachments,
  tags
}: SendEmailOptions) {
  const { data, error } = await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
    react,
    reply_to: replyTo,
    attachments,
    tags
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data
}

// Send transactional email with template
export async function sendTemplateEmail(
  to: string,
  template: 'welcome' | 'lead_notification' | 'weekly_report' | 'appointment_reminder',
  data: Record<string, unknown>
) {
  const templates = {
    welcome: {
      subject: 'Welcome to : Impact',
      html: generateWelcomeEmail(data)
    },
    lead_notification: {
      subject: `🔥 New Lead: ${data.leadName}`,
      html: generateLeadNotificationEmail(data)
    },
    weekly_report: {
      subject: `Your Weekly Growth Report - ${data.weekOf}`,
      html: generateWeeklyReportEmail(data)
    },
    appointment_reminder: {
      subject: `Reminder: ${data.appointmentTitle} tomorrow`,
      html: generateAppointmentReminderEmail(data)
    }
  }

  const { subject, html } = templates[template]

  return sendEmail({ to, subject, html })
}

// Email template generators
function generateWelcomeEmail(data: Record<string, unknown>): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to : Impact</h1>
        </div>
        <div class="content">
          <p>Hi ${data.name},</p>
          <p>Your growth dashboard is ready. Here's what you can do:</p>
          <ul>
            <li>Track your leads in real-time</li>
            <li>View campaign performance across all platforms</li>
            <li>Get AI-powered insights and recommendations</li>
          </ul>
          <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateLeadNotificationEmail(data: Record<string, unknown>): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .lead-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; }
        .score { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: 600; }
        .hot { background: #fef2f2; color: #dc2626; }
        .warm { background: #fffbeb; color: #d97706; }
        .cold { background: #eff6ff; color: #2563eb; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>🔥 New Lead Alert</h2>
        <div class="lead-card">
          <h3>${data.leadName}</h3>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone}</p>
          <p><strong>Source:</strong> ${data.source}</p>
          <p>
            <span class="score ${data.temperature}">${data.temperature?.toString().toUpperCase()}</span>
            Score: ${data.score}/10
          </p>
          <p><strong>AI Summary:</strong> ${data.aiSummary}</p>
          <a href="${data.leadUrl}" class="button">View Lead</a>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateWeeklyReportEmail(data: Record<string, unknown>): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; padding: 20px; background: #f9fafb; }
        .metric { background: white; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 28px; font-weight: 700; color: #6366f1; }
        .metric-label { font-size: 14px; color: #6b7280; }
        .summary { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #6366f1; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Weekly Growth Report</h1>
          <p>${data.weekOf}</p>
        </div>
        <div class="metrics">
          <div class="metric">
            <div class="metric-value">${data.leads}</div>
            <div class="metric-label">Leads</div>
          </div>
          <div class="metric">
            <div class="metric-value">£${data.cpl}</div>
            <div class="metric-label">Cost per Lead</div>
          </div>
          <div class="metric">
            <div class="metric-value">${data.booked}</div>
            <div class="metric-label">Booked</div>
          </div>
          <div class="metric">
            <div class="metric-value">${data.roas}x</div>
            <div class="metric-label">ROAS</div>
          </div>
        </div>
        <div class="summary">
          <h3>AI Insights</h3>
          <p>${data.aiSummary}</p>
        </div>
        <p style="text-align: center;">
          <a href="${data.reportUrl}" class="button">View Full Report</a>
        </p>
      </div>
    </body>
    </html>
  `
}

// --- Appointment Status Emails (to prospects) ---

export interface AppointmentStatusEmailOptions {
  to: string
  leadName: string
  appointmentTitle: string
  eventType: 'confirmed' | 'cancelled' | 'rescheduled' | 'deleted'
  startTime?: string
  endTime?: string
  newStartTime?: string
  newEndTime?: string
  cancelReason?: string
  orgName: string
  bookingLink?: string
}

export async function sendAppointmentStatusEmail(options: AppointmentStatusEmailOptions): Promise<void> {
  const { to, leadName, appointmentTitle, eventType, orgName } = options

  const subjectMap: Record<typeof eventType, string> = {
    confirmed: `Confirmed: ${appointmentTitle}`,
    cancelled: `Cancelled: ${appointmentTitle}`,
    rescheduled: `Rescheduled: ${appointmentTitle}`,
    deleted: `Cancelled: ${appointmentTitle}`,
  }

  const html = generateAppointmentStatusEmail(options)

  await sendEmail({
    to,
    subject: subjectMap[eventType],
    html,
    tags: [
      { name: 'type', value: 'appointment_status' },
      { name: 'event', value: eventType },
    ],
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function generateAppointmentStatusEmail(options: AppointmentStatusEmailOptions): string {
  const {
    leadName,
    appointmentTitle,
    eventType,
    startTime,
    endTime,
    newStartTime,
    newEndTime,
    cancelReason,
    orgName,
    bookingLink,
  } = options

  const accentColors: Record<typeof eventType, string> = {
    confirmed: '#22c55e',
    cancelled: '#ef4444',
    rescheduled: '#f59e0b',
    deleted: '#ef4444',
  }

  const accent = accentColors[eventType]

  const statusLabels: Record<typeof eventType, string> = {
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    rescheduled: 'Rescheduled',
    deleted: 'Cancelled',
  }

  const messageMap: Record<typeof eventType, string> = {
    confirmed: `Your appointment has been confirmed. We look forward to speaking with you.`,
    cancelled: `Your appointment has been cancelled.${cancelReason ? ` Reason: ${cancelReason}` : ''}`,
    rescheduled: `Your appointment has been rescheduled to a new time.`,
    deleted: `Your appointment has been cancelled.${cancelReason ? ` Reason: ${cancelReason}` : ''}`,
  }

  // Time display
  let timeHtml = ''
  if (eventType === 'rescheduled' && startTime && newStartTime) {
    timeHtml = `
      <div style="margin: 20px 0; padding: 16px; background: #fefce8; border-radius: 8px;">
        <p style="margin: 0 0 8px; color: #92400e; font-size: 13px; text-transform: uppercase; font-weight: 600;">Previous Time</p>
        <p style="margin: 0; text-decoration: line-through; color: #9ca3af;">${formatDateTime(startTime)}</p>
        <p style="margin: 16px 0 8px; color: #92400e; font-size: 13px; text-transform: uppercase; font-weight: 600;">New Time</p>
        <p style="margin: 0; font-weight: 600; color: #1f2937; font-size: 16px;">${formatDateTime(newStartTime)}</p>
      </div>
    `
  } else if (startTime && (eventType === 'confirmed' || eventType === 'cancelled' || eventType === 'deleted')) {
    timeHtml = `
      <div style="margin: 20px 0; padding: 16px; background: #f9fafb; border-radius: 8px; text-align: center;">
        <p style="margin: 0; font-weight: 600; color: #1f2937; font-size: 16px;">${formatDateTime(startTime)}</p>
      </div>
    `
  }

  // CTA for cancelled/deleted with booking link
  let ctaHtml = ''
  if ((eventType === 'cancelled' || eventType === 'deleted') && bookingLink) {
    ctaHtml = `
      <div style="text-align: center; margin-top: 24px;">
        <a href="${bookingLink}" style="display: inline-block; background: ${accent}; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Book Again</a>
      </div>
    `
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: #0C1220; padding: 24px 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <img src="https://driveimpact.io/ampm-header-logo.png" alt="AM:PM Media" style="height: 40px;" />
        </div>

        <!-- Status Badge -->
        <div style="background: ${accent}; padding: 12px; text-align: center;">
          <span style="color: white; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
            Appointment ${statusLabels[eventType]}
          </span>
        </div>

        <!-- Card -->
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Hi ${leadName},</p>
          <p style="margin: 0 0 20px; color: #374151; font-size: 15px; line-height: 1.6;">${messageMap[eventType]}</p>

          <div style="border-left: 3px solid ${accent}; padding-left: 16px; margin: 20px 0;">
            <p style="margin: 0; font-weight: 600; color: #1f2937; font-size: 16px;">${appointmentTitle}</p>
            <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">with ${orgName}</p>
          </div>

          ${timeHtml}
          ${ctaHtml}

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
            This is an automated message from ${orgName} via AM:PM Media.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateAppointmentReminderEmail(data: Record<string, unknown>): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background: #f9fafb; border-radius: 12px; padding: 30px; text-align: center; }
        .time { font-size: 24px; font-weight: 700; color: #6366f1; margin: 20px 0; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 5px; }
        .button-outline { background: white; color: #6366f1; border: 2px solid #6366f1; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <h2>📅 Appointment Reminder</h2>
          <p><strong>${data.appointmentTitle}</strong></p>
          <div class="time">${data.time}</div>
          <p>${data.description}</p>
          <div>
            <a href="${data.joinUrl}" class="button">Join Meeting</a>
            <a href="${data.rescheduleUrl}" class="button button-outline">Reschedule</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}
