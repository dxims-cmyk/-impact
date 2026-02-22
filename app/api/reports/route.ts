// app/api/reports/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const type = searchParams.get('type')

  // Build query
  let query = supabase
    .from('reports')
    .select('*', { count: 'exact' })

  // Filter by org
  if (!userData.is_agency_user) {
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

  // Get user's org
  const { data: userData } = await supabase
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

    // Get current period leads
    const { data: leads } = await supabase
      .from('leads')
      .select('id, stage, score')
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
      .select('spend, leads, revenue, campaign:ad_campaigns(name)')
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
    const campaignMap = new Map<string, { name: string; leads: number; spend: number }>()
    for (const p of adPerf || []) {
      const name = p.campaign?.name || 'Unknown'
      const existing = campaignMap.get(name) || { name, leads: 0, spend: 0 }
      campaignMap.set(name, {
        name,
        leads: existing.leads + (p.leads || 0),
        spend: existing.spend + (p.spend || 0),
      })
    }

    const topCampaigns = Array.from(campaignMap.values())
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 5)

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
