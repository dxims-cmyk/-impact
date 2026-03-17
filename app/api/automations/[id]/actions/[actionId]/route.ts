// app/api/automations/[id]/actions/[actionId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const actionTypes = [
  'send_email',
  'send_whatsapp',
  'send_sms',
  'send_slack',
  'add_tag',
  'assign_user',
  'create_task',
  'wait',
  'webhook',
] as const

const updateActionSchema = z.object({
  action_type: z.enum(actionTypes).optional(),
  action_config: z.record(z.unknown()).optional(),
  action_order: z.number().int().min(0).optional(),
})

// Helper: verify automation + action belong to user's org
async function verifyActionAccess(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  automationId: string,
  actionId: string
) {
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', userId)
    .single()

  if (!userData?.organization_id) {
    return { error: 'No organization', status: 403 }
  }

  // Verify automation belongs to user's org
  const { data: automation, error: automationError } = await supabase
    .from('automations')
    .select('id, organization_id')
    .eq('id', automationId)
    .eq('organization_id', userData.organization_id)
    .single()

  if (automationError || !automation) {
    return { error: 'Automation not found', status: 404 }
  }

  // Verify action belongs to this automation
  const { data: action, error: actionError } = await supabase
    .from('automation_actions')
    .select('*')
    .eq('id', actionId)
    .eq('automation_id', automationId)
    .single()

  if (actionError || !action) {
    return { error: 'Action not found', status: 404 }
  }

  return { userData, automation, action }
}

// PATCH /api/automations/[id]/actions/[actionId] - Update action
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; actionId: string }> }
) {
  const { id, actionId } = await params
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify access
  const result = await verifyActionAccess(supabase, user.id, id, actionId)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  // Parse and validate body
  const body = await request.json()
  const validation = updateActionSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten(),
    }, { status: 400 })
  }

  // Update action
  const { data: action, error } = await supabase
    .from('automation_actions')
    .update(validation.data)
    .eq('id', actionId)
    .eq('automation_id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(action)
}

// DELETE /api/automations/[id]/actions/[actionId] - Delete action
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; actionId: string }> }
) {
  const { id, actionId } = await params
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify access
  const result = await verifyActionAccess(supabase, user.id, id, actionId)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  // Delete the action
  const { error } = await supabase
    .from('automation_actions')
    .delete()
    .eq('id', actionId)
    .eq('automation_id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
