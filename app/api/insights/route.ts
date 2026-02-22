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
    // Get campaign performance data
    const { data: campaigns } = await supabase
      .from('ad_campaigns')
      .select(`
        id,
        name,
        platform,
        status
      `)
      .eq('organization_id', orgId)
      .eq('status', 'active')

    // Get performance metrics
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

    // Only call AI if there's data
    if (campaignsForAnalysis.length === 0) {
      return NextResponse.json({
        analysis: 'No campaign data available yet. Connect your ad accounts to see AI insights.',
        alerts: [],
        optimizations: ['Connect Meta Ads, Google Ads, or TikTok Ads to get started'],
        recommendations: [
          { text: 'Connect your first ad platform', priority: 'high' },
          { text: 'Set up lead form webhooks', priority: 'medium' },
          { text: 'Configure speed-to-lead automation', priority: 'medium' },
        ],
      })
    }

    // Call Claude for analysis
    const aiInsights = await analyzeAdPerformance(
      campaignsForAnalysis,
      {
        target_cpl: settings?.target_cpl || 25,
        target_roas: settings?.target_roas || 3,
      }
    )

    // Get additional context
    // Stale leads (not contacted in 48h)
    const { count: staleLeadsCount } = await supabase
      .from('leads')
      .select('id', { count: 'exact' })
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

    // Build recommendations
    const recommendations = []

    if (staleLeadsCount && staleLeadsCount > 0) {
      recommendations.push({
        text: `${staleLeadsCount} leads haven't been contacted in 48+ hours`,
        priority: 'high',
      })
    }

    for (const lead of hotLeads || []) {
      recommendations.push({
        text: `Follow up with ${lead.first_name} ${lead.last_name} - high buying intent`,
        priority: 'high',
      })
    }

    // Add AI optimizations as recommendations
    for (const opt of aiInsights.optimizations) {
      recommendations.push({
        text: opt,
        priority: 'medium',
      })
    }

    return NextResponse.json({
      analysis: aiInsights.analysis,
      alerts: aiInsights.alerts,
      optimizations: aiInsights.optimizations,
      recommendations,
    })
  } catch (error) {
    console.error('Insights generation error:', error)
    return NextResponse.json({
      analysis: 'Unable to generate insights at this time.',
      alerts: [],
      optimizations: [],
      recommendations: [],
    })
  }
}
