// app/api/conversations/[id]/ai-reply/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateConversationReply } from '@/lib/ai/claude'

// POST /api/conversations/[id]/ai-reply - Generate AI reply suggestion
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

  // Get conversation with messages and lead
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select(`
      *,
      lead:leads(*),
      messages(id, content, direction, created_at)
    `)
    .eq('id', id)
    .single()

  if (convError || !conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Get organization settings
  const { data: org } = await supabase
    .from('organizations')
    .select('name, settings')
    .eq('id', conversation.organization_id)
    .single()

  const orgSettings = org?.settings as { booking_link?: string } | null

  // Format messages for AI
  const messages = conversation.messages
    ?.sort((a: { created_at: string }, b: { created_at: string }) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    .map((m: { direction: string; content: string }) => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant' as const,
      content: m.content,
    }))

  if (!messages || messages.length === 0) {
    return NextResponse.json({
      error: 'No messages in conversation'
    }, { status: 400 })
  }

  try {
    // Generate AI reply
    const response = await generateConversationReply(
      messages,
      {
        first_name: conversation.lead?.first_name,
        last_name: conversation.lead?.last_name,
        email: conversation.lead?.email,
        phone: conversation.lead?.phone,
        company: conversation.lead?.company,
        temperature: conversation.lead?.temperature,
        score: conversation.lead?.score,
        ai_summary: conversation.lead?.ai_summary,
      },
      {
        business_name: org?.name || 'Our Team',
        booking_link: orgSettings?.booking_link || '',
      }
    )

    return NextResponse.json({
      reply: response.reply,
      shouldEscalate: response.should_escalate,
      escalationReason: response.escalation_reason,
      detectedIntent: response.detected_intent,
    })
  } catch (error) {
    console.error('AI reply generation error:', error)
    return NextResponse.json({
      error: 'Failed to generate AI reply'
    }, { status: 500 })
  }
}
