// app/api/webhooks/manychat/route.ts
// Receives subscriber events from ManyChat (Instagram DMs + Messenger)
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { qualifyLeadTask } from '@/trigger/jobs/qualify-lead'
import { speedToLeadTask } from '@/trigger/jobs/speed-to-lead'
import crypto from 'crypto'

// Resolve org from query params
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

  return null
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify ManyChat webhook secret — fail closed if not configured
  const webhookSecret = process.env.MANYCHAT_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('ManyChat webhook: MANYCHAT_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  // Timing-safe comparison to prevent timing attacks
  try {
    if (!crypto.timingSafeEqual(Buffer.from(token), Buffer.from(webhookSecret))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabase = createAdminClient()

  const orgId = await resolveOrgId(request, supabase)
  if (!orgId) {
    return NextResponse.json(
      { error: 'Organization not found. Add ?org_slug=your-slug to webhook URL.' },
      { status: 400 }
    )
  }

  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ManyChat sends subscriber data in various formats.
  // Common fields: first_name, last_name, name, email, phone, ig_username,
  // custom_fields, flow_ns (flow namespace/name), live_chat_url
  const firstName = (payload.first_name as string) || ''
  const lastName = (payload.last_name as string) || ''
  const name = (payload.name as string) || `${firstName} ${lastName}`.trim()
  const email = (payload.email as string) || null
  const phone = (payload.phone as string) || null
  const igUsername = (payload.ig_username as string) || (payload.instagram_username as string) || null
  const customFields = (payload.custom_fields as Record<string, unknown>) || {}
  const flowName = (payload.flow_ns as string) || (payload.flow_name as string) || null
  const manychatId = (payload.id as string) || (payload.subscriber_id as string) || null
  const channel = igUsername ? 'instagram_dm' : 'messenger'

  // Need at least a name or email or phone to create a useful lead
  if (!name && !email && !phone && !igUsername) {
    return NextResponse.json({ received: true, skipped: 'No identifying info' })
  }

  // Check for duplicate by ManyChat subscriber ID or email or phone
  let existingLeadId: string | null = null

  if (manychatId) {
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('organization_id', orgId)
      .contains('source_detail', { manychat_id: manychatId })
      .single()
    existingLeadId = existing?.id || null
  }

  if (!existingLeadId && email) {
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('organization_id', orgId)
      .eq('email', email)
      .single()
    existingLeadId = existing?.id || null
  }

  if (!existingLeadId && phone) {
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('organization_id', orgId)
      .eq('phone', phone)
      .single()
    existingLeadId = existing?.id || null
  }

  const sourceDetail = {
    manychat_id: manychatId,
    instagram_username: igUsername,
    manychat_flow: flowName,
    manychat_fields: Object.keys(customFields).length > 0 ? customFields : undefined,
    channel,
  }

  let leadId = existingLeadId

  if (existingLeadId) {
    // Update existing lead with any new info
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      source_detail: sourceDetail,
    }
    if (email) updates.email = email
    if (phone) updates.phone = phone

    await supabase
      .from('leads')
      .update(updates)
      .eq('id', existingLeadId)
  } else {
    // Create new lead
    const nameParts = name.split(' ')
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        organization_id: orgId,
        first_name: nameParts[0] || firstName || null,
        last_name: nameParts.slice(1).join(' ') || lastName || null,
        email,
        phone,
        source: channel,
        source_detail: sourceDetail,
        stage: 'new',
      })
      .select('id')
      .single()

    if (error) {
      console.error('ManyChat webhook: failed to create lead:', error)
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
    }

    leadId = lead.id

    // Log activity
    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      organization_id: orgId,
      type: 'lead_created',
      channel: channel === 'instagram_dm' ? 'manychat' : 'manychat',
      direction: 'inbound',
      content: igUsername
        ? `New lead from Instagram DM (@${igUsername})${flowName ? ` via "${flowName}" flow` : ''}`
        : `New lead from Messenger${flowName ? ` via "${flowName}" flow` : ''}`,
      is_automated: true,
      metadata: sourceDetail,
    })

    // Trigger qualify-lead + speed-to-lead jobs
    Promise.all([
      qualifyLeadTask.trigger({ leadId: leadId! }),
      speedToLeadTask.trigger({ leadId: leadId! }),
    ]).catch((err) => {
      console.error('ManyChat webhook: failed to trigger background jobs:', err)
    })

    // Create notification
    await supabase.from('notifications').insert({
      organization_id: orgId,
      type: 'new_lead',
      title: 'New lead from ' + (channel === 'instagram_dm' ? 'Instagram' : 'Messenger'),
      body: `${name || igUsername || 'Someone'} reached out${flowName ? ` via "${flowName}"` : ''}`,
      metadata: { lead_id: leadId, source: channel },
    })
  }

  return NextResponse.json({ success: true, lead_id: leadId, is_new: !existingLeadId })
}
