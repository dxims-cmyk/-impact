// app/api/webhooks/lead-form/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { qualifyLeadTask } from '@/trigger/jobs/qualify-lead'
import { speedToLeadTask } from '@/trigger/jobs/speed-to-lead'
import { z } from 'zod'

// Public lead submission schema
const leadSubmissionSchema = z.object({
  // Required: org identifier
  org_id: z.string().uuid().optional(),
  org_slug: z.string().optional(),
  
  // Lead data
  email: z.string().email().optional(),
  phone: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  name: z.string().optional(), // Will be split into first/last
  company: z.string().optional(),
  message: z.string().optional(),
  
  // Attribution
  source: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  
  // Custom fields
  custom: z.record(z.unknown()).optional(),
}).refine(data => data.org_id || data.org_slug, {
  message: "Either org_id or org_slug is required"
}).refine(data => data.email || data.phone, {
  message: "Either email or phone is required"
})

// CORS headers for external submissions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle preflight
export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}

// POST /api/webhooks/lead-form - Public lead submission
export async function POST(request: NextRequest) {
  const supabase = createAdminClient()

  // Parse body (support both JSON and form data)
  let data: Record<string, unknown>
  
  const contentType = request.headers.get('content-type') || ''
  
  if (contentType.includes('application/json')) {
    data = await request.json()
  } else if (contentType.includes('form')) {
    const formData = await request.formData()
    data = Object.fromEntries(formData.entries())
  } else {
    return NextResponse.json(
      { error: 'Unsupported content type' },
      { status: 400, headers: corsHeaders }
    )
  }

  // Extract UTM params from query string if not in body
  const { searchParams } = new URL(request.url)
  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  for (const param of utmParams) {
    if (!data[param] && searchParams.get(param)) {
      data[param] = searchParams.get(param)
    }
  }

  // Validate
  const validation = leadSubmissionSchema.safeParse(data)
  
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.flatten() },
      { status: 400, headers: corsHeaders }
    )
  }

  const leadData = validation.data

  // Find organization
  let orgId = leadData.org_id
  
  if (!orgId && leadData.org_slug) {
    const { data: org, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', leadData.org_slug)
      .single()
    
    if (error || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404, headers: corsHeaders }
      )
    }
    
    orgId = org.id
  }

  // Split name if provided
  let firstName = leadData.first_name
  let lastName = leadData.last_name
  
  if (!firstName && leadData.name) {
    const parts = leadData.name.trim().split(' ')
    firstName = parts[0]
    lastName = parts.slice(1).join(' ') || undefined
  }

  // Check for existing lead
  const conditions = []
  if (leadData.email) conditions.push(`email.eq.${leadData.email}`)
  if (leadData.phone) conditions.push(`phone.eq.${leadData.phone}`)

  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('organization_id', orgId!)
    .or(conditions.join(','))
    .single()

  if (existing) {
    // Update existing lead with new info
    await supabase
      .from('leads')
      .update({
        updated_at: new Date().toISOString(),
        // Only update fields that weren't set
        ...(leadData.company && { company: leadData.company }),
      })
      .eq('id', existing.id)

    // Log activity
    await supabase
      .from('lead_activities')
      .insert({
        lead_id: existing.id,
        organization_id: orgId!,
        type: 'form_resubmit',
        content: leadData.message || 'Resubmitted lead form',
        metadata: { source: leadData.source, custom: leadData.custom }
      })

    return NextResponse.json(
      { success: true, lead_id: existing.id, is_new: false },
      { headers: corsHeaders }
    )
  }

  // Create new lead
  const { data: lead, error: createError } = await supabase
    .from('leads')
    .insert({
      organization_id: orgId!,
      email: leadData.email,
      phone: leadData.phone,
      first_name: firstName,
      last_name: lastName,
      company: leadData.company,
      source: leadData.source || 'website',
      source_detail: leadData.custom ? { form_data: leadData.custom, message: leadData.message } : null,
      utm_source: leadData.utm_source,
      utm_medium: leadData.utm_medium,
      utm_campaign: leadData.utm_campaign,
      utm_content: leadData.utm_content,
      stage: 'new'
    })
    .select()
    .single()

  if (createError) {
    console.error('Failed to create lead:', createError)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500, headers: corsHeaders }
    )
  }

  // Log activity
  await supabase
    .from('lead_activities')
    .insert({
      lead_id: lead.id,
      organization_id: orgId!,
      type: 'created',
      content: leadData.message || 'Lead submitted via form',
      metadata: { source: leadData.source, custom: leadData.custom },
      is_automated: true
    })

  // Trigger background jobs — fire and forget, don't block the response
  Promise.all([
    qualifyLeadTask.trigger({ leadId: lead.id }),
    speedToLeadTask.trigger({ leadId: lead.id }),
  ]).catch((error) => {
    console.error('Failed to trigger background jobs:', error)
  })

  return NextResponse.json(
    { success: true, lead_id: lead.id, is_new: true },
    { status: 201, headers: corsHeaders }
  )
}
