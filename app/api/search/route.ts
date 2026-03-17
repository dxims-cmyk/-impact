import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

interface SearchResultItem {
  id: string
  type: string
  title: string
  subtitle: string
  href: string
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    const { data: userData } = await adminSupabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 })
    }

    const q = new URL(request.url).searchParams.get('q')?.trim()
    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const orgId = userData.organization_id
    const pattern = `%${q}%`

    // Search leads
    const { data: leads } = await supabase
      .from('leads')
      .select('id, first_name, last_name, email, company, stage, temperature')
      .eq('organization_id', orgId)
      .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},company.ilike.${pattern}`)
      .limit(5)

    // Search appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, title, start_time, status')
      .eq('organization_id', orgId)
      .ilike('title', pattern)
      .limit(3)

    // Search campaigns
    const { data: campaigns } = await supabase
      .from('ad_campaigns')
      .select('id, name, platform, status')
      .eq('organization_id', orgId)
      .ilike('name', pattern)
      .limit(3)

    const results: SearchResultItem[] = []

    // Map leads
    for (const lead of leads || []) {
      const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'
      const tempLabel = lead.temperature
        ? `${lead.temperature.charAt(0).toUpperCase() + lead.temperature.slice(1)} Lead`
        : ''
      results.push({
        id: lead.id,
        type: 'lead',
        title: name,
        subtitle: [lead.company, tempLabel].filter(Boolean).join(' \u2022 ') || lead.email || '',
        href: `/dashboard/leads/${lead.id}`,
      })
    }

    // Map appointments
    for (const apt of appointments || []) {
      const date = new Date(apt.start_time).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
      results.push({
        id: apt.id,
        type: 'appointment',
        title: apt.title,
        subtitle: date,
        href: '/dashboard/calendar',
      })
    }

    // Map campaigns
    for (const camp of campaigns || []) {
      const platformLabel = camp.platform
        ? camp.platform.charAt(0).toUpperCase() + camp.platform.slice(1)
        : ''
      results.push({
        id: camp.id,
        type: 'campaign',
        title: camp.name,
        subtitle: [platformLabel, camp.status].filter(Boolean).join(' \u2022 '),
        href: '/dashboard/campaigns',
      })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    )
  }
}
