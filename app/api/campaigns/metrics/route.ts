// app/api/campaigns/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/campaigns/metrics - Get aggregated campaign metrics
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
    .select('organization_id, is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id && !userData?.is_agency_user) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Parse query params
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]

  // Calculate previous period for comparison
  const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
  const prevStartDate = new Date(new Date(startDate).getTime() - daysDiff * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const prevEndDate = new Date(new Date(startDate).getTime() - 1).toISOString().split('T')[0]

  // Build base query
  let perfQuery = supabase
    .from('ad_performance')
    .select('*, campaign:ad_campaigns(id, name, platform)')

  // Agency users can specify ?org= to view a specific client's metrics
  const orgParam = searchParams.get('org')
  if (userData.is_agency_user && orgParam) {
    perfQuery = perfQuery.eq('organization_id', orgParam)
  } else if (!userData.is_agency_user) {
    perfQuery = perfQuery.eq('organization_id', userData.organization_id)
  }

  // Get current period data
  const { data: currentData } = await perfQuery
    .gte('date', startDate)
    .lte('date', endDate)

  // Get previous period data
  let prevQuery = supabase
    .from('ad_performance')
    .select('spend, leads, clicks, impressions')

  if (!userData.is_agency_user) {
    prevQuery = prevQuery.eq('organization_id', userData.organization_id)
  }

  const { data: prevData } = await prevQuery
    .gte('date', prevStartDate)
    .lte('date', prevEndDate)

  // Aggregate current period
  const current = (currentData || []).reduce(
    (acc, p) => ({
      impressions: acc.impressions + (p.impressions || 0),
      clicks: acc.clicks + (p.clicks || 0),
      spend: acc.spend + (p.spend || 0),
      leads: acc.leads + (p.leads || 0),
      conversions: acc.conversions + (p.conversions || 0),
      revenue: acc.revenue + (p.revenue || 0),
    }),
    { impressions: 0, clicks: 0, spend: 0, leads: 0, conversions: 0, revenue: 0 }
  )

  // Aggregate previous period
  const previous = (prevData || []).reduce(
    (acc, p) => ({
      spend: acc.spend + (p.spend || 0),
      leads: acc.leads + (p.leads || 0),
    }),
    { spend: 0, leads: 0 }
  )

  // Calculate derived metrics
  const avgCpl = current.leads > 0 ? current.spend / current.leads : 0
  const avgCtr = current.impressions > 0 ? (current.clicks / current.impressions) * 100 : 0
  const avgRoas = current.spend > 0 ? current.revenue / current.spend : 0

  // Calculate changes
  const spendChange = previous.spend > 0 ? ((current.spend - previous.spend) / previous.spend) * 100 : 0
  const leadsChange = previous.leads > 0 ? ((current.leads - previous.leads) / previous.leads) * 100 : 0

  // Group by platform
  const byPlatformMap = new Map<string, { spend: number; leads: number }>()
  for (const p of currentData || []) {
    const platform = p.campaign?.platform || 'unknown'
    const existing = byPlatformMap.get(platform) || { spend: 0, leads: 0 }
    byPlatformMap.set(platform, {
      spend: existing.spend + (p.spend || 0),
      leads: existing.leads + (p.leads || 0),
    })
  }

  const byPlatform = Array.from(byPlatformMap.entries()).map(([platform, data]) => ({
    platform,
    spend: data.spend,
    leads: data.leads,
    cpl: data.leads > 0 ? data.spend / data.leads : 0,
  }))

  // Get top campaigns
  const campaignPerf = new Map<string, { name: string; platform: string; spend: number; leads: number; revenue: number }>()
  for (const p of currentData || []) {
    if (!p.campaign) continue
    const existing = campaignPerf.get(p.campaign.id) || {
      name: p.campaign.name,
      platform: p.campaign.platform,
      spend: 0,
      leads: 0,
      revenue: 0,
    }
    campaignPerf.set(p.campaign.id, {
      ...existing,
      spend: existing.spend + (p.spend || 0),
      leads: existing.leads + (p.leads || 0),
      revenue: existing.revenue + (p.revenue || 0),
    })
  }

  const topCampaigns = Array.from(campaignPerf.entries())
    .map(([id, data]) => ({
      id,
      ...data,
      cpl: data.leads > 0 ? data.spend / data.leads : 0,
      roas: data.spend > 0 ? data.revenue / data.spend : 0,
    }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5)

  return NextResponse.json({
    totalSpend: current.spend,
    totalLeads: current.leads,
    totalClicks: current.clicks,
    totalImpressions: current.impressions,
    avgCpl,
    avgCtr,
    avgRoas,
    spendChange,
    leadsChange,
    byPlatform,
    topCampaigns,
  })
}
