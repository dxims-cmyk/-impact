// app/api/reports/[id]/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/integrations/resend'

// POST /api/reports/[id]/send - Email a report to the user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user details
  const { data: userData } = await supabase
    .from('users')
    .select('full_name, email, organization_id')
    .eq('id', user.id)
    .single() as any

  if (!userData?.email) {
    return NextResponse.json({ error: 'No email address found' }, { status: 400 })
  }

  // Get report
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()

  if (reportError || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  // Get org name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', userData.organization_id)
    .single() as any

  const orgName = org?.name || 'Your Organization'
  const metrics = (report as any).metrics || {}
  const periodStart = new Date((report as any).period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const periodEnd = new Date((report as any).period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const reportType = (report as any).report_type === 'weekly' ? 'Weekly' : 'Monthly'

  // Build simple metric rows
  const metricRows = [
    { label: 'Total Leads', value: metrics.leads?.value ?? '-' },
    { label: 'Qualified', value: metrics.qualified?.value ?? '-' },
    { label: 'Booked', value: metrics.booked?.value ?? '-' },
    { label: 'Won', value: metrics.won?.value ?? '-' },
  ]
    .map(m => `<tr><td style="padding:8px 16px;border-bottom:1px solid #eee;color:#374151;">${m.label}</td><td style="padding:8px 16px;border-bottom:1px solid #eee;font-weight:600;color:#111827;text-align:right;">${m.value}</td></tr>`)
    .join('')

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1a1a2e;padding:24px 32px;border-radius:12px 12px 0 0;">
        <h1 style="color:#F5F5DC;margin:0;font-size:20px;">: Impact Report</h1>
        <p style="color:#F5F5DC;opacity:0.7;margin:4px 0 0;font-size:14px;">${orgName}</p>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <h2 style="margin:0 0 4px;font-size:18px;color:#111827;">${reportType} Report</h2>
        <p style="color:#6B7280;margin:0 0 24px;font-size:14px;">${periodStart} — ${periodEnd}</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead><tr><th style="text-align:left;padding:8px 16px;border-bottom:2px solid #e5e7eb;color:#6B7280;font-size:12px;text-transform:uppercase;">Metric</th><th style="text-align:right;padding:8px 16px;border-bottom:2px solid #e5e7eb;color:#6B7280;font-size:12px;text-transform:uppercase;">Value</th></tr></thead>
          <tbody>${metricRows}</tbody>
        </table>
        ${(report as any).ai_summary ? `<div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px;"><p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6B7280;">AI Summary</p><p style="margin:0;color:#374151;font-size:14px;line-height:1.5;">${(report as any).ai_summary}</p></div>` : ''}
        <p style="color:#9CA3AF;font-size:12px;margin:16px 0 0;">Sent from : Impact by AM:PM Media</p>
      </div>
    </div>
  `

  try {
    await sendEmail({
      to: userData.email,
      subject: `${reportType} Report — ${periodStart} to ${periodEnd}`,
      html,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to send report email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
