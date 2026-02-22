// app/api/settings/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const notificationChannelSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  sms: z.boolean().optional(),
})

const updateNotificationsSchema = z.record(notificationChannelSchema)

// Default notification preferences
const defaultPreferences = {
  new_lead: { email: true, push: true, sms: false },
  hot_lead: { email: true, push: true, sms: true },
  message: { email: false, push: true, sms: false },
  appointment: { email: true, push: true, sms: true },
  report: { email: true, push: false, sms: false },
  system: { email: true, push: true, sms: false },
}

// GET /api/settings/notifications - Get notification preferences
export async function GET(request: NextRequest) {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's organization settings
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json(defaultPreferences)
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', userData.organization_id)
    .single()

  const settings = org?.settings as Record<string, unknown> | null
  const notificationPrefs = settings?.notification_preferences as typeof defaultPreferences | null

  return NextResponse.json(notificationPrefs || defaultPreferences)
}

// PATCH /api/settings/notifications - Update notification preferences
export async function PATCH(request: NextRequest) {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Parse and validate body
  const body = await request.json()
  const validation = updateNotificationsSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  // Get current settings
  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', userData.organization_id)
    .single()

  const currentSettings = (org?.settings as Record<string, unknown>) || {}
  const currentPrefs = (currentSettings.notification_preferences as typeof defaultPreferences) || defaultPreferences

  // Merge preferences
  const updatedPrefs = { ...currentPrefs }
  for (const [key, value] of Object.entries(validation.data)) {
    if (updatedPrefs[key as keyof typeof updatedPrefs]) {
      updatedPrefs[key as keyof typeof updatedPrefs] = {
        ...updatedPrefs[key as keyof typeof updatedPrefs],
        ...value,
      }
    }
  }

  // Update organization settings
  const { error } = await supabase
    .from('organizations')
    .update({
      settings: {
        ...currentSettings,
        notification_preferences: updatedPrefs,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', userData.organization_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(updatedPrefs)
}
