import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

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

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: metrics } = await supabase
    .from('usage_metrics')
    .select('*')
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

  const clients = (orgs || []).map((org) => {
    const orgMetrics = metrics?.filter(m => m.organization_id === org.id) || []

    const leadsCount = orgMetrics.reduce((sum, m) => sum + (m.leads_created || 0), 0)
    const messagesCount = orgMetrics.reduce((sum, m) => sum + (m.messages_sent || 0), 0)
    const totalViews = orgMetrics.reduce((sum, m) =>
      sum + (m.views_dashboard || 0) + (m.views_leads || 0) + (m.views_conversations || 0), 0
    )

    const lastMetric = orgMetrics.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0]

    const recentActivity = orgMetrics.filter(m => {
      const d = new Date(m.date)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return d >= sevenDaysAgo
    }).length

    const healthScore = Math.min(100, Math.round(
      (recentActivity * 10) +
      (leadsCount > 0 ? 20 : 0) +
      (messagesCount > 0 ? 20 : 0) +
      (totalViews > 50 ? 20 : totalViews / 2.5)
    ))

    const firstHalf = orgMetrics.slice(0, Math.floor(orgMetrics.length / 2))
    const secondHalf = orgMetrics.slice(Math.floor(orgMetrics.length / 2))
    const firstHalfViews = firstHalf.reduce((sum, m) => sum + (m.views_dashboard || 0), 0)
    const secondHalfViews = secondHalf.reduce((sum, m) => sum + (m.views_dashboard || 0), 0)

    let trend = 'stable'
    if (secondHalfViews > firstHalfViews * 1.2) trend = 'growing'
    if (secondHalfViews < firstHalfViews * 0.8) trend = 'declining'

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
      lastActive: lastMetric?.date,
      leadsCount,
      messagesCount
    }
  })

  clients.sort((a, b) => a.healthScore - b.healthScore)

  const totalOrgs = orgs?.length || 0
  const featureAdoption = [
    { name: 'WhatsApp', count: metrics?.filter(m => m.uses_whatsapp).length || 0 },
    { name: 'SMS', count: metrics?.filter(m => m.uses_sms).length || 0 },
    { name: 'Email', count: metrics?.filter(m => m.uses_email).length || 0 },
    { name: 'Automations', count: metrics?.filter(m => m.uses_automations).length || 0 },
    { name: 'Forms', count: metrics?.filter(m => m.uses_forms).length || 0 },
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
