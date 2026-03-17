// app/api/conversations/[id]/ai-control/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const aiControlSchema = z.object({
  action: z.enum(['resume', 'pause', 'handoff']),
})

// POST /api/conversations/[id]/ai-control - Toggle AI handling for a conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user has permission (owner, admin, or member)
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id, role, is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (!['owner', 'admin', 'member'].includes(userData.role) && !userData.is_agency_user) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Parse and validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = aiControlSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const { action } = validation.data

  // Build update based on action
  const updateData: Record<string, unknown> = {}

  switch (action) {
    case 'resume':
      updateData.ai_handling = 'active'
      updateData.ai_message_count = 0
      break
    case 'pause':
      updateData.ai_handling = 'paused'
      break
    case 'handoff':
      updateData.ai_handling = 'handed_off'
      break
  }

  // Update conversation
  const { data: conversation, error: updateError } = await supabase
    .from('conversations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    if (updateError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Log activity on the lead
  if (conversation.lead_id) {
    await supabase.from('lead_activities').insert({
      lead_id: conversation.lead_id,
      organization_id: conversation.organization_id,
      type: 'ai_control',
      content: `AI handling set to "${action}" by ${userData.role}`,
      metadata: {
        action,
        conversation_id: id,
        performed_by: user.id,
      },
      performed_by: user.id,
      is_automated: false,
    })
  }

  return NextResponse.json(conversation)
}
