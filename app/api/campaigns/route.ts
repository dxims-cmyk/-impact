// app/api/campaigns/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// GET /api/campaigns - List campaigns
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
  const limit = parseInt(searchParams.get('limit') || '20')
  const platform = searchParams.get('platform')
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  // Build query
  let query = supabase
    .from('ad_campaigns')
    .select(`
      *,
      integration:integrations(provider, account_name, status)
    `, { count: 'exact' })

  // Filter by org
  if (!userData.is_agency_user) {
    query = query.eq('organization_id', userData.organization_id)
  }

  // Apply filters
  if (platform) query = query.eq('platform', platform)
  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('name', `%${search}%`)

  // Order by name
  query = query.order('name', { ascending: true })

  // Pagination
  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data: campaigns, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get performance data for each campaign
  const campaignsWithPerformance = await Promise.all(
    (campaigns || []).map(async (campaign) => {
      const perfQuery = supabase
        .from('ad_performance')
        .select('*')
        .eq('campaign_id', campaign.id)

      if (startDate) perfQuery.gte('date', startDate)
      if (endDate) perfQuery.lte('date', endDate)

      const { data: perfData } = await perfQuery

      // Aggregate performance
      const performance = perfData?.reduce(
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

      // Calculate derived metrics
      const ctr = performance?.impressions > 0 ? (performance.clicks / performance.impressions) * 100 : 0
      const cpc = performance?.clicks > 0 ? performance.spend / performance.clicks : 0
      const cpl = performance?.leads > 0 ? performance.spend / performance.leads : 0
      const roas = performance?.spend > 0 ? performance.revenue / performance.spend : 0

      return {
        ...campaign,
        performance: performance ? {
          ...performance,
          ctr,
          cpc,
          cpl,
          roas,
        } : null,
      }
    })
  )

  return NextResponse.json({
    campaigns: campaignsWithPerformance,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil((count || 0) / limit)
    }
  })
}

// Validation schema for creating campaigns
const createCampaignSchema = z.object({
  name: z.string().min(1),
  platform: z.enum(['meta', 'google', 'tiktok']),
  external_id: z.string().min(1),
  objective: z.string().nullable().optional(),
  budget_daily: z.number().nullable().optional(),
  budget_lifetime: z.number().nullable().optional(),
  status: z.string().optional(),
})

// POST /api/campaigns - Create campaign manually
export async function POST(request: NextRequest): Promise<NextResponse> {
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
  const validation = createCampaignSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten(),
    }, { status: 400 })
  }

  // Find or create a placeholder integration for manual campaigns
  let integrationId: string
  const { data: existingIntegration } = await supabase
    .from('integrations')
    .select('id')
    .eq('organization_id', userData.organization_id)
    .eq('provider', `${validation.data.platform}_ads`)
    .single()

  if (existingIntegration) {
    integrationId = existingIntegration.id
  } else {
    const { data: newIntegration, error: intError } = await supabase
      .from('integrations')
      .insert({
        organization_id: userData.organization_id,
        provider: `${validation.data.platform}_ads` as 'meta_ads' | 'google_ads' | 'tiktok_ads',
        status: 'connected',
        account_name: 'Manual',
      })
      .select('id')
      .single()

    if (intError || !newIntegration) {
      return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 })
    }
    integrationId = newIntegration.id
  }

  // Create campaign
  const { data: campaign, error: createError } = await supabase
    .from('ad_campaigns')
    .insert({
      organization_id: userData.organization_id,
      integration_id: integrationId,
      platform: validation.data.platform,
      external_id: validation.data.external_id,
      name: validation.data.name,
      objective: validation.data.objective,
      budget_daily: validation.data.budget_daily,
      budget_lifetime: validation.data.budget_lifetime,
      status: validation.data.status || 'active',
    })
    .select()
    .single()

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  return NextResponse.json({ campaign }, { status: 201 })
}
