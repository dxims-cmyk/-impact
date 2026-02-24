// app/api/automations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

const actionSchema = z.object({
  action_type: z.enum(actionTypes),
  action_config: z.record(z.unknown()).optional().default({}),
  action_order: z.number().int().min(0),
})

const createAutomationSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  trigger_type: z.enum(triggerTypes),
  trigger_config: z.record(z.unknown()).optional().default({}),
  actions: z.array(actionSchema).optional(),
})

// GET /api/automations - List automations for org
export async function GET(request: NextRequest) {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Parse query params
  const { searchParams } = new URL(request.url)
  const active = searchParams.get('active')

  // Build query
  let query = supabase
    .from('automations')
    .select('*, automation_actions(id)', { count: 'exact' })
    .eq('organization_id', userData.organization_id)
    .order('created_at', { ascending: false })

  // Filter by active status if provided
  if (active === 'true') {
    query = query.eq('is_active', true)
  } else if (active === 'false') {
    query = query.eq('is_active', false)
  }

  const { data: automations, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get recent run counts for each automation (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const automationIds = (automations || []).map((a) => a.id)

  let runCounts: Record<string, number> = {}
  if (automationIds.length > 0) {
    const { data: runs } = await supabase
      .from('automation_runs')
      .select('automation_id')
      .in('automation_id', automationIds)
      .gte('started_at', thirtyDaysAgo.toISOString())

    if (runs) {
      runCounts = runs.reduce((acc: Record<string, number>, run) => {
        acc[run.automation_id] = (acc[run.automation_id] || 0) + 1
        return acc
      }, {})
    }
  }

  // Map automations with action count and recent run count
  const result = (automations || []).map((automation) => {
    const { automation_actions, ...rest } = automation
    return {
      ...rest,
      action_count: Array.isArray(automation_actions) ? automation_actions.length : 0,
      recent_run_count: runCounts[automation.id] || 0,
    }
  })

  return NextResponse.json({
    automations: result,
    total: count,
  })
}

// POST /api/automations - Create automation
export async function POST(request: NextRequest) {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Parse and validate body
  const body = await request.json()
  const validation = createAutomationSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten(),
    }, { status: 400 })
  }

  const { actions, ...automationFields } = validation.data

  // Create automation
  const { data: automation, error: createError } = await supabase
    .from('automations')
    .insert({
      organization_id: userData.organization_id,
      name: automationFields.name,
      description: automationFields.description || null,
      trigger_type: automationFields.trigger_type,
      trigger_config: automationFields.trigger_config,
      is_active: false,
    })
    .select()
    .single()

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  // Insert actions if provided
  let createdActions = null
  if (actions && actions.length > 0) {
    const actionRows = actions.map((action) => ({
      automation_id: automation.id,
      action_type: action.action_type,
      action_config: action.action_config,
      action_order: action.action_order,
    }))

    const { data: actionsData, error: actionsError } = await supabase
      .from('automation_actions')
      .insert(actionRows)
      .select()
      .order('action_order', { ascending: true })

    if (actionsError) {
      // Automation was created but actions failed — clean up
      await supabase.from('automations').delete().eq('id', automation.id)
      return NextResponse.json({ error: actionsError.message }, { status: 500 })
    }

    createdActions = actionsData
  }

  return NextResponse.json({
    automation: {
      ...automation,
      actions: createdActions || [],
    },
  }, { status: 201 })
}
