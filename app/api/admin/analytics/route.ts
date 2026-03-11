import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.is_agency_user) {
    return NextResponse.json({ error: 'Admin required' }, { status: 403 })
  }

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, plan, created_at')

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Count leads per org (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: recentLeads } = await supabase
    .from('leads')
    .select('id, organization_id, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Count messages per org (last 30 days)
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('id, organization_id, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Count integrations per org to determine feature adoption
  const { data: integrations } = await supabase
    .from('integrations')
    .select('id, organization_id, provider')

  const clients = (orgs || []).map((org) => {
    const orgLeads = recentLeads?.filter(l => l.organization_id === org.id) || []
    const orgMessages = recentMessages?.filter(m => m.organization_id === org.id) || []

    const leadsCount = orgLeads.length
    const messagesCount = orgMessages.length

    // Recent activity: leads or messages in last 7 days
    const recentLeadActivity = orgLeads.filter(l =>
      new Date(l.created_at) >= sevenDaysAgo
    ).length
    const recentMessageActivity = orgMessages.filter(m =>
      new Date(m.created_at) >= sevenDaysAgo
    ).length
    const recentActivity = recentLeadActivity + recentMessageActivity

    const healthScore = Math.min(100, Math.round(
      (Math.min(recentActivity, 7) * 10) +
      (leadsCount > 0 ? 20 : 0) +
      (messagesCount > 0 ? 20 : 0)
    ))

    let trend: string = 'stable'
    // Compare first half vs second half of 30 day period
    const midpoint = new Date()
    midpoint.setDate(midpoint.getDate() - 15)
    const firstHalfLeads = orgLeads.filter(l => new Date(l.created_at) < midpoint).length
    const secondHalfLeads = orgLeads.filter(l => new Date(l.created_at) >= midpoint).length
    if (secondHalfLeads > firstHalfLeads * 1.2) trend = 'growing'
    if (secondHalfLeads < firstHalfLeads * 0.8) trend = 'declining'

    let churnRisk = 'low'
    if (recentActivity === 0) churnRisk = 'high'
    else if (recentActivity < 3) churnRisk = 'medium'

    return {
      id: org.id,
      name: org.name,
      plan: org.plan || 'core',
      healthScore,
      trend,
      churnRisk,
      lastActive: orgLeads.length > 0
        ? orgLeads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at
        : undefined,
      leadsCount,
      messagesCount
    }
  })

  clients.sort((a, b) => a.healthScore - b.healthScore)

  const totalOrgs = orgs?.length || 0

  // Feature adoption based on connected integrations
  const featureAdoption = [
    { name: 'WhatsApp', count: new Set(integrations?.filter(i => i.provider === 'whatsapp').map(i => i.organization_id)).size },
    { name: 'SMS', count: new Set(integrations?.filter(i => i.provider === 'twilio').map(i => i.organization_id)).size },
    { name: 'Email', count: new Set(integrations?.filter(i => i.provider === 'resend').map(i => i.organization_id)).size },
    { name: 'Meta Ads', count: new Set(integrations?.filter(i => i.provider === 'meta_ads').map(i => i.organization_id)).size },
    { name: 'Google Ads', count: new Set(integrations?.filter(i => i.provider === 'google_ads').map(i => i.organization_id)).size },
  ].map(f => ({
    ...f,
    percentage: totalOrgs ? Math.round((f.count / totalOrgs) * 100) : 0
  }))

  return NextResponse.json({
    totalOrgs,
    activeThisWeek: clients.filter(c => c.churnRisk !== 'high').length,
    avgHealthScore: Math.round(
      clients.reduce((sum, c) => sum + c.healthScore, 0) / (clients.length || 1)
    ),
    highChurnRisk: clients.filter(c => c.churnRisk === 'high').length,
    clients,
    featureAdoption
  })
}
