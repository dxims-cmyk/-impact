// app/api/campaigns/[id]/performance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/campaigns/[id]/performance - Get daily performance data for a campaign
export async function GET(
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

  // Get user's org
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id, is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id && !userData?.is_agency_user) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Verify campaign belongs to user's org
  let campaignQuery = supabase
    .from('ad_campaigns')
    .select('id')
    .eq('id', id)

  if (!userData.is_agency_user) {
    campaignQuery = campaignQuery.eq('organization_id', userData.organization_id)
  }

  const { data: campaign } = await campaignQuery.single()
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // Get date range from query params
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  // Fetch performance data
  let perfQuery = supabase
    .from('ad_performance')
    .select('*')
    .eq('campaign_id', id)
    .order('date', { ascending: true })

  if (startDate) perfQuery = perfQuery.gte('date', startDate)
  if (endDate) perfQuery = perfQuery.lte('date', endDate)

  const { data: performance, error } = await perfQuery

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(performance || [])
}
