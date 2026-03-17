// app/api/calls/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/calls — List calls for the org
export async function GET(request: NextRequest) {
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

  // Parse query params
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  // Build query with lead join
  let query = supabase
    .from('calls')
    .select(`
      *,
      lead:leads(id, first_name, last_name, email, phone, stage, temperature, score)
    `, { count: 'exact' })

  // Filter by org
  if (!userData.is_agency_user) {
    query = query.eq('organization_id', userData.organization_id!)
  } else if (searchParams.get('org')) {
    query = query.eq('organization_id', searchParams.get('org')!)
  }

  // Apply filters
  if (status) {
    query = query.eq('status', status as any)
  }
  if (from) {
    query = query.gte('created_at', from)
  }
  if (to) {
    query = query.lte('created_at', to)
  }

  // Order by most recent first
  query = query.order('created_at', { ascending: false })

  // Pagination
  query = query.range(offset, offset + limit - 1)

  const { data: calls, error, count } = await query

  if (error) {
    console.error('Failed to fetch calls:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    calls: calls || [],
    pagination: {
      limit,
      offset,
      total: count || 0,
    },
  })
}
