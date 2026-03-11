import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST — bulk import results from Apify into outbound_leads table
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await supabase
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

  const rows = results.map((r: Record<string, unknown>) => ({
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

  return NextResponse.json({ imported: data?.length || 0 })
}
