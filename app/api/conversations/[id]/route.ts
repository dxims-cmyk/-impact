// app/api/conversations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateConversationSchema = z.object({
  status: z.enum(['open', 'closed', 'snoozed']).optional(),
})

// Helper: get user's org
async function getUserOrg(supabase: ReturnType<typeof createClient>, userId: string) {
  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from('users')
    .select('organization_id, is_agency_user')
    .eq('id', userId)
    .single()
  return data
}

// GET /api/conversations/[id] - Get conversation with messages
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

  // Get user's org
  const userData = await getUserOrg(supabase, user.id)
  if (!userData?.organization_id && !userData?.is_agency_user) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Get conversation with lead info and messages — filtered by org
  let query = supabase
    .from('conversations')
    .select(`
      *,
      lead:leads(id, first_name, last_name, email, phone, company, temperature, score, ai_summary),
      messages(id, content, direction, status, is_ai_generated, ai_confidence, created_at, sent_at, delivered_at, read_at)
    `)
    .eq('id', id)

  if (!userData.is_agency_user) {
    query = query.eq('organization_id', userData.organization_id)
  }

  const { data: conversation, error } = await query.single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Sort messages chronologically
  conversation.messages = conversation.messages?.sort((a: { created_at: string }, b: { created_at: string }) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return NextResponse.json(conversation)
}

// PATCH /api/conversations/[id] - Update conversation status
export async function PATCH(
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

  // Parse and validate body
  const body = await request.json()
  const validation = updateConversationSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  // Get user's org
  const userData = await getUserOrg(supabase, user.id)
  if (!userData?.organization_id && !userData?.is_agency_user) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Update conversation — filtered by org
  let updateQuery = supabase
    .from('conversations')
    .update(validation.data)
    .eq('id', id)

  if (!userData.is_agency_user) {
    updateQuery = updateQuery.eq('organization_id', userData.organization_id)
  }

  const { data: conversation, error } = await updateQuery.select().single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(conversation)
}
