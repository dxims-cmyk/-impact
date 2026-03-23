import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const DEFAULT_PREFERENCES: Record<string, { email: boolean; push: boolean; sms: boolean }> = {
  new_lead: { email: true, push: false, sms: false },
  hot_lead: { email: true, push: false, sms: false },
  message: { email: false, push: false, sms: false },
  appointment: { email: true, push: false, sms: false },
  report: { email: true, push: false, sms: false },
  system: { email: true, push: false, sms: false },
}

function mergeWithDefaults(stored: Record<string, any> | null): Record<string, { email: boolean; push: boolean; sms: boolean }> {
  const result: Record<string, { email: boolean; push: boolean; sms: boolean }> = {}
  for (const [key, defaults] of Object.entries(DEFAULT_PREFERENCES)) {
    const saved = stored?.[key]
    result[key] = {
      email: saved?.email ?? defaults.email,
      push: saved?.push ?? defaults.push,
      sms: saved?.sms ?? defaults.sms,
    }
  }
  return result
}

export async function GET(): Promise<NextResponse> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from('users')
    .select('notification_preferences')
    .eq('id', user.id)
    .single()

  // Return flat preferences object (not wrapped) — hook expects this shape
  const preferences = mergeWithDefaults(data?.notification_preferences as Record<string, any> | null)
  return NextResponse.json(preferences)
}

export async function PATCH(req: Request): Promise<NextResponse> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const updates = await req.json() as Record<string, { email?: boolean; push?: boolean; sms?: boolean }>

  // Fetch current preferences first to merge (admin client bypasses RLS)
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('notification_preferences')
    .eq('id', user.id)
    .single()

  const current = mergeWithDefaults(userData?.notification_preferences as Record<string, any> | null)

  // Deep merge: only override the specific channel toggled
  for (const [key, channels] of Object.entries(updates)) {
    if (current[key]) {
      current[key] = { ...current[key], ...channels }
    }
  }

  const { error } = await adminSupabase
    .from('users')
    .update({ notification_preferences: current })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(current)
}
