// app/api/appointments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { sendAppointmentStatusEmail } from '@/lib/integrations/resend'

const updateAppointmentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  cancel_reason: z.string().optional(),
})

// GET /api/appointments/[id]
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

  const { data: appointment, error } = await supabase
    .from('appointments')
    .select(`
      *,
      lead:leads(id, first_name, last_name, email, phone, company)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(appointment)
}

// PATCH /api/appointments/[id]
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
  const validation = updateAppointmentSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  // Build update object
  const updates = { ...validation.data } as Record<string, unknown>

  // Handle cancellation
  if (validation.data.status === 'cancelled') {
    updates.cancelled_at = new Date().toISOString()
  }

  const { data: appointment, error } = await (supabase
    .from('appointments') as any)
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      lead:leads(id, first_name, last_name, email, phone)
    `)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log activity if lead associated
  if (appointment.lead_id && (validation.data.status === 'completed' || validation.data.status === 'cancelled' || validation.data.status === 'no_show')) {
    await (supabase.from('lead_activities') as any).insert({
      lead_id: appointment.lead_id,
      organization_id: appointment.organization_id,
      type: `appointment_${validation.data.status}`,
      content: `Appointment ${validation.data.status}: ${appointment.title}`,
      metadata: { appointment_id: id },
      performed_by: user.id,
      is_automated: false,
    })
  }

  // Send email notification to prospect for confirmed/cancelled
  if (
    (validation.data.status === 'confirmed' || validation.data.status === 'cancelled') &&
    appointment.lead?.email
  ) {
    const { data: org } = await (supabase
      .from('organizations') as any)
      .select('name, settings')
      .eq('id', appointment.organization_id)
      .single()

    const orgSettings = org?.settings as { booking_link?: string } | null

    sendAppointmentStatusEmail({
      to: appointment.lead.email,
      leadName: appointment.lead.first_name || 'there',
      appointmentTitle: appointment.title,
      eventType: validation.data.status as 'confirmed' | 'cancelled',
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      cancelReason: validation.data.cancel_reason,
      orgName: org?.name || 'Our team',
      bookingLink: orgSettings?.booking_link,
    }).catch((err: unknown) => console.error('Failed to send appointment status email:', err))
  }

  return NextResponse.json(appointment)
}

// DELETE /api/appointments/[id]
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

  // Fetch appointment with lead data before deleting (for email notification)
  const { data: appointment } = await (supabase
    .from('appointments') as any)
    .select(`
      *,
      lead:leads(id, first_name, last_name, email)
    `)
    .eq('id', id)
    .single()

  // Send deletion email to prospect if lead has email
  if (appointment?.lead?.email) {
    const { data: org } = await (supabase
      .from('organizations') as any)
      .select('name, settings')
      .eq('id', appointment.organization_id)
      .single()

    const orgSettings = org?.settings as { booking_link?: string } | null

    sendAppointmentStatusEmail({
      to: appointment.lead.email,
      leadName: appointment.lead.first_name || 'there',
      appointmentTitle: appointment.title,
      eventType: 'deleted',
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      orgName: org?.name || 'Our team',
      bookingLink: orgSettings?.booking_link,
    }).catch((err: unknown) => console.error('Failed to send appointment deletion email:', err))
  }

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
