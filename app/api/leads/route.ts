// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { qualifyLeadTask } from '@/trigger/jobs/qualify-lead'
import { speedToLeadTask } from '@/trigger/jobs/speed-to-lead'
import { sendNewLeadAlert } from '@/lib/integrations/whatsapp'
import { z } from 'zod'
import { sanitizeFilterValue } from '@/lib/utils'
import { triggerAutomations } from '@/trigger/jobs/run-automation'

// Validation schema for creating leads
const createLeadSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company: z.string().optional(),
  job_title: z.string().optional(),
  website: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  stage: z.string().optional(),
  send_welcome: z.boolean().optional().default(false),
  organization_id: z.string().uuid().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone is required"
})

// GET /api/leads - List leads
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org (admin client bypasses RLS)
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
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
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const stage = searchParams.get('stage')
  const temperature = searchParams.get('temperature')
  const source = searchParams.get('source')
  const search = searchParams.get('search')
  const sortBy = searchParams.get('sort') || 'created_at'
  const sortOrder = searchParams.get('order') || 'desc'

  // Build query
  let query = supabase
    .from('leads')
    .select('*, assigned_user:users!assigned_to(full_name, avatar_url)', { count: 'exact' })

  // Filter by org (unless agency user viewing all)
  if (!userData.is_agency_user) {
    query = query.eq('organization_id', userData.organization_id)
  } else if (searchParams.get('org')) {
    query = query.eq('organization_id', searchParams.get('org'))
  }

  // Apply filters
  if (stage) query = query.eq('stage', stage)
  if (temperature) query = query.eq('temperature', temperature)
  if (source) query = query.eq('source', source)
  if (search) {
    const s = sanitizeFilterValue(search)
    query = query.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,company.ilike.%${s}%`)
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data: leads, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    leads,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil((count || 0) / limit)
    }
  })
}

// POST /api/leads - Create lead
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
    .select('organization_id, is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Parse body early to check for org_id override (agency viewing as client)
  const body = await request.json()
  const targetOrgId = (userData.is_agency_user && body.organization_id)
    ? body.organization_id
    : userData.organization_id

  // Check preview mode lead limit
  const { data: orgData } = await supabase
    .from('organizations')
    .select('membership_status')
    .eq('id', targetOrgId)
    .single()

  if (orgData?.membership_status === 'preview') {
    const { count } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', targetOrgId)

    if ((count || 0) >= 2) {
      return NextResponse.json({
        error: 'Preview mode allows up to 2 leads. Activate your account for unlimited leads.',
        code: 'PREVIEW_LIMIT',
      }, { status: 403 })
    }
  }

  // Validate body (already parsed above)
  const validation = createLeadSchema.safeParse(body)

  if (!validation.success) {
    const flat = validation.error.flatten()
    // Build a human-readable message from field + form errors
    const fieldErrors = Object.entries(flat.fieldErrors).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
    const formErrors = flat.formErrors || []
    const message = [...formErrors, ...fieldErrors].join('. ') || 'Validation failed'

    return NextResponse.json({
      error: message,
      details: flat,
    }, { status: 400 })
  }

  // Check for duplicate — scoped to target org only
  const dupConditions: string[] = []
  if (validation.data.email) {
    dupConditions.push(`email.eq.${sanitizeFilterValue(validation.data.email)}`)
  }
  if (validation.data.phone) {
    dupConditions.push(`phone.eq.${sanitizeFilterValue(validation.data.phone)}`)
  }

  const { data: existing } = dupConditions.length > 0
    ? await supabase
        .from('leads')
        .select('id')
        .eq('organization_id', targetOrgId)
        .or(dupConditions.join(','))
        .single()
    : { data: null }

  if (existing) {
    return NextResponse.json({
      error: 'Lead already exists',
      leadId: existing.id
    }, { status: 409 })
  }

  // Separate flags and extra fields from lead data
  const { send_welcome, notes, job_title, website, location, stage, organization_id: _orgId, ...leadFields } = validation.data

  // Store notes, job_title, website, location in source_detail JSONB
  const sourceDetail: Record<string, unknown> = {}
  if (notes) sourceDetail.notes = notes
  if (job_title) sourceDetail.job_title = job_title
  if (website) sourceDetail.website = website
  if (location) sourceDetail.location = location

  // Create lead in target org
  const { data: lead, error: createError } = await supabase
    .from('leads')
    .insert({
      organization_id: targetOrgId,
      ...leadFields,
      source_detail: Object.keys(sourceDetail).length > 0 ? sourceDetail : null,
      stage: stage || 'new'
    })
    .select()
    .single()

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  // Log activity
  await supabase
    .from('lead_activities')
    .insert({
      lead_id: lead.id,
      organization_id: targetOrgId,
      type: 'created',
      content: notes || 'Lead created',
      performed_by: user.id
    })

  // ---- Instant WhatsApp alert (inline, no queue delay) ----
  // Send the client notification NOW before returning the response.
  // This keeps the alert under 2 seconds instead of 8-10 via Trigger.dev.
  try {
    const { data: orgForAlert } = await supabase
      .from('organizations')
      .select('settings, membership_status')
      .eq('id', targetOrgId)
      .single()

    const alertSettings = orgForAlert?.settings as {
      speed_to_lead_enabled?: boolean
      whatsapp_notification_numbers?: string[]
    } | null

    if (alertSettings?.speed_to_lead_enabled) {
      const AMPM_FALLBACK = '+447386297524'
      const isActivated = orgForAlert?.membership_status === 'active'
      const numbers = isActivated
        ? (alertSettings.whatsapp_notification_numbers || [])
        : [AMPM_FALLBACK]

      const leadName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'New lead'

      for (const number of numbers) {
        sendNewLeadAlert({
          to: number,
          leadName,
          leadCompany: lead.company,
          aiScore: null, // Score not available yet (AI qualifies async)
        }).catch((err) => {
          console.error('Inline WhatsApp alert failed:', err)
        })
      }
    }
  } catch {
    // Never block lead creation if WhatsApp alert fails
  }

  // ---- Background jobs (email, Zapier, Slack, AI welcome) ----
  // Speed-to-lead skips WhatsApp alert (already sent inline above)
  const jobs: Promise<unknown>[] = [
    qualifyLeadTask.trigger({ leadId: lead.id }),
    speedToLeadTask.trigger({ leadId: lead.id, sendWelcomeEmail: !!send_welcome, skipWhatsAppAlert: true }),
  ]

  Promise.all(jobs).catch((error) => {
    console.error('Failed to trigger background jobs:', error)
  })

  // Trigger 'lead_created' automations
  triggerAutomations({
    organizationId: targetOrgId,
    leadId: lead.id,
    triggerType: 'lead_created',
  }).catch(() => {})

  return NextResponse.json({ lead }, { status: 201 })
}
