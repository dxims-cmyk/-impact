// app/api/webhooks/meta/leadgen/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchLeadgenData, parseLeadgenFields, verifyMetaSignature } from '@/lib/integrations/meta-ads'
import { qualifyLeadTask } from '@/trigger/jobs/qualify-lead'
import { speedToLeadTask } from '@/trigger/jobs/speed-to-lead'

// GET /api/webhooks/meta/leadgen - Meta webhook verification
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)

  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST /api/webhooks/meta/leadgen - Handle incoming leadgen events
export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text()

  // Verify signature if META_APP_SECRET is set
  if (process.env.META_APP_SECRET) {
    const signature = request.headers.get('x-hub-signature-256') || ''
    if (!verifyMetaSignature(rawBody, signature)) {
      console.error('Meta webhook: invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }
  }

  let body: MetaWebhookPayload
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Must always return 200 quickly to Meta
  // Process asynchronously
  if (body.object !== 'page') {
    return NextResponse.json({ received: true })
  }

  const supabase = createAdminClient()

  for (const entry of body.entry) {
    const pageId = entry.id

    for (const change of entry.changes) {
      if (change.field !== 'leadgen') continue

      const { leadgen_id, page_id, form_id, adgroup_id, ad_id, created_time } = change.value

      try {
        // Find the Meta integration by page_id stored in metadata, or fall back to any connected Meta integration
        const { data: integration } = await supabase
          .from('integrations')
          .select('*')
          .eq('provider', 'meta_ads')
          .eq('status', 'connected')
          .single()

        if (!integration) {
          console.error('Meta webhook: no connected Meta integration found')
          continue
        }

        // Fetch full lead data from Meta Graph API
        const leadgenData = await fetchLeadgenData(
          integration.access_token!,
          leadgen_id
        )

        // Parse field_data into usable fields
        const fields = parseLeadgenFields(leadgenData.field_data)

        // Extract standard fields (Meta forms commonly use these names)
        const email = fields.email || fields.work_email || null
        const phone = fields.phone_number || fields.phone || null
        const fullName = fields.full_name || fields.name || null
        const firstName = fields.first_name || (fullName ? fullName.split(' ')[0] : null)
        const lastName = fields.last_name || (fullName ? fullName.split(' ').slice(1).join(' ') || null : null)
        const company = fields.company_name || fields.company || null

        if (!email && !phone) {
          console.error('Meta webhook: lead has no email or phone', { leadgen_id })
          continue
        }

        // Check for existing lead
        const conditions: string[] = []
        if (email) conditions.push(`email.eq.${email}`)
        if (phone) conditions.push(`phone.eq.${phone}`)

        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .eq('organization_id', integration.organization_id)
          .or(conditions.join(','))
          .single()

        if (existing) {
          // Update existing lead
          await supabase
            .from('leads')
            .update({
              updated_at: new Date().toISOString(),
              ...(company && { company }),
            })
            .eq('id', existing.id)

          await supabase
            .from('lead_activities')
            .insert({
              lead_id: existing.id,
              organization_id: integration.organization_id,
              type: 'form_resubmit',
              content: 'Resubmitted via Meta Lead Ad',
              metadata: {
                leadgen_id,
                form_id,
                ad_id: ad_id || leadgenData.ad_id,
                campaign_id: leadgenData.campaign_id,
                source: 'meta_leadgen',
                fields,
              },
              is_automated: true,
            })

          continue
        }

        // Create new lead
        const { data: lead, error: createError } = await supabase
          .from('leads')
          .insert({
            organization_id: integration.organization_id,
            email,
            phone,
            first_name: firstName,
            last_name: lastName,
            company,
            source: 'meta_lead_ads',
            source_detail: {
              leadgen_id,
              form_id,
              page_id: page_id || pageId,
              ad_id: ad_id || leadgenData.ad_id,
              adset_id: adgroup_id || leadgenData.adset_id,
              campaign_id: leadgenData.campaign_id,
              fields,
              created_time,
            },
            utm_source: 'facebook',
            utm_medium: 'paid',
            stage: 'new',
          })
          .select()
          .single()

        if (createError) {
          console.error('Meta webhook: failed to create lead', createError)
          continue
        }

        // Log activity
        await supabase
          .from('lead_activities')
          .insert({
            lead_id: lead.id,
            organization_id: integration.organization_id,
            type: 'created',
            content: 'Lead captured from Meta Lead Ad',
            metadata: {
              leadgen_id,
              form_id,
              ad_id: ad_id || leadgenData.ad_id,
              source: 'meta_leadgen',
            },
            is_automated: true,
          })

        // Trigger background jobs
        Promise.all([
          qualifyLeadTask.trigger({ leadId: lead.id }),
          speedToLeadTask.trigger({ leadId: lead.id }),
        ]).catch((error) => {
          console.error('Meta webhook: failed to trigger background jobs', error)
        })
      } catch (error) {
        console.error('Meta webhook: error processing leadgen', { leadgen_id, error })
      }
    }
  }

  return NextResponse.json({ received: true })
}

// Meta webhook payload types
interface MetaWebhookPayload {
  object: string
  entry: {
    id: string
    time: number
    changes: {
      field: string
      value: {
        leadgen_id: string
        page_id: string
        form_id: string
        adgroup_id?: string
        ad_id?: string
        created_time: number
      }
    }[]
  }[]
}
