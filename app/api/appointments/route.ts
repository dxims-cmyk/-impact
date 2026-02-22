// app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createAppointmentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  timezone: z.string().default('Europe/London'),
  lead_id: z.string().uuid().optional(),
})

// GET /api/appointments - List appointments
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
    .select('organization_id, is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id && !userData?.is_agency_user) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Parse query params
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const status = searchParams.get('status')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const leadId = searchParams.get('leadId')

  // Build query
  let query = supabase
    .from('appointments')
    .select(`
      *,
      lead:leads(id, first_name, last_name, email, phone, company)
    `, { count: 'exact' })

  // Filter by org
  if (!userData.is_agency_user) {
    query = query.eq('organization_id', userData.organization_id)
  }

  // Apply filters
  if (status) query = query.eq('status', status)
  if (startDate) query = query.gte('start_time', startDate)
  if (endDate) query = query.lte('start_time', endDate)
  if (leadId) query = query.eq('lead_id', leadId)

  // Order by start time
  query = query.order('start_time', { ascending: true })

  // Pagination
  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data: appointments, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    appointments,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil((count || 0) / limit)
    }
  })
}

// POST /api/appointments - Create appointment
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
  const validation = createAppointmentSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  // Verify lead exists if provided
  if (validation.data.lead_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('id')
      .eq('id', validation.data.lead_id)
      .single()

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
  }

  // Create appointment
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      organization_id: userData.organization_id,
      ...validation.data,
      status: 'scheduled',
    })
    .select(`
      *,
      lead:leads(id, first_name, last_name, email, phone)
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update lead stage if lead provided
  if (validation.data.lead_id) {
    await supabase
      .from('leads')
      .update({
        stage: 'booked',
        booked_at: new Date().toISOString(),
      })
      .eq('id', validation.data.lead_id)
      .eq('stage', 'contacted') // Only update if in contacted stage

    // Log activity
    await supabase.from('lead_activities').insert({
      lead_id: validation.data.lead_id,
      organization_id: userData.organization_id,
      type: 'appointment_booked',
      content: `Appointment scheduled: ${validation.data.title}`,
      metadata: { appointment_id: appointment.id },
      performed_by: user.id,
      is_automated: false,
    })
  }

  return NextResponse.json(appointment, { status: 201 })
}
