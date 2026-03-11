// app/api/messages/[id]/retry/route.ts
// Retry a failed outbound message
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/integrations/twilio'
import { sendEmail } from '@/lib/integrations/resend'
import { sendWhatsAppText } from '@/lib/integrations/whatsapp'
import { sendInstagramMessage, sendMessengerMessage } from '@/lib/integrations/meta-messaging'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id && !userData?.is_agency_user) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Get the failed message with conversation + lead info
  let msgQuery = supabase
    .from('messages')
    .select(`
      *,
      conversation:conversations(
        id, channel, organization_id,
        lead:leads(id, email, phone, source_detail)
      )
    `)
    .eq('id', id)
    .eq('direction', 'outbound')
    .eq('status', 'failed')

  if (!userData.is_agency_user) {
    msgQuery = msgQuery.eq('organization_id', userData.organization_id)
  }

  const { data: message, error: msgError } = await msgQuery.single()

  if (msgError || !message) {
    return NextResponse.json({ error: 'Message not found or not retryable' }, { status: 404 })
  }

  const conv = message.conversation as {
    id: string
    channel: string
    organization_id: string
    lead: { id: string; email: string | null; phone: string | null; source_detail: Record<string, string> | null } | null
  }

  if (!conv?.lead) {
    return NextResponse.json({ error: 'Lead not found for this conversation' }, { status: 404 })
  }

  // Mark as pending while retrying
  await supabase
    .from('messages')
    .update({ status: 'pending', error_message: null })
    .eq('id', id)

  try {
    let externalId: string | undefined
    const channel = conv.channel

    if (channel === 'sms' && conv.lead.phone) {
      const result = await sendSMS({ to: conv.lead.phone, body: message.content })
      externalId = result.sid
    } else if (channel === 'email' && conv.lead.email) {
      const result = await sendEmail({ to: conv.lead.email, subject: 'Message from : Impact', text: message.content })
      externalId = result?.id
    } else if (channel === 'whatsapp' && conv.lead.phone) {
      const result = await sendWhatsAppText({ to: conv.lead.phone, body: message.content })
      externalId = result.messageId
    } else if (channel === 'instagram_dm') {
      const recipientId = conv.lead.source_detail?.instagram_id
      if (!recipientId) throw new Error('No Instagram ID for this lead')
      const result = await sendInstagramMessage(recipientId, message.content)
      externalId = result.message_id
    } else if (channel === 'messenger') {
      const recipientId = conv.lead.source_detail?.messenger_id
      if (!recipientId) throw new Error('No Messenger ID for this lead')
      const result = await sendMessengerMessage(recipientId, message.content)
      externalId = result.message_id
    } else {
      throw new Error(`Cannot retry: no contact info for channel ${channel}`)
    }

    await supabase
      .from('messages')
      .update({ status: 'sent', external_id: externalId, sent_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ success: true, status: 'sent' })
  } catch (error) {
    await supabase
      .from('messages')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Retry failed',
      })
      .eq('id', id)

    return NextResponse.json({
      error: 'Retry failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
