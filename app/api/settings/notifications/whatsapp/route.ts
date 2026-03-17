// app/api/settings/notifications/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const phoneRegex = /^\+[1-9]\d{6,14}$/

const updateSchema = z.object({
  numbers: z.array(z.string().regex(phoneRegex, 'Invalid phone format. Use +44XXXXXXXXXX')).max(5),
})

// GET - Get current WhatsApp notification numbers for the org
export async function GET(request: NextRequest) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org (or admin viewing client org)
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id, is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Support admin viewing as client via query param
  const orgId = request.nextUrl.searchParams.get('org_id')
  const targetOrgId = (userData.is_agency_user && orgId) ? orgId : userData.organization_id

  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', targetOrgId)
    .single()

  const settings = (org?.settings || {}) as Record<string, unknown>
  const numbers = Array.isArray(settings.whatsapp_notification_numbers)
    ? settings.whatsapp_notification_numbers
    : []

  return NextResponse.json({ numbers })
}

// PATCH - Update WhatsApp notification numbers
export async function PATCH(request: NextRequest) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase2 = createAdminClient()
  const { data: userData } = await adminSupabase2
    .from('users')
    .select('organization_id, is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const body = await request.json()

  // Support admin setting for a client org
  const targetOrgId = (userData.is_agency_user && body.org_id) ? body.org_id : userData.organization_id

  // Validate
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    )
  }

  // Get current settings and merge
  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', targetOrgId)
    .single()

  const currentSettings = (org?.settings || {}) as Record<string, unknown>
  const updatedSettings = {
    ...currentSettings,
    whatsapp_notification_numbers: parsed.data.numbers,
  }

  const { error } = await supabase
    .from('organizations')
    .update({ settings: updatedSettings })
    .eq('id', targetOrgId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ numbers: parsed.data.numbers })
}
