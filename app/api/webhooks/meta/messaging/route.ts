// app/api/webhooks/meta/messaging/route.ts
// Handles Instagram DM and Messenger inbound messages via Meta webhook
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
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

// Verify Meta webhook signature
function verifySignature(rawBody: string, signature: string): boolean {
  const appSecret = process.env.META_APP_SECRET
  if (!appSecret) return false

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

// Resolve which org owns this Instagram/Page ID
async function resolveOrg(
  supabase: ReturnType<typeof createAdminClient>,
  recipientId: string,
  channel: 'instagram_dm' | 'messenger',
): Promise<string | null> {
  // Check organizations settings for matching ID
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, settings')
    .limit(100)

  if (!orgs) return null

  for (const org of orgs) {
    const s = org.settings as Record<string, unknown> | null
    if (!s) continue

    if (channel === 'instagram_dm') {
      if (s.instagram_business_account_id === recipientId || s.instagram_id === recipientId) {
        return org.id
      }
    } else if (channel === 'messenger') {
      if (s.facebook_page_id === recipientId || s.page_id === recipientId) {
        return org.id
      }
    }
  }

  // Fallback: check integrations table metadata
  const { data: integrations } = await supabase
    .from('integrations')
    .select('organization_id, metadata')
    .eq('provider', 'meta_ads')
    .eq('status', 'connected')

  if (!integrations) return null

  for (const int of integrations) {
    const m = int.metadata as Record<string, unknown> | null
    if (!m) continue

    if (channel === 'instagram_dm' && (m.instagram_id === recipientId || m.instagram_business_account_id === recipientId)) {
      return int.organization_id
    }
    if (channel === 'messenger' && (m.page_id === recipientId || m.facebook_page_id === recipientId)) {
      return int.organization_id
    }
  }

  // Last resort: first org with speed_to_lead enabled
  const fallback = orgs.find((o) => {
    const s = o.settings as Record<string, unknown> | null
    return s?.speed_to_lead_enabled === true
  })
  return fallback?.id || null
}

// Find or create lead by platform-specific sender ID
async function findOrCreateLead(
  supabase: ReturnType<typeof createAdminClient>,
  orgId: string,
  senderId: string,
  channel: 'instagram_dm' | 'messenger',
  senderName?: string,
): Promise<{ id: string; first_name: string | null; last_name: string | null } | null> {
  const metadataKey = channel === 'instagram_dm' ? 'instagram_id' : 'messenger_id'

  // Search by metadata JSONB contains
  const { data: existing } = await supabase
    .from('leads')
    .select('id, first_name, last_name')
    .eq('organization_id', orgId)
    .contains('source_detail', { [metadataKey]: senderId })
    .limit(1)
    .maybeSingle()

  if (existing) return existing

  // Create new lead
  const nameParts = senderName ? senderName.split(' ') : []
  const firstName = nameParts[0] || null
  const lastName = nameParts.slice(1).join(' ') || null

  const { data: newLead, error } = await supabase
    .from('leads')
    .insert({
      organization_id: orgId,
      first_name: firstName,
      last_name: lastName,
      source: channel === 'instagram_dm' ? 'instagram' : 'messenger',
      source_detail: { [metadataKey]: senderId },
      stage: 'new',
    })
    .select('id, first_name, last_name')
    .single()

  if (error || !newLead) {
    console.error(`Meta messaging webhook: failed to create lead`, error)
    return null
  }

  // Log lead creation activity
  await supabase.from('lead_activities').insert({
    lead_id: newLead.id,
    organization_id: orgId,
    type: 'lead_created',
    direction: 'inbound',
    channel: channel,
    content: `New lead created from ${channel === 'instagram_dm' ? 'Instagram DM' : 'Messenger'}`,
    metadata: { [metadataKey]: senderId, sender_name: senderName },
    is_automated: true,
  })

  return newLead
}

// Find or create conversation
async function findOrCreateConversation(
  supabase: ReturnType<typeof createAdminClient>,
  leadId: string,
  orgId: string,
  channel: 'instagram_dm' | 'messenger',
  channelId: string,
): Promise<{ id: string; organization_id: string; unread_count: number } | null> {
  let { data: conversation } = await supabase
    .from('conversations')
    .select('id, organization_id, unread_count')
    .eq('lead_id', leadId)
    .eq('channel', channel)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (conversation) return conversation

  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({
      lead_id: leadId,
      organization_id: orgId,
      channel: channel,
      status: 'open',
      last_message_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .select('id, organization_id, unread_count')
    .single()

  if (error || !newConv) {
    console.error(`Meta messaging webhook: failed to create conversation`, error)
    return null
  }

  return newConv
}

// ---- POST handler ----
export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text()

  // Verify Meta signature
  const signature = request.headers.get('x-hub-signature-256') || ''
  if (process.env.META_APP_SECRET && !verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  let body: {
    object: string
    entry?: {
      id: string
      time?: number
      messaging?: {
        sender?: { id: string }
        recipient?: { id: string }
        timestamp?: number
        message?: { mid?: string; text?: string; attachments?: unknown[] }
      }[]
    }[]
  }

  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Determine channel from webhook object type
  let channel: 'instagram_dm' | 'messenger' | null = null
  if (body.object === 'instagram') {
    channel = 'instagram_dm'
  } else if (body.object === 'page') {
    channel = 'messenger'
  } else {
    // Not a messaging webhook — acknowledge and skip
    return NextResponse.json({ received: true })
  }

  const supabase = createAdminClient()

  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      const senderId = event.sender?.id
      const recipientId = event.recipient?.id
      const messageText = event.message?.text
      const messageId = event.message?.mid

      // Skip if no sender or no text message
      if (!senderId || !messageText) continue

      // --- Deduplicate by external message ID ---
      if (messageId) {
        const { data: existingMsg } = await supabase
          .from('messages')
          .select('id')
          .eq('external_id', messageId)
          .maybeSingle()

        if (existingMsg) continue
      }

      // --- Resolve org ---
      const orgId = await resolveOrg(supabase, recipientId || '', channel)
      if (!orgId) {
        console.error(`Meta messaging webhook: no org found for ${channel} recipient`, recipientId)
        continue
      }

      // --- Try to get sender profile name ---
      let senderName: string | undefined
      if (channel === 'messenger' && process.env.META_PAGE_ACCESS_TOKEN) {
        try {
          const profileRes = await fetch(
            `https://graph.facebook.com/v18.0/${senderId}?fields=name&access_token=${process.env.META_PAGE_ACCESS_TOKEN}`,
          )
          if (profileRes.ok) {
            const profile = await profileRes.json() as { name?: string }
            senderName = profile.name
          }
        } catch {
          // Profile lookup is best-effort
        }
      }

      if (!senderName) {
        senderName = `${channel === 'instagram_dm' ? 'Instagram' : 'Messenger'} User ${senderId.slice(-6)}`
      }

      // --- Find or create lead ---
      const lead = await findOrCreateLead(supabase, orgId, senderId, channel, senderName)
      if (!lead) continue

      // --- Find or create conversation ---
      const conversation = await findOrCreateConversation(supabase, lead.id, orgId, channel, senderId)
      if (!conversation) continue

      // --- Store inbound message ---
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        organization_id: conversation.organization_id,
        direction: 'inbound',
        content: messageText,
        status: 'delivered',
        external_id: messageId || null,
        is_ai_generated: false,
      })

      // --- Update conversation ---
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread_count: (conversation.unread_count ?? 0) + 1,
          status: 'open',
        })
        .eq('id', conversation.id)

      // --- Create notification ---
      const channelLabel = channel === 'instagram_dm' ? 'Instagram DM' : 'Messenger'
      const leadName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || senderName

      await supabase.from('notifications').insert({
        organization_id: orgId,
        type: 'message',
        title: `New ${channelLabel} message`,
        body: `${leadName}: ${messageText.slice(0, 100)}`,
        metadata: {
          conversation_id: conversation.id,
          lead_id: lead.id,
          channel,
        },
      })

      // --- Log activity ---
      await supabase.from('lead_activities').insert({
        lead_id: lead.id,
        organization_id: orgId,
        type: `${channel}_received`,
        direction: 'inbound',
        channel: channel,
        content: messageText,
        metadata: {
          external_id: messageId,
          conversation_id: conversation.id,
          sender_id: senderId,
        },
        is_automated: true,
      })
    }
  }

  // Meta requires 200 response
  return NextResponse.json({ received: true }, { status: 200 })
}
