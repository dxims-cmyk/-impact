// app/api/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createConversationSchema = z.object({
  leadId: z.string().uuid(),
  channel: z.enum(['email', 'sms', 'whatsapp']),
})

// GET /api/conversations - List conversations
export async function GET(request: NextRequest) {
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
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status')
  const channel = searchParams.get('channel')
  const search = searchParams.get('search')

  // Build query
  let query = supabase
    .from('conversations')
    .select(`
      *,
      lead:leads(id, first_name, last_name, email, phone, company, temperature, score),
      messages(id, content, direction, status, created_at)
    `, { count: 'exact' })

  // Filter by org (unless agency user)
  if (!userData.is_agency_user) {
    query = query.eq('organization_id', userData.organization_id)
  }

  // Apply filters
  if (status) query = query.eq('status', status)
  if (channel) query = query.eq('channel', channel)
  if (search) {
    // Search in lead name/email
    query = query.or(`lead.first_name.ilike.%${search}%,lead.last_name.ilike.%${search}%,lead.email.ilike.%${search}%`)
  }

  // Order by last message
  query = query.order('last_message_at', { ascending: false, nullsFirst: false })

  // Pagination
  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data: conversations, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Sort messages within each conversation
  const conversationsWithSortedMessages = conversations?.map(conv => ({
    ...conv,
    messages: conv.messages?.sort((a: { created_at: string }, b: { created_at: string }) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ).slice(-5) // Keep only last 5 messages for preview
  }))

  return NextResponse.json({
    conversations: conversationsWithSortedMessages,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil((count || 0) / limit)
    }
  })
}

// POST /api/conversations - Create conversation
export async function POST(request: NextRequest) {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Parse and validate body
  const body = await request.json()
  const validation = createConversationSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  // Verify lead exists
  const { data: lead } = await supabase
    .from('leads')
    .select('id, organization_id')
    .eq('id', validation.data.leadId)
    .single()

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Check for existing conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('lead_id', validation.data.leadId)
    .eq('channel', validation.data.channel)
    .single()

  if (existing) {
    return NextResponse.json({
      error: 'Conversation already exists',
      conversationId: existing.id
    }, { status: 409 })
  }

  // Create conversation
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      lead_id: validation.data.leadId,
      organization_id: lead.organization_id,
      channel: validation.data.channel,
      status: 'open',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(conversation, { status: 201 })
}
