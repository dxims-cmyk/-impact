// app/api/settings/reputation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const DEFAULT_SETTINGS = {
  enabled: false,
  trigger_stage: 'won',
  delay_hours: 48,
  send_via: ['email'],
  email_subject: 'How was your experience?',
  email_message: 'Hi {{name}}, thank you for choosing us! We would love to hear about your experience. Please take a moment to leave us a review.',
  whatsapp_message: "Hi {{name}}! Thanks for choosing us. We'd really appreciate a quick review: {{review_link}}",
  sms_message: 'Thanks for choosing us {{name}}! Leave a review: {{review_link}}',
  max_requests_per_lead: 1,
}

const reputationSettingsSchema = z.object({
  enabled: z.boolean(),
  trigger_stage: z.enum(['won', 'completed']),
  delay_hours: z.number().min(0).max(168),
  send_via: z.array(z.enum(['email', 'whatsapp', 'sms'])).min(1),
  email_subject: z.string().max(200),
  email_message: z.string().max(1000),
  whatsapp_message: z.string().max(500),
  sms_message: z.string().max(300),
  max_requests_per_lead: z.number().min(1).max(3),
})

// GET /api/settings/reputation - Get reputation settings
export async function GET(): Promise<NextResponse> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('reputation_settings')
    .eq('id', userData.organization_id)
    .single()

  const settings = org?.reputation_settings?.enabled !== undefined
    ? org.reputation_settings
    : DEFAULT_SETTINGS

  return NextResponse.json({ settings })
}

// PATCH /api/settings/reputation - Update reputation settings
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase2 = createAdminClient()
  const { data: userData } = await adminSupabase2
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  if (userData.role !== 'owner' && userData.role !== 'admin') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json()
  const validation = reputationSettingsSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten(),
    }, { status: 400 })
  }

  const { error } = await supabase
    .from('organizations')
    .update({ reputation_settings: validation.data })
    .eq('id', userData.organization_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
