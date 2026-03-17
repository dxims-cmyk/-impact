import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { DAILY_SCRAPE_LIMIT } from '@/lib/rate-limit'

// POST — bulk import results from Apify into outbound_leads table
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id, is_agency_user')
    .eq('id', user.id)
    .single() as { data: { organization_id: string; is_agency_user: boolean } | null }

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const body = await request.json()
  const { results, searchTerm, searchLocation } = body

  if (!Array.isArray(results) || results.length === 0) {
    return NextResponse.json({ error: 'No results to import' }, { status: 400 })
  }

  // --- Hard cap: never accept more than DAILY_SCRAPE_LIMIT in a single request ---
  if (results.length > DAILY_SCRAPE_LIMIT) {
    return NextResponse.json(
      { error: `Cannot import more than ${DAILY_SCRAPE_LIMIT} leads at once` },
      { status: 400 }
    )
  }

  // --- DB-enforced daily limit: count today's existing imports ---
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const { count: todaysCount, error: countError } = await supabase
    .from('outbound_leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', userData.organization_id)
    .gte('created_at', todayStart.toISOString())

  if (countError) {
    console.error('Failed to check daily import count:', countError)
    return NextResponse.json({ error: 'Failed to verify daily limit' }, { status: 500 })
  }

  const currentCount = todaysCount || 0
  const remaining = DAILY_SCRAPE_LIMIT - currentCount

  if (remaining <= 0) {
    return NextResponse.json(
      { error: `Daily limit of ${DAILY_SCRAPE_LIMIT} leads reached. Resets at midnight UTC.` },
      { status: 429 }
    )
  }

  // Truncate results to what's actually allowed
  const allowedResults = results.slice(0, remaining)

  const rows = allowedResults.map((r: Record<string, unknown>) => ({
    organization_id: userData.organization_id,
    created_by: user.id,
    business_name: r.business_name || 'Unknown',
    phone: r.phone || null,
    website: r.website || null,
    address: r.address || null,
    rating: r.rating || null,
    reviews_count: r.reviews_count || null,
    category: r.category || null,
    place_id: r.place_id || null,
    search_term: searchTerm || null,
    search_location: searchLocation || null,
    status: 'to_call',
  }))

  const { data, error } = await (supabase as any)
    .from('outbound_leads')
    .insert(rows)
    .select()

  if (error) {
    console.error('Outbound leads import error:', error)
    return NextResponse.json({ error: 'Failed to import leads' }, { status: 500 })
  }

  const imported = data?.length || 0
  const truncated = results.length > allowedResults.length

  return NextResponse.json({
    imported,
    dailyRemaining: remaining - imported,
    ...(truncated && {
      warning: `Only ${imported} of ${results.length} leads imported — daily limit reached.`,
    }),
  })
}
