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

  // Get lead with assigned user info
  const { data: lead, error } = await supabase
    .from('leads')
    .select('*, assigned_user:users!assigned_to(id, full_name, avatar_url, email)')
    .eq('id', id)
    .single()

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

  // Update lead
  const { data: lead, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

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

  // Delete lead (RLS will handle permissions)
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
