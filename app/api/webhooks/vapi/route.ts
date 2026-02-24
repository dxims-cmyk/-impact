// app/api/webhooks/vapi/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { qualifyLeadTask } from '@/trigger/jobs/qualify-lead'
import { speedToLeadTask } from '@/trigger/jobs/speed-to-lead'
import crypto from 'crypto'

// Vapi sends payloads in two possible formats:
// 1. { message: { type: "...", call: {...}, ... } }
// 2. { type: "...", call: {...}, ... }
// We normalise here.
function normalizePayload(raw: any): { type: string; call: any; [key: string]: any } | null {
  if (raw?.message?.type) {
    return raw.message
  }
  if (raw?.type) {
    return raw
  }
  return null
}

// Extract phone number from Vapi call object
function extractPhoneNumber(call: any): string | null {
  return (
    call?.customer?.number ||
    call?.phoneNumber?.number ||
    call?.metadata?.customerPhone ||
    null
  )
}

// Extract caller name from Vapi call/transcript data
function extractCallerName(payload: any): string | null {
  return (
    payload?.call?.customer?.name ||
    payload?.call?.metadata?.customerName ||
    null
  )
}

// Resolve org ID from assistant metadata or integrations table
async function resolveOrgId(
  request: NextRequest,
  supabase: ReturnType<typeof createAdminClient>,
  payload: any
): Promise<string | null> {
  // 1. Check query params first (same as calcom webhook pattern)
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

  // 2. Check assistant metadata for org_id
  const assistantOrgId = payload?.call?.assistant?.metadata?.organization_id
  if (assistantOrgId) return assistantOrgId

  // 3. Look up from integrations table by assistant ID
  const assistantId = payload?.call?.assistantId || payload?.call?.assistant?.id
  if (assistantId) {
    // Search org settings for this assistant ID
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, settings')

    if (orgs) {
      for (const org of orgs) {
        const settings = org.settings as Record<string, any> | null
        if (settings?.ai_receptionist_assistant_id === assistantId) {
          return org.id
        }
      }
    }

    // Also check integrations table
    const { data: integration } = await supabase
      .from('integrations')
      .select('organization_id')
      .eq('provider', 'vapi')
      .eq('account_id', assistantId)
      .single()

    if (integration) return integration.organization_id
  }

  return null
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()

  let raw: any
  try {
    raw = await request.json()
  } catch {
    // Always return 200 to Vapi to prevent retries on parse errors
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 200 })
  }

  const payload = normalizePayload(raw)
  if (!payload) {
    return NextResponse.json({ received: true, note: 'Unrecognised payload format' })
  }

  // Verify Vapi webhook secret — fail closed if not configured
  const webhookSecret = process.env.VAPI_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('Vapi webhook: VAPI_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization') || request.headers.get('x-vapi-secret') || ''
  const secret = authHeader.replace('Bearer ', '')
  // Timing-safe comparison to prevent timing attacks
  try {
    if (!crypto.timingSafeEqual(Buffer.from(secret), Buffer.from(webhookSecret))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const eventType = payload.type
  const vapiCallId = payload.call?.id

  // Resolve org
  const orgId = await resolveOrgId(request, supabase, payload)

  try {
    switch (eventType) {
      case 'call.started':
      case 'status-update': {
        // Only handle "in-progress" status updates or call.started
        if (eventType === 'status-update' && payload.status !== 'in-progress') {
          break
        }

        if (!orgId || !vapiCallId) break

        const phoneNumber = extractPhoneNumber(payload)
        const callerName = extractCallerName(payload)

        // Create call record
        await supabase
          .from('calls')
          .upsert({
            vapi_call_id: vapiCallId,
            organization_id: orgId,
            phone_number: phoneNumber,
            caller_name: callerName,
            direction: (payload.call?.direction as 'inbound' | 'outbound') || 'inbound',
            status: 'in_progress',
            metadata: {
              assistant_id: payload.call?.assistantId || payload.call?.assistant?.id,
              started_at_raw: payload.call?.startedAt,
            },
            created_at: new Date().toISOString(),
          }, {
            onConflict: 'vapi_call_id',
          })

        break
      }

      case 'call.ended': {
        if (!vapiCallId) break

        const endedAt = payload.call?.endedAt || new Date().toISOString()
        const startedAt = payload.call?.startedAt
        let durationSeconds: number | null = null

        if (startedAt && endedAt) {
          durationSeconds = Math.round(
            (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000
          )
        }

        await supabase
          .from('calls')
          .update({
            status: 'completed',
            duration_seconds: durationSeconds,
            ended_at: endedAt,
          })
          .eq('vapi_call_id', vapiCallId)

        break
      }

      case 'transcript': {
        if (!vapiCallId) break

        const transcript = payload.transcript || payload.artifact?.transcript || null
        if (transcript) {
          await supabase
            .from('calls')
            .update({ transcript })
            .eq('vapi_call_id', vapiCallId)
        }
        break
      }

      case 'end-of-call-report': {
        if (!vapiCallId || !orgId) break

        const transcript = payload.transcript || payload.artifact?.transcript || null
        const summary = payload.summary || payload.artifact?.summary || null
        const recordingUrl = payload.recordingUrl || payload.artifact?.recordingUrl || null
        const phoneNumber = extractPhoneNumber(payload)
        const callerName = extractCallerName(payload)

        // Calculate duration
        const startedAt = payload.call?.startedAt
        const endedAt = payload.call?.endedAt || new Date().toISOString()
        let durationSeconds: number | null = null

        if (startedAt && endedAt) {
          durationSeconds = Math.round(
            (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000
          )
        }

        // Match or create lead by phone number
        let leadId: string | null = null

        if (phoneNumber) {
          // Try to find existing lead
          const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('organization_id', orgId)
            .eq('phone', phoneNumber)
            .single()

          if (existingLead) {
            leadId = existingLead.id
          } else {
            // Parse name parts
            const nameParts = (callerName || '').split(' ')
            const firstName = nameParts[0] || null
            const lastName = nameParts.slice(1).join(' ') || null

            // Create a new lead
            const { data: newLead } = await supabase
              .from('leads')
              .insert({
                organization_id: orgId,
                phone: phoneNumber,
                first_name: firstName,
                last_name: lastName,
                source: 'ai_receptionist',
                stage: 'new',
              })
              .select('id')
              .single()

            if (newLead) {
              leadId = newLead.id

              // Log activity for new lead creation
              await supabase
                .from('lead_activities')
                .insert({
                  lead_id: leadId,
                  organization_id: orgId,
                  type: 'created',
                  content: 'Lead created from AI Receptionist call',
                  is_automated: true,
                  metadata: { source: 'vapi', vapi_call_id: vapiCallId },
                })
            }
          }
        }

        // Update call record with full details
        await supabase
          .from('calls')
          .upsert({
            vapi_call_id: vapiCallId,
            organization_id: orgId,
            phone_number: phoneNumber,
            caller_name: callerName,
            direction: (payload.call?.direction as 'inbound' | 'outbound') || 'inbound',
            status: 'completed',
            duration_seconds: durationSeconds,
            transcript,
            recording_url: recordingUrl,
            summary,
            lead_id: leadId,
            ended_at: endedAt,
            metadata: {
              assistant_id: payload.call?.assistantId || payload.call?.assistant?.id,
              cost: payload.call?.cost || payload.cost,
            },
            created_at: startedAt || new Date().toISOString(),
          }, {
            onConflict: 'vapi_call_id',
          })

        // Log call activity on the lead
        if (leadId) {
          const durationStr = durationSeconds
            ? `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`
            : 'unknown duration'

          await supabase
            .from('lead_activities')
            .insert({
              lead_id: leadId,
              organization_id: orgId,
              type: 'call',
              direction: 'inbound',
              channel: 'call',
              content: `AI Receptionist call (${durationStr})${summary ? `: ${summary}` : ''}`,
              is_automated: true,
              metadata: {
                vapi_call_id: vapiCallId,
                duration_seconds: durationSeconds,
                recording_url: recordingUrl,
                source: 'vapi',
              },
            })

          // Trigger AI qualification with transcript context
          qualifyLeadTask.trigger({ leadId }).catch((err) => {
            console.error('Failed to trigger qualify-lead for Vapi call:', err)
          })

          // Trigger speed-to-lead notifications (WhatsApp alert to client)
          speedToLeadTask.trigger({ leadId }).catch((err) => {
            console.error('Failed to trigger speed-to-lead for Vapi call:', err)
          })
        }

        // Create notification for org
        await supabase
          .from('notifications')
          .insert({
            organization_id: orgId,
            type: 'lead',
            title: 'AI Receptionist Call',
            body: `${callerName || phoneNumber || 'Unknown caller'} called${summary ? ` — ${summary.slice(0, 100)}` : ''}`,
            metadata: {
              vapi_call_id: vapiCallId,
              lead_id: leadId,
              phone_number: phoneNumber,
            },
          })

        break
      }

      default:
        // Unhandled event — log but don't error
        console.info(`Vapi webhook: unhandled event type "${eventType}"`)
    }
  } catch (error) {
    console.error('Vapi webhook processing error:', error)
    // Always return 200 to prevent Vapi from retrying
  }

  return NextResponse.json({ received: true, event: eventType })
}
