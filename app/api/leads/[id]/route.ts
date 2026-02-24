// app/api/leads/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for updating leads
const updateLeadSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company: z.string().optional(),
  stage: z.enum(['new', 'qualified', 'contacted', 'booked', 'won', 'lost']).optional(),
  score: z.number().min(1).max(10).optional(),
  temperature: z.enum(['hot', 'warm', 'cold']).optional(),
  source: z.string().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  lost_reason: z.string().optional(),
})

// Helper: get user's org
async function getUserOrg(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase
    .from('users')
    .select('organization_id, is_agency_user')
    .eq('id', userId)
    .single()
  return data
}

// GET /api/leads/[id] - Get single lead
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
  const userData = await getUserOrg(supabase, user.id)
  if (!userData?.organization_id && !userData?.is_agency_user) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Get lead with assigned user info — filtered by org
  let query = supabase
    .from('leads')
    .select('*, assigned_user:users!assigned_to(id, full_name, avatar_url, email)')
    .eq('id', id)

  if (!userData.is_agency_user) {
    query = query.eq('organization_id', userData.organization_id)
  }

  const { data: lead, error } = await query.single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(lead)
}

// PATCH /api/leads/[id] - Update lead
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

  // Parse and validate body
  const body = await request.json()
  const validation = updateLeadSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  // Build update object with timestamp updates
  const updates: Record<string, unknown> = {
    ...validation.data,
    updated_at: new Date().toISOString(),
  }

  // Set stage timestamps
  if (validation.data.stage === 'qualified' && !body.qualified_at) {
    updates.qualified_at = new Date().toISOString()
  }
  if (validation.data.stage === 'contacted' && !body.contacted_at) {
    updates.contacted_at = new Date().toISOString()
  }
  if (validation.data.stage === 'booked' && !body.booked_at) {
    updates.booked_at = new Date().toISOString()
  }
  if (validation.data.stage === 'won' && !body.converted_at) {
    updates.converted_at = new Date().toISOString()
  }
  if (validation.data.stage === 'lost' && !body.lost_at) {
    updates.lost_at = new Date().toISOString()
  }

  // Get user's org
  const userData = await getUserOrg(supabase, user.id)
  if (!userData?.organization_id && !userData?.is_agency_user) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Update lead — filtered by org
  let updateQuery = supabase
    .from('leads')
    .update(updates)
    .eq('id', id)

  if (!userData.is_agency_user) {
    updateQuery = updateQuery.eq('organization_id', userData.organization_id)
  }

  const { data: lead, error } = await updateQuery.select().single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log activity for stage changes
  if (validation.data.stage) {
    await supabase.from('lead_activities').insert({
      lead_id: id,
      organization_id: lead.organization_id,
      type: 'stage_changed',
      content: `Stage changed to ${validation.data.stage}`,
      performed_by: user.id,
    })
  }

  return NextResponse.json(lead)
}

// DELETE /api/leads/[id] - Delete lead
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

  // Get user's org
  const userData = await getUserOrg(supabase, user.id)
  if (!userData?.organization_id && !userData?.is_agency_user) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Delete lead — filtered by org
  let deleteQuery = supabase
    .from('leads')
    .delete()
    .eq('id', id)

  if (!userData.is_agency_user) {
    deleteQuery = deleteQuery.eq('organization_id', userData.organization_id)
  }

  const { error } = await deleteQuery

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
