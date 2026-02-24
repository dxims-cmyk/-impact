// trigger/jobs/weekly-report.ts
import { schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/lib/supabase/server"
import { generateReportSummary } from "@/lib/ai/claude"
import { sendTemplateEmail } from "@/lib/integrations/resend"
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns"

export const weeklyReportTask = schedules.task({
  id: "weekly-report",
  cron: "0 7 * * 1", // Every Monday at 7am
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async () => {
    logger.info("Starting weekly report generation")

    const supabase = createAdminClient()

    // Calculate date range (last week)
    const now = new Date()
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })

    const periodStart = format(lastWeekStart, 'yyyy-MM-dd')
    const periodEnd = format(lastWeekEnd, 'yyyy-MM-dd')
    const weekOf = format(lastWeekStart, 'MMM d') + ' - ' + format(lastWeekEnd, 'MMM d, yyyy')

    // Get all active organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select(`
        *,
        users!inner(email, role)
      `)
      .eq('subscription_status', 'active')

    if (orgsError) {
      logger.error("Failed to fetch organizations", { error: orgsError })
      return { success: false, error: "Database error" }
    }

    if (!orgs || orgs.length === 0) {
      logger.info("No organizations to report on")
      return { success: true, generated: 0 }
    }

    logger.info(`Generating reports for ${orgs.length} organizations`)

    const results: { orgId: string; success: boolean; error?: string }[] = []

    for (const org of orgs) {
      try {
        // Gather metrics
        const metrics = await gatherOrgMetrics(supabase, org.id, periodStart, periodEnd)

        logger.info("Metrics gathered", { orgId: org.id, metrics })

        // Generate AI summary
        const aiSummary = await generateReportSummary(metrics)

        // Create report record
        const { data: report, error: reportError } = await supabase
          .from('reports')
          .insert({
            organization_id: org.id,
            report_type: 'weekly',
            period_start: periodStart,
            period_end: periodEnd,
            metrics,
            ai_summary: aiSummary.summary,
            ai_recommendations: aiSummary.recommendations
          })
          .select()
          .single()

        if (reportError) throw reportError

        // Find owner email
        const ownerUser = org.users.find((u: { role: string }) => u.role === 'owner')
        const recipientEmail = ownerUser?.email

        if (recipientEmail) {
          // Send email
          await sendTemplateEmail(recipientEmail, 'weekly_report', {
            weekOf,
            leads: metrics.leads,
            cpl: metrics.cpl.toFixed(2),
            booked: metrics.booked,
            roas: metrics.roas.toFixed(1),
            aiSummary: aiSummary.summary,
            reportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reports/${report.id}`
          })

          // Update report as sent
          await supabase
            .from('reports')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', report.id)

          logger.info("Report sent", { orgId: org.id, email: recipientEmail })
        }

        results.push({ orgId: org.id, success: true })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error("Report generation failed", { orgId: org.id, error: errorMessage })
        results.push({ orgId: org.id, success: false, error: errorMessage })
      }
    }

    const successCount = results.filter(r => r.success).length

    logger.info("Weekly reports complete", {
      total: orgs.length,
      success: successCount,
      failed: orgs.length - successCount
    })

    return {
      success: true,
      generated: successCount,
      failed: orgs.length - successCount,
      period: { start: periodStart, end: periodEnd }
    }
  }
})

// Helper function to gather metrics
async function gatherOrgMetrics(
  supabase: ReturnType<typeof createAdminClient>,
  orgId: string,
  periodStart: string,
  periodEnd: string
) {
  // Get leads for period (include source for breakdown)
  const { data: leads } = await supabase
    .from('leads')
    .select('id, stage, created_at, source')
    .eq('organization_id', orgId)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd + 'T23:59:59')

  const leadCount = leads?.length || 0
  const bookedCount = leads?.filter(l => l.stage === 'booked' || l.stage === 'won').length || 0
  const wonCount = leads?.filter(l => l.stage === 'won').length || 0

  // Get previous period for comparison
  const prevStart = format(subWeeks(new Date(periodStart), 1), 'yyyy-MM-dd')
  const prevEnd = format(subWeeks(new Date(periodEnd), 1), 'yyyy-MM-dd')

  const { data: prevLeads } = await supabase
    .from('leads')
    .select('id')
    .eq('organization_id', orgId)
    .gte('created_at', prevStart)
    .lte('created_at', prevEnd + 'T23:59:59')

  const prevLeadCount = prevLeads?.length || 0
  const leadsChange = prevLeadCount > 0
    ? ((leadCount - prevLeadCount) / prevLeadCount) * 100
    : 0

  // Get ad performance
  const { data: adPerf } = await supabase
    .from('ad_performance')
    .select('spend, leads, revenue')
    .eq('organization_id', orgId)
    .gte('date', periodStart)
    .lte('date', periodEnd)

  const totalSpend = adPerf?.reduce((sum, p) => sum + (p.spend || 0), 0) || 0
  const totalAdLeads = adPerf?.reduce((sum, p) => sum + (p.leads || 0), 0) || 0
  const totalRevenue = adPerf?.reduce((sum, p) => sum + (p.revenue || 0), 0) || 0

  const cpl = totalAdLeads > 0 ? totalSpend / totalAdLeads : 0
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0

  // Get previous period CPL for comparison
  const { data: prevAdPerf } = await supabase
    .from('ad_performance')
    .select('spend, leads')
    .eq('organization_id', orgId)
    .gte('date', prevStart)
    .lte('date', prevEnd)

  const prevSpend = prevAdPerf?.reduce((sum, p) => sum + (p.spend || 0), 0) || 0
  const prevAdLeads = prevAdPerf?.reduce((sum, p) => sum + (p.leads || 0), 0) || 0
  const prevCpl = prevAdLeads > 0 ? prevSpend / prevAdLeads : 0
  const cplChange = prevCpl > 0 ? ((cpl - prevCpl) / prevCpl) * 100 : 0

  // Get top campaigns
  const { data: campaigns } = await supabase
    .from('ad_campaigns')
    .select(`
      name,
      ad_performance!inner(spend, leads)
    `)
    .eq('organization_id', orgId)

  const topCampaigns = campaigns
    ?.map(c => ({
      name: c.name,
      leads: (c.ad_performance as { leads: number }[]).reduce((sum, p) => sum + (p.leads || 0), 0),
      spend: (c.ad_performance as { spend: number }[]).reduce((sum, p) => sum + (p.spend || 0), 0)
    }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5) || []

  // Aggregate lead sources
  const sourceColors: Record<string, string> = {
    'meta_ads': '#1877F2',
    'google_ads': '#4285F4',
    'form': '#6E0F1A',
    'manual': '#64748b',
    'calendly': '#006BFF',
    'calcom': '#292929',
    'zapier': '#FF4A00',
    'webhook': '#8B5CF6',
  }
  const sourceMap = new Map<string, number>()
  for (const lead of leads || []) {
    const src = (lead as { source?: string }).source || 'manual'
    sourceMap.set(src, (sourceMap.get(src) || 0) + 1)
  }
  const sourceBreakdown = Array.from(sourceMap.entries())
    .map(([source, count]) => ({
      source: source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      leads: count,
      percentage: leadCount > 0 ? Math.round((count / leadCount) * 100) : 0,
      cpl: totalSpend > 0 && leadCount > 0 ? totalSpend / leadCount : 0,
      color: sourceColors[source] || '#94a3b8',
    }))
    .sort((a, b) => b.leads - a.leads)

  return {
    leads: leadCount,
    leads_change: Math.round(leadsChange),
    spend: totalSpend,
    cpl,
    cpl_change: Math.round(cplChange),
    booked: bookedCount,
    won: wonCount,
    revenue: totalRevenue,
    roas,
    top_campaigns: topCampaigns,
    sourceBreakdown,
  }
}
