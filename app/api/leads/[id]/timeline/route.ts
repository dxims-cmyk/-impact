// app/api/leads/[id]/timeline/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/leads/[id]/timeline - Get lead activities
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse query params
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  // Get activities with performer info
  const { data: activities, error, count } = await supabase
    .from('lead_activities')
    .select('*, performer:users!performed_by(id, full_name, avatar_url)', { count: 'exact' })
    .eq('lead_id', id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    activities,
    pagination: {
      total: count,
      limit,
      offset,
    }
  })
}

// POST /api/leads/[id]/timeline - Add activity (note, call log, etc)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's organization
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Parse body
  const body = await request.json()
  const { type, content, subject, direction, channel, metadata } = body

  if (!type || !content) {
    return NextResponse.json({ error: 'Type and content are required' }, { status: 400 })
  }

  // Verify lead exists and belongs to org
  const { data: lead } = await supabase
    .from('leads')
    .select('id, organization_id')
    .eq('id', id)
    .single()

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Create activity
  const { data: activity, error } = await supabase
    .from('lead_activities')
    .insert({
      lead_id: id,
      organization_id: lead.organization_id,
      type,
      content,
      subject,
      direction,
      channel,
      metadata,
      performed_by: user.id,
      is_automated: false,
    })
    .select('*, performer:users!performed_by(id, full_name, avatar_url)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(activity, { status: 201 })
}
