// app/api/webhooks/twilio/inbound/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { parseInboundSMS } from '@/lib/integrations/twilio'
import twilio from 'twilio'

// Strip leading '+' and country code variants for phone matching.
// Only digits and '+' allowed to prevent PostgREST filter injection.
function normalizePhoneForLookup(phone: string): string[] {
  const digits = phone.replace(/[^\d]/g, '')
  const variants: string[] = [phone, digits, `+${digits}`]

  // If starts with country code like 44, also try without
  if (digits.startsWith('44') && digits.length > 10) {
    variants.push(`0${digits.slice(2)}`)
    variants.push(digits.slice(2))
  }
  // If starts with 1 (US/CA)
  if (digits.startsWith('1') && digits.length === 11) {
    variants.push(digits.slice(1))
  }

  return [...new Set(variants)]
}

// POST /api/webhooks/twilio/inbound — Receives inbound SMS from Twilio
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify Twilio request signature
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) {
    console.error('Twilio webhook: TWILIO_AUTH_TOKEN not configured')
    return new NextResponse('<Response></Response>', {
      status: 500,
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  const twilioSignature = request.headers.get('x-twilio-signature') || ''
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/inbound`

  let formData: FormData

  try {
    formData = await request.formData()
  } catch {
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  // Build params object for signature validation
  const params: Record<string, string> = {}
  formData.forEach((value, key) => {
    params[key] = value.toString()
  })

  const isValid = twilio.validateRequest(authToken, twilioSignature, webhookUrl, params)
  if (!isValid) {
    console.error('Twilio webhook: invalid signature')
    return new NextResponse('<Response></Response>', {
      status: 403,
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  const sms = parseInboundSMS(formData)

  // Validate required fields
  if (!sms.from || !sms.body) {
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  const supabase = createAdminClient()

  // --- Deduplicate by MessageSid ---
  if (sms.messageSid) {
    const { data: existingMsg } = await supabase
      .from('messages')
      .select('id')
      .eq('external_id', sms.messageSid)
      .maybeSingle()

    if (existingMsg) {
      return new NextResponse('<Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      })
    }
  }

  // --- Find matching lead by phone ---
  const phoneVariants = normalizePhoneForLookup(sms.from)
  let lead: { id: string; organization_id: string; phone: string | null } | null = null

  for (const variant of phoneVariants) {
    // variant is already digits-only from normalizePhoneForLookup
    const safeVariant = variant.replace(/[^\d+]/g, '')
    const { data } = await supabase
      .from('leads')
      .select('id, organization_id, phone')
      .or(`phone.eq.${safeVariant},phone.eq.+${safeVariant}`)
      .limit(1)
      .maybeSingle()

    if (data) {
      lead = data
      break
    }
  }

  // --- If no lead found, create one ---
  if (!lead) {
    // Determine org from the Twilio number receiving the SMS.
    // Look up which org has a matching Twilio number in integrations,
    // or fall back to the org whose TWILIO_PHONE_NUMBER matches the 'To' number.
    let orgId: string | undefined

    // Try to find org by matching the receiving phone number in settings
    const toNumber = (formData.get('To') as string || '').replace(/[^\d+]/g, '')
    if (toNumber) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, settings')
        .limit(100)

      orgId = orgs?.find((o) => {
        const s = o.settings as { twilio_phone_number?: string } | null
        return s?.twilio_phone_number && s.twilio_phone_number.replace(/[^\d+]/g, '') === toNumber
      })?.id
    }

    // Fall back to org with speed_to_lead enabled (most likely customer)
    if (!orgId) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, settings')
        .limit(100)

      orgId = orgs?.find((o) => {
        const s = o.settings as { speed_to_lead_enabled?: boolean } | null
        return s?.speed_to_lead_enabled
      })?.id
    }

    if (!orgId) {
      // Cannot determine org — reject silently
      return new NextResponse('<Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    const { data: newLead, error: leadErr } = await supabase
      .from('leads')
      .insert({
        organization_id: orgId,
        phone: sms.from,
        source: 'sms_inbound',
        stage: 'new',
      })
      .select('id, organization_id, phone')
      .single()

    if (leadErr || !newLead) {
      return new NextResponse('<Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      })
    }
    lead = newLead

    // Log activity for new lead
    await supabase.from('lead_activities').insert({
      lead_id: lead.id,
      organization_id: lead.organization_id,
      type: 'lead_created',
      direction: 'inbound',
      channel: 'sms',
      content: 'New lead created from inbound SMS',
      metadata: { phone: sms.from, from_city: sms.fromCity, from_country: sms.fromCountry },
      is_automated: true,
    })
  }

  // --- Find or create conversation ---
  let { data: conversation } = await supabase
    .from('conversations')
    .select('id, organization_id, unread_count')
    .eq('lead_id', lead.id)
    .eq('channel', 'sms')
    .eq('organization_id', lead.organization_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!conversation) {
    const { data: newConv, error: convErr } = await supabase
      .from('conversations')
      .insert({
        lead_id: lead.id,
        organization_id: lead.organization_id,
        channel: 'sms',
        status: 'open',
        last_message_at: new Date().toISOString(),
      })
      .select('id, organization_id, unread_count')
      .single()

    if (convErr || !newConv) {
      return new NextResponse('<Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      })
    }
    conversation = newConv
  }

  // --- Store inbound message ---
  await supabase.from('messages').insert({
    conversation_id: conversation.id,
    organization_id: conversation.organization_id,
    direction: 'inbound',
    content: sms.body,
    status: 'delivered',
    external_id: sms.messageSid || null,
    is_ai_generated: false,
  })

  // --- Update conversation metadata ---
  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      unread_count: (conversation.unread_count ?? 0) + 1,
      status: 'open',
    })
    .eq('id', conversation.id)

  // --- Create in-app notification ---
  await supabase.from('notifications').insert({
    organization_id: conversation.organization_id,
    type: 'message',
    title: 'New SMS received',
    body: `${sms.from}: ${sms.body.slice(0, 100)}`,
    metadata: {
      conversation_id: conversation.id,
      lead_id: lead.id,
    },
  })

  // --- Log activity ---
  await supabase.from('lead_activities').insert({
    lead_id: lead.id,
    organization_id: conversation.organization_id,
    type: 'sms_received',
    direction: 'inbound',
    channel: 'sms',
    content: sms.body,
    metadata: {
      external_id: sms.messageSid,
      conversation_id: conversation.id,
    },
    is_automated: true,
  })

  // Return empty TwiML response (no auto-reply — human or AI handles it from dashboard)
  return new NextResponse('<Response></Response>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}
