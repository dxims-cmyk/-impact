// app/api/webhooks/twilio/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { normalizePhone, validateTwilioSignature } from '@/lib/integrations/twilio'
import { aiConversationTask } from '@/trigger/jobs/ai-conversation'

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()

  // Get form data
  const formData = await request.formData()
  
  // Validate Twilio signature in production
  if (process.env.NODE_ENV === 'production') {
    const signature = request.headers.get('X-Twilio-Signature') || ''
    const url = request.url
    const params = Object.fromEntries(formData.entries()) as Record<string, string>

    if (!validateTwilioSignature(signature, url, params)) {
      console.error('Invalid Twilio signature')
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  // Parse webhook data
  const messageSid = formData.get('MessageSid') as string
  const from = formData.get('From') as string
  const to = formData.get('To') as string
  const body = formData.get('Body') as string
  const numMedia = parseInt(formData.get('NumMedia') as string || '0')

  console.log('Inbound SMS:', { messageSid, from, body: body?.substring(0, 50) })

  // Normalize phone number
  const normalizedPhone = normalizePhone(from)

  // Find lead by phone
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*, organization:organizations(id, name, settings)')
    .eq('phone', normalizedPhone)
    .single()

  if (leadError || !lead) {
    // Create new lead from unknown number
    console.log('Unknown sender, creating new lead:', normalizedPhone)

    // Try to find org by the receiving number (would need to store this mapping)
    // For now, log and return
    // TODO: Implement phone number to org mapping
    
    return new NextResponse('OK')
  }

  // Find or create conversation
  let { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('lead_id', lead.id)
    .eq('channel', 'sms')
    .single()

  if (!conversation) {
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({
        lead_id: lead.id,
        organization_id: lead.organization_id,
        channel: 'sms',
        status: 'open'
      })
      .select()
      .single()

    if (convError) {
      console.error('Failed to create conversation:', convError)
      return new NextResponse('Error', { status: 500 })
    }

    conversation = newConv
  }

  // Store inbound message
  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      organization_id: lead.organization_id,
      direction: 'inbound',
      content: body,
      external_id: messageSid,
      status: 'delivered'
    })
    .select()
    .single()

  if (msgError) {
    console.error('Failed to store message:', msgError)
    return new NextResponse('Error', { status: 500 })
  }

  // Update conversation
  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      unread_count: supabase.rpc('increment', { row_id: conversation.id, field: 'unread_count' })
    })
    .eq('id', conversation.id)

  // Log activity
  await supabase
    .from('lead_activities')
    .insert({
      lead_id: lead.id,
      organization_id: lead.organization_id,
      type: 'sms_received',
      direction: 'inbound',
      channel: 'sms',
      content: body,
      metadata: { message_sid: messageSid, num_media: numMedia }
    })

  // Update lead - mark as engaged
  await supabase
    .from('leads')
    .update({
      updated_at: new Date().toISOString()
    })
    .eq('id', lead.id)

  // Check if AI auto-reply is enabled
  const orgSettings = lead.organization?.settings as { ai_auto_reply_enabled?: boolean } | null
  
  if (orgSettings?.ai_auto_reply_enabled) {
    // Trigger AI conversation handler
    await aiConversationTask.trigger({
      conversationId: conversation.id,
      messageId: message.id
    })
  }

  // Return empty TwiML (no immediate response, AI will handle async)
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    {
      headers: { 'Content-Type': 'text/xml' }
    }
  )
}

// Status callback endpoint
export async function PATCH(request: NextRequest) {
  const supabase = createAdminClient()

  const formData = await request.formData()
  
  const messageSid = formData.get('MessageSid') as string
  const messageStatus = formData.get('MessageStatus') as string
  const errorCode = formData.get('ErrorCode') as string | null
  const errorMessage = formData.get('ErrorMessage') as string | null

  console.log('SMS Status Update:', { messageSid, messageStatus, errorCode })

  // Map Twilio status to our status
  const statusMap: Record<string, string> = {
    queued: 'pending',
    sending: 'pending',
    sent: 'sent',
    delivered: 'delivered',
    undelivered: 'failed',
    failed: 'failed',
    read: 'read'
  }

  const status = statusMap[messageStatus] || messageStatus

  // Update message status
  const updateData: Record<string, unknown> = { status }

  if (status === 'delivered') {
    updateData.delivered_at = new Date().toISOString()
  } else if (status === 'failed') {
    updateData.error_message = errorMessage || `Error code: ${errorCode}`
  }

  await supabase
    .from('messages')
    .update(updateData)
    .eq('external_id', messageSid)

  return new NextResponse('OK')
}
