// app/api/webhooks/calendly/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendNewLeadAlert } from '@/lib/integrations/whatsapp'
import { sendAppointmentStatusEmail } from '@/lib/integrations/resend'
import crypto from 'crypto'

// Calendly webhook payload types
interface CalendlyWebhookPayload {
  event: 'invitee.created' | 'invitee.canceled'
  created_at: string
  created_by: string
  payload: {
    cancel_url: string
    created_at: string
    email: string
    event: string // URI to the scheduled event
    name: string
    new_invitee: string | null
    old_invitee: string | null
    reschedule_url: string
    rescheduled: boolean
    status: string
    text_reminder_number: string | null
    timezone: string
    tracking: {
      utm_campaign: string | null
      utm_source: string | null
      utm_medium: string | null
      utm_content: string | null
      utm_term: string | null
    }
    updated_at: string
    uri: string
    scheduled_event: {
      created_at: string
      end_time: string
      event_guests: unknown[]
      event_memberships: { user: string; user_email: string }[]
      event_type: string
      invitees_counter: { total: number; active: number; limit: number }
      location: {
        location: string | null
        type: string
      }
      name: string
      start_time: string
      status: string
      updated_at: string
      uri: string
    }
    questions_and_answers: {
      answer: string
      position: number
      question: string
    }[]
  }
}

// Find the organization that owns this Calendly connection based on event membership emails
async function resolveOrgFromEvent(
  supabase: ReturnType<typeof createAdminClient>,
  payload: CalendlyWebhookPayload['payload']
): Promise<string | null> {
  // The scheduled_event.event_memberships contains the Calendly user who owns the event
  const memberships = payload.scheduled_event?.event_memberships || []

  for (const membership of memberships) {
    if (membership.user) {
      // Match by user_uri stored in integration metadata
      const { data: integration } = await supabase
        .from('integrations')
        .select('organization_id')
        .eq('provider', 'calendly')
        .eq('status', 'connected')
        .filter('metadata->>user_uri', 'eq', membership.user)
        .single()

      if (integration) {
        return integration.organization_id
      }
    }

    if (membership.user_email) {
      // Fallback: match by account_id (which stores the Calendly user email)
      const { data: integration } = await supabase
        .from('integrations')
        .select('organization_id')
        .eq('provider', 'calendly')
        .eq('status', 'connected')
        .eq('account_id', membership.user_email)
        .single()

      if (integration) {
        return integration.organization_id
      }
    }
  }

  return null
}

// POST /api/webhooks/calendly - Receives Calendly webhook events
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify Calendly webhook signature if CALENDLY_WEBHOOK_SECRET is set
  const webhookSecret = process.env.CALENDLY_WEBHOOK_SECRET
  const rawBody = await request.text()

  if (webhookSecret) {
    const signature = request.headers.get('calendly-webhook-signature') || ''
    // Calendly sends: t=<timestamp>,v1=<signature>
    const parts = Object.fromEntries(signature.split(',').map(p => {
      const [k, ...v] = p.split('=')
      return [k, v.join('=')]
    }))

    if (parts.t && parts.v1) {
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(parts.t + '.' + rawBody)
        .digest('hex')

      try {
        if (!crypto.timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected))) {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
        }
      } catch {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }

      // Reject if timestamp is older than 5 minutes (replay protection)
      const ts = parseInt(parts.t, 10) * 1000
      if (Date.now() - ts > 5 * 60 * 1000) {
        return NextResponse.json({ error: 'Request too old' }, { status: 403 })
      }
    }
  }

  const supabase = createAdminClient()

  let body: CalendlyWebhookPayload
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { event, payload } = body

  if (!event || !payload) {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
  }

  // Resolve organization from the event membership
  const orgId = await resolveOrgFromEvent(supabase, payload)
  if (!orgId) {
    console.error('Calendly webhook: could not resolve organization', {
      event,
      memberships: payload.scheduled_event?.event_memberships,
    })
    // Return 200 to avoid Calendly retrying for events we can't match
    return NextResponse.json({ received: true, warning: 'organization_not_found' })
  }

  // --- invitee.created ---
  if (event === 'invitee.created') {
    const inviteeEmail = payload.email
    const inviteeName = payload.name || ''
    const scheduledEvent = payload.scheduled_event
    const eventTypeName = scheduledEvent?.name || 'Calendly Meeting'
    const startTime = scheduledEvent?.start_time
    const endTime = scheduledEvent?.end_time
    const timezone = payload.timezone || 'Europe/London'
    const eventUri = scheduledEvent?.uri || null

    // Parse invitee name into first/last
    const nameParts = inviteeName.split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Build description from questions and answers
    const qAndA = payload.questions_and_answers || []
    const description = qAndA.length > 0
      ? qAndA.map((qa) => `${qa.question}: ${qa.answer}`).join('\n')
      : null

    // Try to match to an existing lead by email
    let leadId: string | null = null
    if (inviteeEmail) {
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('organization_id', orgId)
        .eq('email', inviteeEmail)
        .single()

      leadId = existingLead?.id || null
    }

    // If no lead found, create one with source 'calendly'
    if (!leadId && inviteeEmail) {
      const { data: newLead } = await supabase
        .from('leads')
        .insert({
          organization_id: orgId,
          email: inviteeEmail,
          first_name: firstName || null,
          last_name: lastName || null,
          source: 'calendly',
          stage: 'booked',
          booked_at: new Date().toISOString(),
          utm_source: payload.tracking?.utm_source || null,
          utm_medium: payload.tracking?.utm_medium || null,
          utm_campaign: payload.tracking?.utm_campaign || null,
          utm_content: payload.tracking?.utm_content || null,
        })
        .select('id')
        .single()

      leadId = newLead?.id || null
    }

    // Create appointment
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .insert({
        organization_id: orgId,
        lead_id: leadId,
        title: eventTypeName,
        description,
        start_time: startTime,
        end_time: endTime,
        timezone,
        status: 'scheduled',
        // Store Calendly event URI in outlook_event_id (google_event_id is used by Cal.com)
        outlook_event_id: eventUri,
      })
      .select()
      .single()

    if (aptError) {
      console.error('Failed to create appointment from Calendly:', aptError)
      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
    }

    // Update lead stage to 'booked' and log activity
    if (leadId) {
      await supabase
        .from('leads')
        .update({
          stage: 'booked',
          booked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)

      const dateLabel = new Date(startTime).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })

      await supabase
        .from('lead_activities')
        .insert({
          lead_id: leadId,
          organization_id: orgId,
          type: 'appointment',
          content: `Appointment booked via Calendly: ${eventTypeName} on ${dateLabel}`,
          is_automated: true,
          metadata: {
            calendly_event_uri: eventUri,
            source: 'calendly',
            cancel_url: payload.cancel_url,
            reschedule_url: payload.reschedule_url,
          },
        })

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          organization_id: orgId,
          type: 'appointment',
          title: 'New Calendly booking',
          body: `${inviteeName || inviteeEmail} booked ${eventTypeName}`,
          metadata: { lead_id: leadId, appointment_id: appointment.id },
        })
    }

    // Send WhatsApp notification to owner (same pattern as speed-to-lead)
    try {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single()

      const orgSettings = orgData?.settings as {
        notification_whatsapp_numbers?: string[]
      } | null

      const whatsappNumbers = orgSettings?.notification_whatsapp_numbers || []
      for (const number of whatsappNumbers) {
        try {
          await sendNewLeadAlert({
            to: number,
            leadName: inviteeName || inviteeEmail || 'Unknown',
          })
        } catch (whatsappErr) {
          console.error('Calendly booking WhatsApp notification failed:', whatsappErr)
        }
      }
    } catch (settingsErr) {
      console.error('Failed to fetch org settings for WhatsApp notification:', settingsErr)
    }

    return NextResponse.json({ success: true, appointment_id: appointment.id })
  }

  // --- invitee.canceled ---
  if (event === 'invitee.canceled') {
    const inviteeEmail = payload.email
    const scheduledEvent = payload.scheduled_event
    const eventUri = scheduledEvent?.uri || null

    // Find appointment by Calendly event URI stored in outlook_event_id
    let appointmentQuery = supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: 'Cancelled via Calendly',
      })
      .eq('organization_id', orgId)

    if (eventUri) {
      appointmentQuery = appointmentQuery.eq('outlook_event_id', eventUri)
    }

    const { data: apt } = await appointmentQuery.select().single()

    if (apt && apt.lead_id) {
      // Log activity
      await supabase
        .from('lead_activities')
        .insert({
          lead_id: apt.lead_id,
          organization_id: orgId,
          type: 'appointment',
          content: `Appointment cancelled: ${apt.title}`,
          is_automated: true,
          metadata: { calendly_event_uri: eventUri, source: 'calendly' },
        })

      // Revert lead stage to 'contacted' if it was 'booked'
      const { data: lead } = await supabase
        .from('leads')
        .select('stage')
        .eq('id', apt.lead_id)
        .single()

      if (lead?.stage === 'booked') {
        await supabase
          .from('leads')
          .update({
            stage: 'contacted',
            updated_at: new Date().toISOString(),
          })
          .eq('id', apt.lead_id)
      }
    } else if (!apt && inviteeEmail) {
      // Fallback: try matching by lead email + event time
      const { data: leadByEmail } = await supabase
        .from('leads')
        .select('id')
        .eq('organization_id', orgId)
        .eq('email', inviteeEmail)
        .single()

      if (leadByEmail && scheduledEvent?.start_time) {
        const { data: aptByTime } = await supabase
          .from('appointments')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancel_reason: 'Cancelled via Calendly',
          })
          .eq('lead_id', leadByEmail.id)
          .eq('start_time', scheduledEvent.start_time)
          .eq('organization_id', orgId)
          .neq('status', 'cancelled')
          .select()
          .single()

        if (aptByTime) {
          await supabase
            .from('lead_activities')
            .insert({
              lead_id: leadByEmail.id,
              organization_id: orgId,
              type: 'appointment',
              content: `Appointment cancelled: ${aptByTime.title}`,
              is_automated: true,
              metadata: { source: 'calendly' },
            })

          const { data: lead } = await supabase
            .from('leads')
            .select('stage')
            .eq('id', leadByEmail.id)
            .single()

          if (lead?.stage === 'booked') {
            await supabase
              .from('leads')
              .update({
                stage: 'contacted',
                updated_at: new Date().toISOString(),
              })
              .eq('id', leadByEmail.id)
          }
        }
      }
    }

    // Send cancellation email to the invitee/prospect
    if (inviteeEmail) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name, settings')
        .eq('id', orgId)
        .single()

      const orgSettings = org?.settings as { booking_link?: string } | null
      const inviteeName = payload.name || ''

      sendAppointmentStatusEmail({
        to: inviteeEmail,
        leadName: inviteeName.split(' ')[0] || 'there',
        appointmentTitle: scheduledEvent?.name || 'Your appointment',
        eventType: 'cancelled',
        startTime: scheduledEvent?.start_time,
        endTime: scheduledEvent?.end_time,
        cancelReason: 'Cancelled via Calendly',
        orgName: org?.name || 'Our team',
        bookingLink: orgSettings?.booking_link || payload.reschedule_url,
      }).catch((err: unknown) => console.error('Calendly cancellation email failed:', err))
    }

    return NextResponse.json({ success: true })
  }

  // Unhandled event type
  return NextResponse.json({ received: true, event })
}
