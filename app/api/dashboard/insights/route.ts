// app/api/dashboard/insights/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 403 })

  const orgId = userData.organization_id
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

  // Hot leads this week (score >= 7)
  const { count: hotThisWeek } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('score', 7)
    .gte('created_at', weekAgo)

  // Hot leads last week
  const { count: hotLastWeek } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('score', 7)
    .gte('created_at', twoWeeksAgo)
    .lt('created_at', weekAgo)

  // Total leads
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  // Converted leads (won/converted stage)
  const { count: convertedLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .in('stage', ['converted', 'won'])

  // New leads this week
  const { count: newThisWeek } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('created_at', weekAgo)

  // New leads last week
  const { count: newLastWeek } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('created_at', twoWeeksAgo)
    .lt('created_at', weekAgo)

  const hotChange = (hotLastWeek || 0) > 0
    ? Math.round(((hotThisWeek || 0) - (hotLastWeek || 0)) / (hotLastWeek || 1) * 100)
    : (hotThisWeek || 0) > 0 ? 100 : 0

  const conversionRate = (totalLeads || 0) > 0
    ? Math.round(((convertedLeads || 0) / (totalLeads || 1)) * 100)
    : 0

  const newLeadChange = (newLastWeek || 0) > 0
    ? Math.round(((newThisWeek || 0) - (newLastWeek || 0)) / (newLastWeek || 1) * 100)
    : (newThisWeek || 0) > 0 ? 100 : 0

  const insights = []

  // Insight 1: Hot leads trend
  if ((hotThisWeek || 0) > 0 || (hotLastWeek || 0) > 0) {
    insights.push({
      type: hotChange >= 0 ? 'success' : 'warning',
      title: hotChange >= 0 ? 'Hot leads trending up' : 'Hot leads declining',
      description: `${hotThisWeek || 0} hot leads this week${hotChange !== 0 ? ` (${hotChange > 0 ? '+' : ''}${hotChange}% vs last week)` : ''}. ${(hotThisWeek || 0) > (hotLastWeek || 0) ? 'Great momentum!' : 'Consider reviewing your lead sources.'}`,
    })
  }

  // Insight 2: Conversion rate
  insights.push({
    type: conversionRate >= 10 ? 'success' : conversionRate > 0 ? 'recommendation' : 'warning',
    title: `${conversionRate}% conversion rate`,
    description: `${convertedLeads || 0} of ${totalLeads || 0} leads converted.${conversionRate < 10 && (totalLeads || 0) > 5 ? ' Automations could help improve follow-up.' : conversionRate >= 10 ? ' Strong performance!' : ''}`,
    ...(conversionRate < 10 && (totalLeads || 0) > 5 ? { action: { label: 'Set up automations', href: '/dashboard/automations' } } : {}),
  })

  // Insight 3: New lead volume
  if ((newThisWeek || 0) > 0 || (newLastWeek || 0) > 0) {
    insights.push({
      type: newLeadChange >= 0 ? 'success' : 'warning',
      title: `${newThisWeek || 0} new leads this week`,
      description: newLeadChange !== 0
        ? `${newLeadChange > 0 ? 'Up' : 'Down'} ${Math.abs(newLeadChange)}% compared to last week.`
        : 'Consistent volume with last week.',
      ...(newLeadChange < -20 ? { action: { label: 'Review campaigns', href: '/dashboard/campaigns' } } : {}),
    })
  }

  // Fallback if no data at all
  if (insights.length === 0) {
    insights.push({
      type: 'recommendation',
      title: 'Get started',
      description: 'Add your first leads to start seeing insights here.',
      action: { label: 'Add lead', href: '/dashboard/leads' },
    })
  }

  return NextResponse.json({
    insights,
    updatedAt: now.toISOString(),
  })
}
