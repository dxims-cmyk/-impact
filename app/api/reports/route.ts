// app/api/reports/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateReportSummary } from '@/lib/ai/claude'
import { z } from 'zod'

const createReportSchema = z.object({
  report_type: z.enum(['weekly', 'monthly', 'custom']),
  period_start: z.string(),
  period_end: z.string(),
})

// GET /api/reports - List reports
export async function GET(request: NextRequest) {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org (admin client bypasses RLS)
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id, is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id && !userData?.is_agency_user) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Parse query params
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const type = searchParams.get('type')

  // Build query
  let query = supabase
    .from('reports')
    .select('*', { count: 'exact' })

  // Filter by org — agency users can specify ?org= to view a specific client
  const orgParam = searchParams.get('org')
  if (userData.is_agency_user && orgParam) {
    query = query.eq('organization_id', orgParam)
  } else if (!userData.is_agency_user) {
    query = query.eq('organization_id', userData.organization_id)
  }

  if (type) query = query.eq('report_type', type)

  // Order by created date
  query = query.order('created_at', { ascending: false })

  // Pagination
  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data: reports, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    reports,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil((count || 0) / limit)
    }
  })
}

// POST /api/reports - Generate new report
export async function POST(request: NextRequest) {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org (admin client bypasses RLS)
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Parse and validate body
  const body = await request.json()
  const validation = createReportSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const { report_type, period_start, period_end } = validation.data

  try {
    // Calculate previous period for comparison
    const daysDiff = Math.ceil((new Date(period_end).getTime() - new Date(period_start).getTime()) / (1000 * 60 * 60 * 24))
    const prevStart = new Date(new Date(period_start).getTime() - daysDiff * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Get current period leads (include source for breakdown)
    const { data: leads } = await supabase
      .from('leads')
      .select('id, stage, score, source')
      .eq('organization_id', userData.organization_id)
      .gte('created_at', period_start)
      .lte('created_at', period_end)

    // Get previous period leads for comparison
    const { data: prevLeads } = await supabase
      .from('leads')
      .select('id')
      .eq('organization_id', userData.organization_id)
      .gte('created_at', prevStart)
      .lt('created_at', period_start)

    // Get ad performance
    const { data: adPerf } = await supabase
      .from('ad_performance')
      .select('spend, leads, revenue, conversions, campaign:ad_campaigns(name, platform)')
      .eq('organization_id', userData.organization_id)
      .gte('date', period_start)
      .lte('date', period_end)

    // Aggregate metrics
    const leadsCount = leads?.length || 0
    const prevLeadsCount = prevLeads?.length || 0
    const leadsChange = prevLeadsCount > 0 ? ((leadsCount - prevLeadsCount) / prevLeadsCount) * 100 : 0

    const totalSpend = adPerf?.reduce((sum, p) => sum + (p.spend || 0), 0) || 0
    const totalAdLeads = adPerf?.reduce((sum, p) => sum + (p.leads || 0), 0) || 0
    const totalRevenue = adPerf?.reduce((sum, p) => sum + (p.revenue || 0), 0) || 0

    const cpl = totalAdLeads > 0 ? totalSpend / totalAdLeads : 0
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0

    const bookedCount = leads?.filter(l => l.stage === 'booked' || l.stage === 'won').length || 0
    const wonCount = leads?.filter(l => l.stage === 'won').length || 0

    // Group by campaign
    const campaignMap = new Map<string, { name: string; platform: string; leads: number; spend: number; revenue: number }>()
    for (const p of adPerf || []) {
      const name = p.campaign?.name || 'Unknown'
      const platform = (p.campaign as { platform?: string })?.platform || 'unknown'
      const existing = campaignMap.get(name) || { name, platform, leads: 0, spend: 0, revenue: 0 }
      campaignMap.set(name, {
        name,
        platform,
        leads: existing.leads + (p.leads || 0),
        spend: existing.spend + (p.spend || 0),
        revenue: existing.revenue + (p.revenue || 0),
      })
    }

    const topCampaigns = Array.from(campaignMap.values())
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 10)
      .map(c => ({
        ...c,
        cpl: c.leads > 0 ? Math.round((c.spend / c.leads) * 100) / 100 : 0,
        roas: c.spend > 0 ? Math.round((c.revenue / c.spend) * 10) / 10 : 0,
      }))

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
      const src = lead.source || 'manual'
      sourceMap.set(src, (sourceMap.get(src) || 0) + 1)
    }
    const sourceBreakdown = Array.from(sourceMap.entries())
      .map(([source, count]) => ({
        source: source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        leads: count,
        percentage: leadsCount > 0 ? Math.round((count / leadsCount) * 100) : 0,
        cpl: totalSpend > 0 && leadsCount > 0 ? totalSpend / leadsCount : 0,
        color: sourceColors[source] || '#94a3b8',
      }))
      .sort((a, b) => b.leads - a.leads)

    // Build metrics object
    const metrics = {
      leads: leadsCount,
      leads_change: leadsChange,
      spend: totalSpend,
      cpl,
      cpl_change: 0, // Would need previous period calculation
      booked: bookedCount,
      won: wonCount,
      revenue: totalRevenue,
      roas,
      top_campaigns: topCampaigns,
      campaignPerformance: topCampaigns,
      sourceBreakdown,
    }

    // Generate AI summary
    const aiResult = await generateReportSummary({
      leads: leadsCount,
      leads_change: leadsChange,
      spend: totalSpend,
      cpl,
      cpl_change: 0,
      booked: bookedCount,
      won: wonCount,
      revenue: totalRevenue,
      roas,
      top_campaigns: topCampaigns,
    })

    // Create report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        organization_id: userData.organization_id,
        report_type,
        period_start,
        period_end,
        metrics,
        ai_summary: aiResult.summary,
        ai_recommendations: aiResult.recommendations,
      })
      .select()
      .single()

    if (reportError) {
      return NextResponse.json({ error: reportError.message }, { status: 500 })
    }

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
