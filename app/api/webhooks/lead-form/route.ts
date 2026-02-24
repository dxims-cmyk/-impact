// app/api/webhooks/lead-form/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/integrations/resend'
import { qualifyLeadTask } from '@/trigger/jobs/qualify-lead'
import { speedToLeadTask } from '@/trigger/jobs/speed-to-lead'
import { z } from 'zod'
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit'
import { triggerAutomations } from '@/trigger/jobs/run-automation'

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
  // Per-IP rate limit: 10 submissions per minute
  const ip = getIdentifier(request)
  const rateCheck = checkRateLimit(`lead-form:${ip}`, { limit: 10, windowMs: 60 * 1000 })
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429, headers: corsHeaders }
    )
  }

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

  // Merge query string params into body (org identifiers, UTM, source)
  const { searchParams } = new URL(request.url)
  const mergeParams = ['org_id', 'org_slug', 'source', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  for (const param of mergeParams) {
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

  // Check for existing lead — sanitize values to prevent filter injection
  const conditions = []
  if (leadData.email) conditions.push(`email.eq.${(leadData.email as string).replace(/[,()]/g, '')}`)
  if (leadData.phone) conditions.push(`phone.eq.${(leadData.phone as string).replace(/[^\d+\- ]/g, '')}`)

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

  // Send auto-response email to prospect immediately (not via background job)
  // This ensures the prospect gets an email even if Trigger.dev is unavailable
  if (leadData.email) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name, settings')
      .eq('id', orgId!)
      .single()

    const orgName = org?.name || 'Our team'
    const settings = org?.settings as { booking_link?: string } | null
    const bookingLink = settings?.booking_link

    const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

    const leadFirstName = firstName || 'there'
    const leadCompany = leadData.company ? escHtml(leadData.company) : undefined
    const leadCompanyRaw = leadData.company
    const leadMessage = leadData.message ? escHtml(leadData.message) : undefined
    const leadMessageRaw = leadData.message

    // Division config: 4 active divisions — Studio, Creative, Impact, Vision
    const divisions: Record<string, { label: string; accent: string; button: string; keywords: string[] }> = {
      'ampm-studio':   { label: 'Studio',   accent: '#8b5cf6', button: '#7c3aed', keywords: ['studio', 'record', 'recording', 'mix', 'master', 'mastering', 'vocal', 'session', 'book studio', 'single', 'album', 'ep ', 'track', 'music', 'song', 'beat', 'producer', 'rapper', 'artist', 'release'] },
      'ampm-creative': { label: 'Creative', accent: '#ec4899', button: '#db2777', keywords: ['design', 'branding', 'logo', 'website', 'social media', 'content', 'photography', 'photo', 'graphic', 'creative', 'brand'] },
      'ampm-impact':   { label: 'Impact',   accent: '#ef4444', button: '#dc2626', keywords: ['marketing', 'ads', 'advert', 'campaign', 'lead', 'growth', 'seo', 'ppc', 'facebook ads', 'google ads', 'tiktok ads', 'digital marketing', 'strategy'] },
      'ampm-vision':   { label: 'Vision',   accent: '#06b6d4', button: '#0891b2', keywords: ['video', 'film', 'music video', 'commercial', 'animation', 'shoot', 'director', 'visuals', 'cinemat', 'edit', 'motion', 'camera', 'drone'] },
    }

    // Determine division: explicit source > auto-detect from message > default
    const sourceRaw = leadData.source || 'website'
    let divisionKey = Object.keys(divisions).includes(sourceRaw) ? sourceRaw : ''

    // Auto-detect from message if source is generic
    if (!divisionKey && leadMessage) {
      const msgLower = leadMessage.toLowerCase()
      let bestMatch = ''
      let bestScore = 0
      for (const [key, div] of Object.entries(divisions)) {
        const score = div.keywords.filter(kw => msgLower.includes(kw)).length
        if (score > bestScore) {
          bestScore = score
          bestMatch = key
        }
      }
      if (bestScore > 0) divisionKey = bestMatch
    }

    const division = divisionKey ? divisions[divisionKey] : null
    const divisionLabel = division ? `: ${division.label}` : ''
    const accentColor = division?.accent || '#a5b4fc'
    const buttonColor = division?.button || '#6366f1'
    const divisionFullName = division ? `AM:PM ${division.label}` : orgName

    // Build personalised opening based on what the prospect told us
    let personalLine = `Thank you for reaching out to <strong>${divisionFullName}</strong>!`
    if (leadMessage && leadCompany) {
      personalLine = `Thank you for reaching out to <strong>${divisionFullName}</strong> on behalf of <strong>${leadCompany}</strong>! We've had a read of your message and love what you're working on.`
    } else if (leadMessage) {
      personalLine = `Thank you for reaching out to <strong>${divisionFullName}</strong>! We've had a read of your message and we're excited to chat.`
    } else if (leadCompany) {
      personalLine = `Thank you for reaching out to <strong>${divisionFullName}</strong> on behalf of <strong>${leadCompany}</strong>! We'd love to learn more about what you're working on.`
    }

    // Build personalised plain text version (uses raw unescaped values — plain text is safe)
    let personalTextLine = `Thank you for reaching out to ${divisionFullName}!`
    if (leadMessageRaw && leadCompanyRaw) {
      personalTextLine = `Thank you for reaching out to ${divisionFullName} on behalf of ${leadCompanyRaw}! We've had a read of your message and love what you're working on.`
    } else if (leadMessageRaw) {
      personalTextLine = `Thank you for reaching out to ${divisionFullName}! We've had a read of your message and we're excited to chat.`
    } else if (leadCompanyRaw) {
      personalTextLine = `Thank you for reaching out to ${divisionFullName} on behalf of ${leadCompanyRaw}! We'd love to learn more about what you're working on.`
    }

    sendEmail({
      to: leadData.email,
      replyTo: 'hello@mediampm.com',
      subject: `Thanks for getting in touch, ${leadFirstName}!`,
      text: [
        `Hi ${leadFirstName},`,
        '',
        personalTextLine,
        '',
        leadMessageRaw ? `You said: "${leadMessageRaw}"` : '',
        '',
        `A member of our team will be reviewing your enquiry personally and will be in touch within 24 hours.`,
        '',
        bookingLink ? `Want to skip the wait? Book a call here: ${bookingLink}` : '',
        '',
        `Best regards,`,
        `The ${divisionFullName} Team`,
        '',
        `${orgName} | mediampm.com`,
      ].filter(Boolean).join('\n'),
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align:center;">
        <img src="https://impact-full.vercel.app/ampm-header-logo.png" alt="${orgName}" style="width:100%;max-width:600px;height:auto;display:block;" />
        ${division ? `<div style="background:#1a1a2e;padding:8px 24px 14px;text-align:center;"><p style="color:${accentColor};margin:0;font-size:14px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">${divisionLabel}</p></div>` : ''}
      </div>
      <div style="padding:32px 24px;">
        <p style="margin:0 0 16px;">Hi ${leadFirstName},</p>
        <p style="margin:0 0 16px;">${personalLine}</p>
        ${leadMessage ? `
        <div style="margin:0 0 16px;padding:12px 16px;background:#f8f9fa;border-left:3px solid ${accentColor};border-radius:0 8px 8px 0;">
          <p style="margin:0;color:#555;font-style:italic;">"${leadMessage}"</p>
        </div>` : ''}
        <p style="margin:0 0 16px;">A member of our team will be reviewing your enquiry personally and will be in touch within 24 hours.</p>
        ${bookingLink ? `
        <p style="margin:0 0 24px;">Want to skip the wait?</p>
        <div style="text-align:center;margin:0 0 24px;">
          <a href="${bookingLink}" style="display:inline-block;background:${buttonColor};color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Book a Call Now</a>
        </div>` : ''}
        <p style="margin:24px 0 0;">Best regards,<br><strong>The ${divisionFullName} Team</strong></p>
      </div>
      <div style="padding:16px 24px;background:#f3f4f6;text-align:center;font-size:12px;color:#9ca3af;">
        <p style="margin:0;"><a href="https://mediampm.com" style="color:#9ca3af;text-decoration:none;">${orgName}</a> &bull; mediampm.com</p>
      </div>
    </div>
  </div>
</body>
</html>`,
    }).catch((error) => {
      console.error('Failed to send auto-response email:', error)
    })
  }

  // Trigger 'form_submitted' automations
  triggerAutomations({
    organizationId: orgId!,
    leadId: lead.id,
    triggerType: 'form_submitted',
  }).catch(() => {})

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
