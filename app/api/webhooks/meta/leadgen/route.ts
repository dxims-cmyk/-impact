// app/api/webhooks/meta/leadgen/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchLeadgenData, parseLeadgenFields, verifyMetaSignature } from '@/lib/integrations/meta-ads'
import { decryptTokens } from '@/lib/encryption'
import { qualifyLeadTask } from '@/trigger/jobs/qualify-lead'
import { speedToLeadTask } from '@/trigger/jobs/speed-to-lead'
import { triggerAutomations } from '@/trigger/jobs/run-automation'

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

  // Verify Meta signature — mandatory when META_APP_SECRET is configured
  const appSecret = process.env.META_APP_SECRET
  if (!appSecret) {
    console.error('Meta webhook: META_APP_SECRET not configured — rejecting request')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const signature = request.headers.get('x-hub-signature-256') || ''
  if (!verifyMetaSignature(rawBody, signature)) {
    console.error('Meta webhook: invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
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
        // Find the Meta integration by page_id in metadata, then fall back to account_id match
        let integration: Record<string, unknown> | null = null

        // Try matching by page_id stored in integration metadata
        const { data: byPage } = await supabase
          .from('integrations')
          .select('*')
          .eq('provider', 'meta_ads')
          .eq('status', 'connected')
          .contains('metadata', { page_id: page_id || pageId })
          .single()

        if (byPage) {
          integration = byPage
        } else {
          // Fall back: if only one connected Meta integration, use it
          const { data: allMeta } = await supabase
            .from('integrations')
            .select('*')
            .eq('provider', 'meta_ads')
            .eq('status', 'connected')

          if (allMeta && allMeta.length === 1) {
            integration = allMeta[0]
          } else if (allMeta && allMeta.length > 1) {
            console.error('Meta webhook: multiple integrations found, cannot determine org for page', page_id || pageId)
            continue
          }
        }

        // Resolve access token and organization ID
        let accessToken: string | null = null
        let organizationId: string | null = null

        if (integration) {
          organizationId = integration.organization_id as string

          // Decrypt the stored OAuth token
          try {
            const decrypted = decryptTokens({ access_token: integration.access_token! })
            accessToken = decrypted.access_token
          } catch {
            // Token might not be encrypted
            accessToken = integration.access_token as string
          }
        } else if (process.env.META_PAGE_ACCESS_TOKEN) {
          // Fallback: use env var token and find org by meta_page_id or use first org
          accessToken = process.env.META_PAGE_ACCESS_TOKEN

          const targetPageId = page_id || pageId
          const { data: orgByPage } = await supabase
            .from('organizations')
            .select('id')
            .eq('meta_page_id', targetPageId)
            .single()

          if (orgByPage) {
            organizationId = orgByPage.id
          } else {
            // Last resort: use the first (and likely only) organization
            const { data: firstOrg } = await supabase
              .from('organizations')
              .select('id')
              .limit(1)
              .single()
            organizationId = firstOrg?.id || null
          }
        }

        if (!accessToken || !organizationId) {
          console.error('Meta webhook: no access token or organization found', { page_id: page_id || pageId })
          continue
        }

        // Fetch full lead data from Meta Graph API
        const leadgenData = await fetchLeadgenData(
          accessToken,
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

        // Check for existing lead — sanitize values to prevent filter injection
        const conditions: string[] = []
        if (email) conditions.push(`email.eq.${email.replace(/[,()]/g, '')}`)
        if (phone) conditions.push(`phone.eq.${phone.replace(/[^\d+\- ]/g, '')}`)

        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .eq('organization_id', organizationId)
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
              organization_id: organizationId,
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
            organization_id: organizationId,
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
            organization_id: organizationId,
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
          speedToLeadTask.trigger({ leadId: lead.id, sendWelcomeEmail: true }),
        ]).catch((error) => {
          console.error('Meta webhook: failed to trigger background jobs', error)
        })

        // Trigger 'lead_created' automations
        triggerAutomations({
          organizationId,
          leadId: lead.id,
          triggerType: 'lead_created',
        }).catch(() => {})
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
