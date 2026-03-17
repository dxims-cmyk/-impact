// app/api/automations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const triggerTypes = [
  'lead_created',
  'lead_scored',
  'lead_qualified',
  'appointment_booked',
  'appointment_cancelled',
  'form_submitted',
  'tag_added',
] as const

const updateAutomationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  trigger_type: z.enum(triggerTypes).optional(),
  trigger_config: z.record(z.unknown()).optional(),
})

// Helper: get user's org and verify automation belongs to it
async function getUserOrgAndAutomation(
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

  // Verify automation belongs to user's org
  const { data: automation, error } = await supabase
    .from('automations')
    .select('*')
    .eq('id', automationId)
    .eq('organization_id', userData.organization_id)
    .single()

  if (error || !automation) {
    return { error: 'Automation not found', status: 404 }
  }

  return { userData, automation }
}

// GET /api/automations/[id] - Get single automation with actions
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

  // Get user's org
  const adminSupabase2 = createAdminClient()
  const { data: userData } = await adminSupabase2
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Get automation with actions, filtered by org
  const { data: automation, error } = await supabase
    .from('automations')
    .select(`
      *,
      automation_actions(*)
    `)
    .eq('id', id)
    .eq('organization_id', userData.organization_id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Sort actions by action_order client-side (Supabase nested selects don't support order)
  if (automation.automation_actions) {
    automation.automation_actions.sort(
      (a: { action_order: number }, b: { action_order: number }) =>
        a.action_order - b.action_order
    )
  }

  // Rename for cleaner API response
  const { automation_actions, ...rest } = automation

  return NextResponse.json({
    ...rest,
    actions: automation_actions || [],
  })
}

// PATCH /api/automations/[id] - Update automation
export async function PATCH(
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

  // Verify org ownership
  const result = await getUserOrgAndAutomation(supabase, user.id, id)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  // Parse and validate body
  const body = await request.json()
  const validation = updateAutomationSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten(),
    }, { status: 400 })
  }

  // Build update object
  const updates = {
    ...validation.data,
    updated_at: new Date().toISOString(),
  }

  const { data: automation, error } = await supabase
    .from('automations')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', result.userData!.organization_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(automation)
}

// DELETE /api/automations/[id] - Delete automation (cascades to actions and runs)
export async function DELETE(
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

  // Verify org ownership
  const result = await getUserOrgAndAutomation(supabase, user.id, id)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  // Delete automation_runs first (references automation_id)
  await supabase
    .from('automation_runs')
    .delete()
    .eq('automation_id', id)

  // Delete automation_actions (references automation_id)
  await supabase
    .from('automation_actions')
    .delete()
    .eq('automation_id', id)

  // Delete the automation itself
  const { error } = await supabase
    .from('automations')
    .delete()
    .eq('id', id)
    .eq('organization_id', result.userData!.organization_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
