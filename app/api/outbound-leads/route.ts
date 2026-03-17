import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET — list outbound leads with filters
export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const sort = searchParams.get('sort') || 'created_at'
  const order = searchParams.get('order') === 'asc'
  const orgId = userData.is_agency_user ? (searchParams.get('org') || userData.organization_id) : userData.organization_id
  const offset = (page - 1) * limit

  let query = (supabase as any)
    .from('outbound_leads')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  if (search) {
    query = query.or(`business_name.ilike.%${search}%,phone.ilike.%${search}%,address.ilike.%${search}%`)
  }

  query = query.order(sort, { ascending: order }).range(offset, offset + limit - 1)

  const { data: leads, count, error } = await query

  if (error) {
    console.error('Outbound leads fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch outbound leads' }, { status: 500 })
  }

  return NextResponse.json({
    leads: leads || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  })
}

// PATCH — update a single outbound lead (status, notes)
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  // Only allow updating status and notes
  const safeUpdates: Record<string, string> = {}
  if (updates.status) safeUpdates.status = updates.status
  if (updates.notes !== undefined) safeUpdates.notes = updates.notes

  const { data, error } = await (supabase as any)
    .from('outbound_leads')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Outbound lead update error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE — delete outbound leads (single or bulk)
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [body.id]

  if (ids.length === 0) {
    return NextResponse.json({ error: 'Missing ids' }, { status: 400 })
  }

  const { error } = await (supabase as any)
    .from('outbound_leads')
    .delete()
    .in('id', ids)

  if (error) {
    console.error('Outbound lead delete error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }

  return NextResponse.json({ deleted: ids.length })
}
