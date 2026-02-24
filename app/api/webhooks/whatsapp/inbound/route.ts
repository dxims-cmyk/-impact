// app/api/webhooks/whatsapp/inbound/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { aiWhatsAppReplyTask } from '@/trigger/jobs/ai-whatsapp-reply'
import crypto from 'crypto'

// ---- Meta webhook verification (GET) ----
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// ---- Inbound message processing (POST) ----

interface WhatsAppMessage {
  id: string
  from: string
  timestamp: string
  type: string
  text?: { body: string }
}

interface WhatsAppContact {
  profile: { name: string }
  wa_id: string
}

interface WhatsAppChange {
  value: {
    messaging_product: string
    metadata: { phone_number_id: string }
    contacts?: WhatsAppContact[]
    messages?: WhatsAppMessage[]
    statuses?: unknown[]
  }
}

interface WhatsAppWebhookPayload {
  object: string
  entry: {
    id: string
    changes: WhatsAppChange[]
  }[]
}

// Strip leading '+' and country code variants for phone matching
function normalizePhoneForLookup(phone: string): string[] {
  const digits = phone.replace(/[^\d]/g, '')
  const variants: string[] = [digits, `+${digits}`]

  // If starts with country code like 44, also try without
  if (digits.startsWith('44') && digits.length > 10) {
    variants.push(`0${digits.slice(2)}`)
    variants.push(digits.slice(2))
  }
  // If starts with 1 (US/CA)
  if (digits.startsWith('1') && digits.length === 11) {
    variants.push(digits.slice(1))
  }

  return variants
}

// Verify Meta webhook signature (x-hub-signature-256)
function verifySignature(rawBody: string, signature: string): boolean {
  const appSecret = process.env.META_APP_SECRET
  if (!appSecret) return false // Fail-safe: reject if no secret configured

  const expectedSig = 'sha256=' + crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig),
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text()

  // Verify Meta signature — mandatory
  const signature = request.headers.get('x-hub-signature-256') || ''
  if (process.env.META_APP_SECRET && !verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  let payload: WhatsAppWebhookPayload

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Meta requires us to always return 200 quickly
  if (payload.object !== 'whatsapp_business_account') {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const supabase = createAdminClient()

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      const { messages, contacts } = change.value

      // Skip status update webhooks (delivery receipts, etc.)
      if (!messages || messages.length === 0) continue

      for (const message of messages) {
        // Only handle text messages for now
        if (message.type !== 'text' || !message.text?.body) continue

        const senderPhone = message.from
        const messageText = message.text.body
        const externalMessageId = message.id

        // --- Deduplicate: check if we already stored this message ---
        const { data: existingMsg } = await supabase
          .from('messages')
          .select('id')
          .eq('external_id', externalMessageId)
          .maybeSingle()

        if (existingMsg) continue // Already processed

        // --- Resolve sender name from contacts ---
        const contactName =
          contacts?.find((c) => c.wa_id === senderPhone)?.profile?.name || null

        // --- Find matching lead by phone ---
        const phoneVariants = normalizePhoneForLookup(senderPhone)
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
          // Determine org from the WhatsApp phone_number_id in the webhook payload
          const phoneNumberId = change.value.metadata.phone_number_id
          let orgId: string | undefined

          // Try to match phone_number_id to an org's settings
          if (phoneNumberId) {
            const { data: orgs } = await supabase
              .from('organizations')
              .select('id, settings')
              .limit(100)

            orgId = orgs?.find((o) => {
              const s = o.settings as { whatsapp_phone_number_id?: string } | null
              return s?.whatsapp_phone_number_id === phoneNumberId
            })?.id
          }

          // Fall back to org with speed_to_lead enabled
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

          if (!orgId) continue // No org to attach to

          const nameParts = contactName ? contactName.split(' ') : []
          const { data: newLead, error: leadErr } = await supabase
            .from('leads')
            .insert({
              organization_id: orgId,
              phone: `+${senderPhone}`,
              first_name: nameParts[0] || null,
              last_name: nameParts.slice(1).join(' ') || null,
              source: 'whatsapp_inbound',
              stage: 'new',
            })
            .select('id, organization_id, phone')
            .single()

          if (leadErr || !newLead) continue
          lead = newLead

          // Log activity for new lead creation
          await supabase.from('lead_activities').insert({
            lead_id: lead.id,
            organization_id: lead.organization_id,
            type: 'lead_created',
            direction: 'inbound',
            channel: 'whatsapp',
            content: `New lead created from inbound WhatsApp message`,
            metadata: { phone: senderPhone, contact_name: contactName },
            is_automated: true,
          })
        }

        // --- Find or create conversation ---
        let { data: conversation } = await supabase
          .from('conversations')
          .select('id, ai_handling, ai_message_count, organization_id')
          .eq('lead_id', lead.id)
          .eq('channel', 'whatsapp')
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
              channel: 'whatsapp',
              status: 'open',
              last_message_at: new Date().toISOString(),
            })
            .select('id, ai_handling, ai_message_count, organization_id')
            .single()

          if (convErr || !newConv) continue
          conversation = newConv
        }

        // --- Store inbound message ---
        await supabase.from('messages').insert({
          conversation_id: conversation.id,
          organization_id: conversation.organization_id,
          direction: 'inbound',
          content: messageText,
          status: 'delivered',
          external_id: externalMessageId,
          is_ai_generated: false,
        })

        // --- Update conversation metadata ---
        await supabase
          .from('conversations')
          .update({
            last_message_at: new Date().toISOString(),
            unread_count: (conversation as { unread_count?: number }).unread_count
              ? ((conversation as { unread_count?: number }).unread_count ?? 0) + 1
              : 1,
            status: 'open',
          })
          .eq('id', conversation.id)

        // --- Create in-app notification ---
        await supabase.from('notifications').insert({
          organization_id: conversation.organization_id,
          type: 'message',
          title: 'New WhatsApp message',
          body: `${contactName || senderPhone}: ${messageText.slice(0, 100)}`,
          metadata: {
            conversation_id: conversation.id,
            lead_id: lead.id,
          },
        })

        // --- Determine AI handling ---
        const aiHandling = (conversation as { ai_handling?: string }).ai_handling || 'off'

        if (aiHandling === 'active') {
          // Already active -- trigger AI reply
          await aiWhatsAppReplyTask.trigger({
            conversationId: conversation.id,
            messageText,
            leadId: lead.id,
            orgId: conversation.organization_id,
          })
        } else if (aiHandling === 'off') {
          // Check if org has AI responder enabled
          const { data: org } = await supabase
            .from('organizations')
            .select('settings')
            .eq('id', conversation.organization_id)
            .single()

          const settings = org?.settings as {
            ai_responder_enabled?: boolean
          } | null

          if (settings?.ai_responder_enabled) {
            // Activate AI handling on this conversation
            await supabase
              .from('conversations')
              .update({ ai_handling: 'active' })
              .eq('id', conversation.id)

            await aiWhatsAppReplyTask.trigger({
              conversationId: conversation.id,
              messageText,
              leadId: lead.id,
              orgId: conversation.organization_id,
            })
          }
        }
        // If 'paused' or 'handed_off', do nothing -- human is handling it

        // Log activity
        await supabase.from('lead_activities').insert({
          lead_id: lead.id,
          organization_id: conversation.organization_id,
          type: 'whatsapp_received',
          direction: 'inbound',
          channel: 'whatsapp',
          content: messageText,
          metadata: {
            external_id: externalMessageId,
            conversation_id: conversation.id,
          },
          is_automated: true,
        })
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
