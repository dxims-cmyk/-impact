// app/api/automations/[id]/actions/route.ts
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

const createActionSchema = z.object({
  action_type: z.enum(actionTypes),
  action_config: z.record(z.unknown()).optional().default({}),
  action_order: z.number().int().min(0).optional(),
})

const reorderActionsSchema = z.object({
  actions: z.array(z.object({
    id: z.string().uuid(),
    action_order: z.number().int().min(0),
  })).min(1),
})

// Helper: verify automation belongs to user's org
async function verifyAutomationAccess(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  automationId: string
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

  const { data: automation, error } = await supabase
    .from('automations')
    .select('id, organization_id')
    .eq('id', automationId)
    .eq('organization_id', userData.organization_id)
    .single()

  if (error || !automation) {
    return { error: 'Automation not found', status: 404 }
  }

  return { userData, automation }
}

// GET /api/automations/[id]/actions - List actions for automation
export async function GET(
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

  // Verify access
  const result = await verifyAutomationAccess(supabase, user.id, id)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  // Get actions ordered by action_order
  const { data: actions, error } = await supabase
    .from('automation_actions')
    .select('*')
    .eq('automation_id', id)
    .order('action_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ actions: actions || [] })
}

// POST /api/automations/[id]/actions - Add action to automation
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

  // Verify access
  const result = await verifyAutomationAccess(supabase, user.id, id)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  // Parse and validate body
  const body = await request.json()
  const validation = createActionSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten(),
    }, { status: 400 })
  }

  // Determine action_order if not provided
  let actionOrder = validation.data.action_order
  if (actionOrder === undefined) {
    const { data: existing } = await supabase
      .from('automation_actions')
      .select('action_order')
      .eq('automation_id', id)
      .order('action_order', { ascending: false })
      .limit(1)

    actionOrder = existing && existing.length > 0 ? existing[0].action_order + 1 : 0
  }

  // Insert action
  const { data: action, error: createError } = await supabase
    .from('automation_actions')
    .insert({
      automation_id: id,
      action_type: validation.data.action_type,
      action_config: validation.data.action_config,
      action_order: actionOrder,
    })
    .select()
    .single()

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  return NextResponse.json({ action }, { status: 201 })
}

// PUT /api/automations/[id]/actions - Bulk reorder actions
export async function PUT(
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

  // Verify access
  const result = await verifyAutomationAccess(supabase, user.id, id)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  // Parse and validate body
  const body = await request.json()
  const validation = reorderActionsSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten(),
    }, { status: 400 })
  }

  // Verify all action IDs belong to this automation
  const actionIds = validation.data.actions.map((a) => a.id)
  const { data: existingActions } = await supabase
    .from('automation_actions')
    .select('id')
    .eq('automation_id', id)
    .in('id', actionIds)

  if (!existingActions || existingActions.length !== actionIds.length) {
    return NextResponse.json({
      error: 'One or more action IDs do not belong to this automation',
    }, { status: 400 })
  }

  // Update each action's order
  const updatePromises = validation.data.actions.map((action) =>
    supabase
      .from('automation_actions')
      .update({ action_order: action.action_order })
      .eq('id', action.id)
      .eq('automation_id', id)
  )

  const results = await Promise.all(updatePromises)
  const failed = results.find((r) => r.error)

  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 })
  }

  // Return updated actions
  const { data: actions, error: fetchError } = await supabase
    .from('automation_actions')
    .select('*')
    .eq('automation_id', id)
    .order('action_order', { ascending: true })

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  return NextResponse.json({ actions: actions || [] })
}
