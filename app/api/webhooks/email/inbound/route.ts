// app/api/webhooks/email/inbound/route.ts
// Resend inbound email webhook — captures email replies from leads
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

interface ResendInboundPayload {
  from: string
  to: string
  subject: string
  text?: string
  html?: string
  headers?: Record<string, string>[]
  attachments?: { filename: string; content_type: string }[]
  created_at?: string
}

// Extract email address from "Name <email@example.com>" format
function extractEmail(from: string): string {
  const match = from.match(/<(.+?)>/)
  return (match?.[1] || from).toLowerCase().trim()
}

// Strip HTML tags from content
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: ResendInboundPayload

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const senderEmail = extractEmail(payload.from)

  if (!senderEmail) {
    return NextResponse.json({ received: true, matched: false })
  }

  const supabase = createAdminClient()

  // --- Find lead by email ---
  const { data: lead } = await supabase
    .from('leads')
    .select('id, organization_id, first_name, last_name, phone')
    .eq('email', senderEmail)
    .limit(1)
    .maybeSingle()

  if (!lead) {
    // Try case-insensitive match
    const { data: leadCi } = await supabase
      .from('leads')
      .select('id, organization_id, first_name, last_name, phone')
      .ilike('email', senderEmail)
      .limit(1)
      .maybeSingle()

    if (!leadCi) {
      return NextResponse.json({ received: true, matched: false })
    }
    // Use case-insensitive match
    Object.assign(lead || {}, leadCi)
    // Re-declare for flow below
    return processInbound(supabase, leadCi, payload, senderEmail)
  }

  return processInbound(supabase, lead, payload, senderEmail)
}

async function processInbound(
  supabase: ReturnType<typeof createAdminClient>,
  lead: { id: string; organization_id: string; first_name: string | null; last_name: string | null },
  payload: ResendInboundPayload,
  senderEmail: string,
): Promise<NextResponse> {
  const leadName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || senderEmail

  // --- Find or create conversation ---
  let { data: conversation } = await supabase
    .from('conversations')
    .select('id, organization_id, unread_count')
    .eq('lead_id', lead.id)
    .eq('channel', 'email')
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
        channel: 'email',
        status: 'open',
        last_message_at: new Date().toISOString(),
      })
      .select('id, organization_id, unread_count')
      .single()

    if (convErr || !newConv) {
      console.error('Email webhook: failed to create conversation', convErr)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }
    conversation = newConv
  }

  // --- Extract message content ---
  const content = payload.text || (payload.html ? stripHtml(payload.html) : '')
  if (!content.trim()) {
    return NextResponse.json({ received: true, matched: true, empty: true })
  }

  // --- Store inbound message ---
  await supabase.from('messages').insert({
    conversation_id: conversation.id,
    organization_id: conversation.organization_id,
    direction: 'inbound',
    content: content.substring(0, 5000),
    status: 'delivered',
    is_ai_generated: false,
    metadata: {
      subject: payload.subject,
      has_attachments: (payload.attachments?.length || 0) > 0,
      from: senderEmail,
    },
  } as Record<string, unknown>)

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
  await supabase.from('notifications').insert({
    organization_id: conversation.organization_id,
    type: 'message',
    title: 'Email reply received',
    body: `${leadName}: ${payload.subject || content.slice(0, 100)}`,
    metadata: {
      conversation_id: conversation.id,
      lead_id: lead.id,
      subject: payload.subject,
    },
  })

  // --- Log activity ---
  await supabase.from('lead_activities').insert({
    lead_id: lead.id,
    organization_id: conversation.organization_id,
    type: 'email_received',
    direction: 'inbound',
    channel: 'email',
    content: content.substring(0, 500),
    metadata: {
      subject: payload.subject,
      conversation_id: conversation.id,
    },
    is_automated: true,
  })

  return NextResponse.json({
    received: true,
    matched: true,
    conversation_id: conversation.id,
  })
}
