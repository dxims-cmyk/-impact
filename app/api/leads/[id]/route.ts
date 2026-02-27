// app/api/leads/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { tasks } from '@trigger.dev/sdk/v3'
import type { sendReviewRequestTask } from '@/trigger/jobs/send-review-request'

// Validation schema for updating leads
const updateLeadSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company: z.string().optional(),
  stage: z.enum(['new', 'qualified', 'contacted', 'booked', 'won', 'lost']).optional(),
  score: z.number().min(1).max(10).optional(),
  temperature: z.enum(['hot', 'warm', 'cold']).optional(),
  source: z.string().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  lost_reason: z.string().optional(),
  deal_value: z.number().min(0).optional(),
})

// Helper: get user's org
async function getUserOrg(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase
    .from('users')
    .select('organization_id, is_agency_user')
    .eq('id', userId)
    .single()
  return data
}

// GET /api/leads/[id] - Get single lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org
  const userData = await getUserOrg(supabase, user.id)
  if (!userData?.organization_id && !userData?.is_agency_user) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Get lead with assigned user info — filtered by org
  let query = supabase
    .from('leads')
    .select('*, assigned_user:users!assigned_to(id, full_name, avatar_url, email)')
    .eq('id', id)

  if (!userData.is_agency_user) {
    query = query.eq('organization_id', userData.organization_id)
  }

  const { data: lead, error } = await query.single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(lead)
}

// PATCH /api/leads/[id] - Update lead
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse and validate body
  const body = await request.json()
  const validation = updateLeadSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  // Build update object with timestamp updates
  const updates: Record<string, unknown> = {
    ...validation.data,
    updated_at: new Date().toISOString(),
  }

  // Set stage timestamps
  if (validation.data.stage === 'qualified' && !body.qualified_at) {
    updates.qualified_at = new Date().toISOString()
  }
  if (validation.data.stage === 'contacted' && !body.contacted_at) {
    updates.contacted_at = new Date().toISOString()
  }
  if (validation.data.stage === 'booked' && !body.booked_at) {
    updates.booked_at = new Date().toISOString()
  }
  if (validation.data.stage === 'won' && !body.converted_at) {
    updates.converted_at = new Date().toISOString()
  }
  if (validation.data.stage === 'lost' && !body.lost_at) {
    updates.lost_at = new Date().toISOString()
  }

  // Get user's org
  const userData = await getUserOrg(supabase, user.id)
  if (!userData?.organization_id && !userData?.is_agency_user) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Update lead — filtered by org
  let updateQuery = supabase
    .from('leads')
    .update(updates)
    .eq('id', id)

  if (!userData.is_agency_user) {
    updateQuery = updateQuery.eq('organization_id', userData.organization_id)
  }

  const { data: lead, error } = await updateQuery.select().single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log activity for stage changes
  if (validation.data.stage) {
    await supabase.from('lead_activities').insert({
      lead_id: id,
      organization_id: lead.organization_id,
      type: 'stage_changed',
      content: `Stage changed to ${validation.data.stage}`,
      performed_by: user.id,
    })

    // Trigger review request when lead is marked as won
    if (validation.data.stage === 'won') {
      try {
        const { data: org } = await supabase
          .from('organizations')
          .select('plan, reputation_settings')
          .eq('id', lead.organization_id)
          .single()

        if (org?.plan === 'pro' && (org.reputation_settings as { enabled?: boolean })?.enabled) {
          const delayHours = (org.reputation_settings as { delay_hours?: number })?.delay_hours ?? 48

          await tasks.trigger<typeof sendReviewRequestTask>(
            'send-review-request',
            { lead_id: id, organization_id: lead.organization_id },
            delayHours > 0 ? { delay: `${delayHours}h` } : undefined
          )
        }
      } catch (err) {
        console.error('Failed to schedule review request:', err)
      }

      // Track revenue for ROI — update ad_performance if lead came from a campaign
      const dealValue = validation.data.deal_value || body.deal_value
      if (dealValue && dealValue > 0 && lead.utm_campaign) {
        try {
          // Find the ad campaign by name or external ID
          const { data: adCampaign } = await supabase
            .from('ad_campaigns')
            .select('id')
            .eq('organization_id', lead.organization_id)
            .or(`name.eq.${lead.utm_campaign},external_id.eq.${lead.utm_campaign}`)
            .limit(1)
            .maybeSingle()

          if (adCampaign) {
            // Get today's date for the performance record
            const today = new Date().toISOString().split('T')[0]

            // Try to update existing record, otherwise insert
            const { data: existing } = await supabase
              .from('ad_performance')
              .select('id, revenue, conversions')
              .eq('campaign_id', adCampaign.id)
              .eq('date', today)
              .maybeSingle()

            if (existing) {
              await supabase
                .from('ad_performance')
                .update({
                  revenue: (existing.revenue || 0) + dealValue,
                  conversions: (existing.conversions || 0) + 1,
                })
                .eq('id', existing.id)
            } else {
              await supabase
                .from('ad_performance')
                .insert({
                  organization_id: lead.organization_id,
                  campaign_id: adCampaign.id,
                  date: today,
                  revenue: dealValue,
                  conversions: 1,
                  impressions: 0,
                  clicks: 0,
                  spend: 0,
                  leads: 0,
                })
            }
          }
        } catch (err) {
          console.error('Failed to track ROI revenue:', err)
        }
      }
    }
  }

  return NextResponse.json(lead)
}

// DELETE /api/leads/[id] - Delete lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org
  const userData = await getUserOrg(supabase, user.id)
  if (!userData?.organization_id && !userData?.is_agency_user) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Delete lead — filtered by org
  let deleteQuery = supabase
    .from('leads')
    .delete()
    .eq('id', id)

  if (!userData.is_agency_user) {
    deleteQuery = deleteQuery.eq('organization_id', userData.organization_id)
  }

  const { error } = await deleteQuery

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
