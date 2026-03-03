// app/api/insights/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeAdPerformance } from '@/lib/ai/claude'

// GET /api/insights - Get AI-powered dashboard insights
export async function GET(request: NextRequest) {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  const orgId = userData.organization_id

  // Date ranges
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  try {
    // ---- Always fetch lead context (useful regardless of ad data) ----

    // Lead counts this week vs last
    const { count: leadsThisWeek } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', weekAgo.toISOString())

    const { count: leadsLastWeek } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', weekAgo.toISOString())

    // Total leads
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)

    // Stale leads (not contacted in 48h)
    const { count: staleLeadsCount } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .in('stage', ['new', 'qualified'])
      .lt('created_at', new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString())

    // Hot leads pending follow-up
    const { data: hotLeads } = await supabase
      .from('leads')
      .select('id, first_name, last_name, ai_summary')
      .eq('organization_id', orgId)
      .eq('temperature', 'hot')
      .in('stage', ['new', 'qualified'])
      .limit(3)

    // Won leads this week (conversions)
    const { count: winsThisWeek } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('stage', 'won')
      .gte('updated_at', weekAgo.toISOString())

    // Stage breakdown
    const { data: stageCounts } = await supabase
      .from('leads')
      .select('stage')
      .eq('organization_id', orgId)

    const stageMap: Record<string, number> = {}
    for (const row of stageCounts || []) {
      stageMap[row.stage] = (stageMap[row.stage] || 0) + 1
    }

    // ---- Check integrations ----
    const { data: integrations } = await supabase
      .from('integrations')
      .select('provider, status')
      .eq('organization_id', orgId)

    const connectedPlatforms = (integrations || [])
      .filter((i: any) => i.status === 'active')
      .map((i: any) => i.provider)

    // ---- Ad campaign + performance data ----
    const { data: campaigns } = await supabase
      .from('ad_campaigns')
      .select('id, name, platform, status')
      .eq('organization_id', orgId)
      .eq('status', 'active')

    const { data: currentPerf } = await supabase
      .from('ad_performance')
      .select('campaign_id, spend, leads, impressions, clicks, revenue')
      .eq('organization_id', orgId)
      .gte('date', weekAgo.toISOString().split('T')[0])

    const { data: prevPerf } = await supabase
      .from('ad_performance')
      .select('campaign_id, spend, leads')
      .eq('organization_id', orgId)
      .gte('date', twoWeeksAgo.toISOString().split('T')[0])
      .lt('date', weekAgo.toISOString().split('T')[0])

    // Aggregate by campaign
    const campaignMetrics = new Map<string, {
      name: string
      spend: number
      leads: number
      cpl: number
      roas: number
      prevSpend: number
      prevLeads: number
    }>()

    for (const camp of campaigns || []) {
      const current = currentPerf?.filter(p => p.campaign_id === camp.id) || []
      const prev = prevPerf?.filter(p => p.campaign_id === camp.id) || []

      const currentSpend = current.reduce((s, p) => s + (p.spend || 0), 0)
      const currentLeads = current.reduce((s, p) => s + (p.leads || 0), 0)
      const currentRevenue = current.reduce((s, p) => s + (p.revenue || 0), 0)
      const prevSpend = prev.reduce((s, p) => s + (p.spend || 0), 0)
      const prevLeads = prev.reduce((s, p) => s + (p.leads || 0), 0)

      campaignMetrics.set(camp.id, {
        name: camp.name,
        spend: currentSpend,
        leads: currentLeads,
        cpl: currentLeads > 0 ? currentSpend / currentLeads : 0,
        roas: currentSpend > 0 ? currentRevenue / currentSpend : 0,
        prevSpend,
        prevLeads,
      })
    }

    // Get org settings for targets
    const { data: org } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', orgId)
      .single()

    const settings = org?.settings as { target_cpl?: number; target_roas?: number } | null

    // Format data for AI analysis
    const campaignsForAnalysis = Array.from(campaignMetrics.entries()).map(([_, data]) => {
      const leadChange = data.prevLeads > 0
        ? ((data.leads - data.prevLeads) / data.prevLeads) * 100
        : 0

      return {
        name: data.name,
        spend: data.spend,
        leads: data.leads,
        cpl: data.cpl,
        roas: data.roas,
        trend: leadChange > 5 ? 'up' as const : leadChange < -5 ? 'down' as const : 'stable' as const,
      }
    }).filter(c => c.spend > 0)

    // ---- Build insights based on available data ----
    const recommendations: { text: string; priority: string }[] = []
    const alerts: string[] = []
    let analysis = ''

    // High-priority: stale leads
    if (staleLeadsCount && staleLeadsCount > 0) {
      recommendations.push({
        text: `${staleLeadsCount} lead${staleLeadsCount === 1 ? '' : 's'} haven't been contacted in 48+ hours`,
        priority: 'high',
      })
    }

    // High-priority: hot leads
    for (const lead of hotLeads || []) {
      recommendations.push({
        text: `Follow up with ${lead.first_name} ${lead.last_name} — high buying intent`,
        priority: 'high',
      })
    }

    if (campaignsForAnalysis.length > 0) {
      // ---- Has ad performance data → call Claude for full analysis ----
      const aiInsights = await analyzeAdPerformance(
        campaignsForAnalysis,
        {
          target_cpl: settings?.target_cpl || 25,
          target_roas: settings?.target_roas || 3,
        }
      )

      analysis = aiInsights.analysis
      alerts.push(...aiInsights.alerts)

      for (const opt of aiInsights.optimizations) {
        recommendations.push({ text: opt, priority: 'medium' })
      }
    } else {
      // ---- No ad spend data → generate lead-based insights ----
      const thisWeek = leadsThisWeek || 0
      const lastWeek = leadsLastWeek || 0
      const total = totalLeads || 0
      const wins = winsThisWeek || 0

      // Build contextual analysis
      const parts: string[] = []

      if (total === 0) {
        parts.push('No leads captured yet. Add your first lead manually or connect an ad platform to start tracking.')
      } else {
        // Lead volume analysis
        if (thisWeek > lastWeek && lastWeek > 0) {
          const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
          parts.push(`Lead volume is up ${pct}% this week (${thisWeek} vs ${lastWeek} last week).`)
        } else if (thisWeek < lastWeek && lastWeek > 0) {
          const pct = Math.round(((lastWeek - thisWeek) / lastWeek) * 100)
          parts.push(`Lead volume dropped ${pct}% this week (${thisWeek} vs ${lastWeek} last week).`)
        } else if (thisWeek > 0) {
          parts.push(`${thisWeek} new lead${thisWeek === 1 ? '' : 's'} this week.`)
        } else {
          parts.push('No new leads this week.')
        }

        // Pipeline health
        const newCount = stageMap['new'] || 0
        const qualifiedCount = stageMap['qualified'] || 0
        const bookedCount = stageMap['booked'] || 0

        if (newCount > 5) {
          parts.push(`${newCount} leads sitting in 'New' stage — review and qualify them.`)
        }
        if (qualifiedCount > 3 && bookedCount === 0) {
          parts.push(`${qualifiedCount} qualified leads but no booked calls — focus on booking appointments.`)
        }
        if (wins > 0) {
          parts.push(`${wins} deal${wins === 1 ? '' : 's'} won this week.`)
        }
      }

      analysis = parts.join(' ')

      // Campaign status recommendations
      if ((campaigns || []).length > 0 && campaignsForAnalysis.length === 0) {
        // Has campaigns but no spend data
        recommendations.push({
          text: `${(campaigns || []).length} active campaign${(campaigns || []).length === 1 ? '' : 's'} found but no spend data synced yet — performance metrics will appear once ad data is imported`,
          priority: 'medium',
        })
      }

      // Integration recommendations
      if (connectedPlatforms.length === 0) {
        recommendations.push({
          text: 'Connect Meta Ads, Google Ads, or TikTok to see campaign performance insights',
          priority: 'medium',
        })
      }

      // Pipeline recommendations
      const newLeads = stageMap['new'] || 0
      if (newLeads > 3) {
        recommendations.push({
          text: `Review ${newLeads} unqualified leads in your pipeline`,
          priority: 'medium',
        })
      }

      // Alerts for concerning patterns
      if ((staleLeadsCount || 0) > 5) {
        alerts.push(`${staleLeadsCount} leads are going cold — contact them before they lose interest`)
      }
      if (thisWeek === 0 && lastWeek > 0) {
        alerts.push('Lead volume has dropped to zero this week')
      }
    }

    return NextResponse.json({
      analysis,
      alerts,
      optimizations: [],
      recommendations,
      meta: {
        hasCampaigns: (campaigns || []).length > 0,
        hasAdData: campaignsForAnalysis.length > 0,
        totalLeads: totalLeads || 0,
        leadsThisWeek: leadsThisWeek || 0,
        connectedPlatforms,
      },
    })
  } catch (error) {
    console.error('Insights generation error:', error)
    return NextResponse.json({
      analysis: 'Unable to generate insights at this time.',
      alerts: [],
      optimizations: [],
      recommendations: [],
      meta: { hasCampaigns: false, hasAdData: false, totalLeads: 0, leadsThisWeek: 0, connectedPlatforms: [] },
    })
  }
}
