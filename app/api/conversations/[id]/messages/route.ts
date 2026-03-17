// app/api/conversations/[id]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/integrations/twilio'
import { sendEmail } from '@/lib/integrations/resend'
import { sendWhatsAppText } from '@/lib/integrations/whatsapp'
import { sendInstagramMessage, sendMessengerMessage } from '@/lib/integrations/meta-messaging'
import { z } from 'zod'

const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  channel: z.enum(['sms', 'email', 'whatsapp', 'instagram_dm', 'messenger']).optional(),
})

// GET /api/conversations/[id]/messages - Get all messages
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

  // Verify conversation belongs to user's org
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id, is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id && !userData?.is_agency_user) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Verify conversation ownership before returning messages
  let convCheck = supabase.from('conversations').select('id').eq('id', id)
  if (!userData.is_agency_user) {
    convCheck = convCheck.eq('organization_id', userData.organization_id)
  }
  const { data: conv } = await convCheck.maybeSingle()
  if (!conv) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Get messages
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(messages)
}

// POST /api/conversations/[id]/messages - Send message
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

  // Parse and validate body
  const body = await request.json()
  const validation = sendMessageSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  // Get user's org for ownership check
  const adminSupabase2 = createAdminClient()
  const { data: userData } = await adminSupabase2
    .from('users')
    .select('organization_id, is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id && !userData?.is_agency_user) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Get conversation with lead info — filtered by org
  let convQuery = supabase
    .from('conversations')
    .select(`
      *,
      lead:leads(id, email, phone, first_name, source_detail)
    `)
    .eq('id', id)

  if (!userData.is_agency_user) {
    convQuery = convQuery.eq('organization_id', userData.organization_id)
  }

  const { data: conversation, error: convError } = await convQuery.single()

  if (convError || !conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Create message record
  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert({
      conversation_id: id,
      organization_id: conversation.organization_id,
      direction: 'outbound',
      content: validation.data.content,
      status: 'pending',
      is_ai_generated: false,
    })
    .select()
    .single()

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 })
  }

  // Send based on channel (allow override from request)
  const sendChannel = validation.data.channel || conversation.channel
  try {
    let externalId: string | undefined

    if (sendChannel === 'sms' && conversation.lead?.phone) {
      const result = await sendSMS({
        to: conversation.lead.phone,
        body: validation.data.content,
      })
      externalId = result.sid
    } else if (sendChannel === 'email' && conversation.lead?.email) {
      const result = await sendEmail({
        to: conversation.lead.email,
        subject: `Message from : Impact`,
        text: validation.data.content,
      })
      externalId = result?.id
    } else if (sendChannel === 'whatsapp' && conversation.lead?.phone) {
      const result = await sendWhatsAppText({
        to: conversation.lead.phone,
        body: validation.data.content,
      })
      externalId = result.messageId
    } else if (sendChannel === 'instagram_dm') {
      const sourceDetail = conversation.lead?.source_detail as Record<string, string> | null
      const recipientId = sourceDetail?.instagram_id
      if (!recipientId) throw new Error('No Instagram ID for this lead')
      const result = await sendInstagramMessage(recipientId, validation.data.content)
      externalId = result.message_id
    } else if (sendChannel === 'messenger') {
      const sourceDetail = conversation.lead?.source_detail as Record<string, string> | null
      const recipientId = sourceDetail?.messenger_id
      if (!recipientId) throw new Error('No Messenger ID for this lead')
      const result = await sendMessengerMessage(recipientId, validation.data.content)
      externalId = result.message_id
    }

    // Update message status
    await supabase
      .from('messages')
      .update({
        status: 'sent',
        external_id: externalId,
        sent_at: new Date().toISOString(),
      })
      .eq('id', message.id)

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        status: 'open',
      })
      .eq('id', id)

    // Log activity
    await supabase.from('lead_activities').insert({
      lead_id: conversation.lead_id,
      organization_id: conversation.organization_id,
      type: `${sendChannel}_sent`,
      direction: 'outbound',
      channel: sendChannel,
      content: validation.data.content,
      metadata: { message_id: message.id },
      performed_by: user.id,
      is_automated: false,
    })

    return NextResponse.json({ ...message, status: 'sent' }, { status: 201 })
  } catch (error) {
    // Update message as failed
    await supabase
      .from('messages')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Send failed',
      })
      .eq('id', message.id)

    return NextResponse.json({
      error: 'Failed to send message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
