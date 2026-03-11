// app/api/webhooks/twilio/status/route.ts
// Handles Twilio SMS delivery status callbacks (sent → delivered → read/failed)
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import twilio from 'twilio'

// Twilio status mapping to our message statuses
const STATUS_MAP: Record<string, string> = {
  queued: 'pending',
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
  undelivered: 'failed',
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) {
    console.error('Twilio status webhook: TWILIO_AUTH_TOKEN not configured')
    return new NextResponse('', { status: 200 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return new NextResponse('', { status: 200 })
  }

  // Verify Twilio signature
  const twilioSignature = request.headers.get('x-twilio-signature') || ''
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`

  const params: Record<string, string> = {}
  formData.forEach((value, key) => {
    params[key] = value.toString()
  })

  const isValid = twilio.validateRequest(authToken, twilioSignature, webhookUrl, params)
  if (!isValid) {
    console.error('Twilio status webhook: invalid signature')
    return new NextResponse('', { status: 403 })
  }

  const messageSid = params.MessageSid
  const messageStatus = params.MessageStatus?.toLowerCase()

  if (!messageSid || !messageStatus) {
    return new NextResponse('', { status: 200 })
  }

  const mappedStatus = STATUS_MAP[messageStatus]
  if (!mappedStatus) {
    return new NextResponse('', { status: 200 })
  }

  const supabase = createAdminClient()

  // Find the message by external_id (Twilio SID)
  const { data: message } = await supabase
    .from('messages')
    .select('id, status')
    .eq('external_id', messageSid)
    .maybeSingle()

  if (!message) {
    // Message not found — might be from before we tracked external_id
    return new NextResponse('', { status: 200 })
  }

  // Only update if the new status is more advanced
  const STATUS_ORDER: Record<string, number> = { pending: 0, sent: 1, delivered: 2, read: 3, failed: 4 }
  const currentOrder = STATUS_ORDER[message.status] ?? 0
  const newOrder = STATUS_ORDER[mappedStatus] ?? 0

  // Don't go backwards (e.g. don't overwrite "delivered" with "sent")
  // But always allow "failed" to overwrite
  if (newOrder <= currentOrder && mappedStatus !== 'failed') {
    return new NextResponse('', { status: 200 })
  }

  const updateData: Record<string, unknown> = { status: mappedStatus }

  if (mappedStatus === 'delivered') {
    updateData.delivered_at = new Date().toISOString()
  } else if (mappedStatus === 'read') {
    updateData.read_at = new Date().toISOString()
    if (!message.status || message.status === 'sent') {
      updateData.delivered_at = new Date().toISOString()
    }
  } else if (mappedStatus === 'failed') {
    updateData.error_message = params.ErrorMessage || params.ErrorCode || 'Delivery failed'
  }

  await supabase
    .from('messages')
    .update(updateData)
    .eq('id', message.id)

  return new NextResponse('', { status: 200 })
}
