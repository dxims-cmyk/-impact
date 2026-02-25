// app/api/webhooks/calcom/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendAppointmentStatusEmail } from '@/lib/integrations/resend'
import crypto from 'crypto'

// Resolve org ID from query params (org_slug or org_id)
async function resolveOrgId(
  request: NextRequest,
  supabase: ReturnType<typeof createAdminClient>
): Promise<string | null> {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  const orgSlug = searchParams.get('org_slug')

  if (orgId) return orgId

  if (orgSlug) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', orgSlug)
      .single()
    return org?.id || null
  }

  // No fallback — require explicit org identifier
  return null
}

export async function POST(request: NextRequest) {
  // Verify Cal.com webhook signature if secret is configured
  const webhookSecret = process.env.CALCOM_WEBHOOK_SECRET
  const rawBody = await request.text()

  if (webhookSecret) {
    const signature = request.headers.get('x-cal-signature-256') || ''
    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex')

    try {
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }
  } else {
    console.warn('Cal.com webhook: CALCOM_WEBHOOK_SECRET not configured — signature verification skipped')
  }

  const supabase = createAdminClient()

  const orgId = await resolveOrgId(request, supabase)
  if (!orgId) {
    return NextResponse.json({ error: 'Organization not found. Add ?org_slug=your-slug to webhook URL.' }, { status: 400 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { triggerEvent, payload: booking } = payload

  if (!triggerEvent || !booking) {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
  }

  const attendeeEmail = booking.attendees?.[0]?.email || booking.responses?.email?.value
  const attendeeName = booking.attendees?.[0]?.name || booking.responses?.name?.value || ''

  // Try to match to an existing lead by email
  let leadId: string | null = null
  if (attendeeEmail) {
    const { data: lead } = await supabase
      .from('leads')
      .select('id')
      .eq('organization_id', orgId)
      .eq('email', attendeeEmail)
      .single()

    leadId = lead?.id || null
  }

  if (triggerEvent === 'BOOKING_CREATED') {
    const nameParts = attendeeName.split(' ')
    const startTime = booking.startTime
    const endTime = booking.endTime

    // Upsert appointment using Cal.com booking uid
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        organization_id: orgId,
        lead_id: leadId,
        title: booking.title || '30 Min Meeting',
        description: booking.description || null,
        start_time: startTime,
        end_time: endTime,
        timezone: booking.attendees?.[0]?.timeZone || 'Europe/London',
        status: booking.status === 'ACCEPTED' ? 'confirmed' : 'scheduled',
        google_event_id: booking.uid || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create appointment:', error)
      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
    }

    // If matched to a lead, update lead stage to 'booked' and log activity
    if (leadId) {
      await supabase
        .from('leads')
        .update({ stage: 'booked', updated_at: new Date().toISOString() })
        .eq('id', leadId)

      await supabase
        .from('lead_activities')
        .insert({
          lead_id: leadId,
          organization_id: orgId,
          type: 'appointment',
          content: `Booked: ${booking.title || '30 Min Meeting'} on ${new Date(startTime).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
          is_automated: true,
          metadata: { cal_uid: booking.uid, source: 'cal.com' },
        })

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          organization_id: orgId,
          type: 'appointment',
          title: 'New booking',
          body: `${attendeeName} booked a ${booking.title || '30 min meeting'}`,
          metadata: { lead_id: leadId, appointment_id: appointment.id },
        })
    }

    return NextResponse.json({ success: true, appointment_id: appointment.id })
  }

  if (triggerEvent === 'BOOKING_CANCELLED') {
    // Find appointment by Cal.com uid stored in google_event_id
    const uid = booking.uid
    if (uid) {
      const { data: apt } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancel_reason: booking.cancellationReason || 'Cancelled via Cal.com',
        })
        .eq('google_event_id', uid)
        .eq('organization_id', orgId)
        .select()
        .single()

      if (apt && apt.lead_id) {
        await supabase
          .from('lead_activities')
          .insert({
            lead_id: apt.lead_id,
            organization_id: orgId,
            type: 'appointment',
            content: `Booking cancelled: ${apt.title}`,
            is_automated: true,
            metadata: { cal_uid: uid, source: 'cal.com' },
          })
      }
    }

    // Send cancellation email to the attendee/prospect
    if (attendeeEmail) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name, settings')
        .eq('id', orgId)
        .single()

      const orgSettings = org?.settings as { booking_link?: string } | null

      sendAppointmentStatusEmail({
        to: attendeeEmail,
        leadName: attendeeName.split(' ')[0] || 'there',
        appointmentTitle: booking.title || 'Your appointment',
        eventType: 'cancelled',
        startTime: booking.startTime,
        endTime: booking.endTime,
        cancelReason: booking.cancellationReason || undefined,
        orgName: org?.name || 'Our team',
        bookingLink: orgSettings?.booking_link,
      }).catch((err: unknown) => console.error('Cal.com cancellation email failed:', err))
    }

    return NextResponse.json({ success: true })
  }

  if (triggerEvent === 'BOOKING_RESCHEDULED') {
    const uid = booking.uid
    if (uid) {
      // Fetch old times before updating
      const { data: oldApt } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('google_event_id', uid)
        .eq('organization_id', orgId)
        .single()

      await supabase
        .from('appointments')
        .update({
          start_time: booking.startTime,
          end_time: booking.endTime,
          status: 'scheduled',
        })
        .eq('google_event_id', uid)
        .eq('organization_id', orgId)

      if (leadId) {
        await supabase
          .from('lead_activities')
          .insert({
            lead_id: leadId,
            organization_id: orgId,
            type: 'appointment',
            content: `Booking rescheduled to ${new Date(booking.startTime).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
            is_automated: true,
            metadata: { cal_uid: uid, source: 'cal.com' },
          })
      }

      // Send reschedule email to the attendee/prospect
      if (attendeeEmail) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', orgId)
          .single()

        sendAppointmentStatusEmail({
          to: attendeeEmail,
          leadName: attendeeName.split(' ')[0] || 'there',
          appointmentTitle: booking.title || 'Your appointment',
          eventType: 'rescheduled',
          startTime: oldApt?.start_time || booking.rescheduleStartTime,
          endTime: oldApt?.end_time || booking.rescheduleEndTime,
          newStartTime: booking.startTime,
          newEndTime: booking.endTime,
          orgName: org?.name || 'Our team',
        }).catch((err: unknown) => console.error('Cal.com reschedule email failed:', err))
      }
    }

    return NextResponse.json({ success: true })
  }

  // Unhandled event type
  return NextResponse.json({ received: true, event: triggerEvent })
}
