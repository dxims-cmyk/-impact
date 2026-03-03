// app/api/dashboard/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/dashboard/metrics - Get dashboard KPIs
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

  // Agency users can view another org's metrics via ?org= param
  const requestedOrg = request.nextUrl.searchParams.get('org')
  const orgId = (userData.is_agency_user && requestedOrg) ? requestedOrg : userData.organization_id

  // Date ranges
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // Current week leads
  const { data: currentLeads, count: currentCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .gte('created_at', weekAgo.toISOString())

  // Previous week leads
  const { count: prevCount } = await supabase
    .from('leads')
    .select('id', { count: 'exact' })
    .eq('organization_id', orgId)
    .gte('created_at', twoWeeksAgo.toISOString())
    .lt('created_at', weekAgo.toISOString())

  // Calculate lead change
  const leadsChange = prevCount && prevCount > 0
    ? ((currentCount! - prevCount) / prevCount) * 100
    : 0

  // Get current week ad performance
  const { data: adPerf } = await supabase
    .from('ad_performance')
    .select('spend, leads, revenue')
    .eq('organization_id', orgId)
    .gte('date', weekAgo.toISOString().split('T')[0])

  // Get previous week ad performance
  const { data: prevAdPerf } = await supabase
    .from('ad_performance')
    .select('spend, leads, revenue')
    .eq('organization_id', orgId)
    .gte('date', twoWeeksAgo.toISOString().split('T')[0])
    .lt('date', weekAgo.toISOString().split('T')[0])

  // Aggregate ad metrics
  const currentSpend = adPerf?.reduce((sum, p) => sum + (p.spend || 0), 0) || 0
  const currentAdLeads = adPerf?.reduce((sum, p) => sum + (p.leads || 0), 0) || 0
  const currentRevenue = adPerf?.reduce((sum, p) => sum + (p.revenue || 0), 0) || 0

  const prevSpend = prevAdPerf?.reduce((sum, p) => sum + (p.spend || 0), 0) || 0
  const prevAdLeads = prevAdPerf?.reduce((sum, p) => sum + (p.leads || 0), 0) || 0

  // Calculate CPL
  const cpl = currentAdLeads > 0 ? currentSpend / currentAdLeads : 0
  const prevCpl = prevAdLeads > 0 ? prevSpend / prevAdLeads : 0
  const cplChange = prevCpl > 0 ? ((cpl - prevCpl) / prevCpl) * 100 : 0

  // Calculate ROAS
  const roas = currentSpend > 0 ? currentRevenue / currentSpend : 0
  const prevRevenue = prevAdPerf?.reduce((sum, p) => sum + ((p as any).revenue || 0), 0) || 0
  const prevRoas = prevSpend > 0 ? prevRevenue / prevSpend : 0
  const roasChange = prevRoas > 0 ? ((roas - prevRoas) / prevRoas) * 100 : 0

  // Get booked appointments this week
  const { count: bookedCount } = await supabase
    .from('appointments')
    .select('id', { count: 'exact' })
    .eq('organization_id', orgId)
    .gte('created_at', weekAgo.toISOString())

  // Get previous week bookings
  const { count: prevBookedCount } = await supabase
    .from('appointments')
    .select('id', { count: 'exact' })
    .eq('organization_id', orgId)
    .gte('created_at', twoWeeksAgo.toISOString())
    .lt('created_at', weekAgo.toISOString())

  const bookedChange = prevBookedCount && prevBookedCount > 0
    ? ((bookedCount! - prevBookedCount) / prevBookedCount) * 100
    : 0

  // Pipeline counts
  const { data: pipelineData } = await supabase
    .from('leads')
    .select('stage')
    .eq('organization_id', orgId)

  const pipeline = ['new', 'qualified', 'contacted', 'booked', 'won', 'lost'].map(stage => ({
    stage,
    count: pipelineData?.filter(l => l.stage === stage).length || 0,
  }))

  // Recent leads (last 5)
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json({
    leads: currentCount || 0,
    leadsChange: Math.round(leadsChange),
    cpl: Math.round(cpl * 100) / 100,
    cplChange: Math.round(cplChange),
    booked: bookedCount || 0,
    bookedChange: Math.round(bookedChange),
    roas: Math.round(roas * 10) / 10,
    roasChange: Math.round(roasChange),
    pipeline,
    recentLeads: recentLeads || [],
  })
}
