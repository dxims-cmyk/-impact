// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// GET /api/notifications - List notifications for user's org
export async function GET(request: NextRequest): Promise<NextResponse> {
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

  // Parse query params
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const unreadOnly = searchParams.get('unread') === 'true'

  // Build query
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit)

  // Filter by org
  if (!userData.is_agency_user) {
    query = query.eq('organization_id', userData.organization_id)
  }

  if (unreadOnly) {
    query = query.eq('is_read', false)
  }

  const { data: notifications, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get unread count separately
  let unreadQuery = supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)

  if (!userData.is_agency_user) {
    unreadQuery = unreadQuery.eq('organization_id', userData.organization_id)
  }

  const { count: unreadCount } = await unreadQuery

  return NextResponse.json({
    notifications,
    total: count,
    unreadCount: unreadCount || 0,
  })
}

// Mark as read schema
const markReadSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  all: z.boolean().optional(),
}).refine(data => data.ids || data.all, {
  message: 'Provide either ids array or all: true',
})

// PATCH /api/notifications - Mark notification(s) as read
export async function PATCH(request: NextRequest): Promise<NextResponse> {
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

  // Parse and validate body
  const body = await request.json()
  const validation = markReadSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten(),
    }, { status: 400 })
  }

  const { ids, all } = validation.data

  // Build update query
  let query = supabase
    .from('notifications')
    .update({ is_read: true })

  if (!userData.is_agency_user) {
    query = query.eq('organization_id', userData.organization_id)
  }

  if (all) {
    query = query.eq('is_read', false)
  } else if (ids) {
    query = query.in('id', ids)
  }

  const { error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
