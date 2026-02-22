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
