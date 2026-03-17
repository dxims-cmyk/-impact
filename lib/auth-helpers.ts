// lib/auth-helpers.ts
// Shared helper to fetch user data using admin client (bypasses RLS)
// This is needed because the RLS security fix (20260310) blocks
// the anon client from reading the users table reliably.

import { createClient, createAdminClient } from '@/lib/supabase/server'

interface UserData {
  organization_id: string | null
  is_agency_user: boolean
  role: string
}

/**
 * Verify auth and fetch user data in one call.
 * Uses the regular client for auth verification, then the admin client
 * (service role) to read user data from the users table, bypassing RLS.
 */
export async function getAuthenticatedUser(): Promise<{
  user: { id: string; email?: string } | null
  userData: UserData | null
}> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { user: null, userData: null }
  }

  const admin = createAdminClient()
  const { data: userData } = await admin
    .from('users')
    .select('organization_id, is_agency_user, role')
    .eq('id', user.id)
    .single()

  return { user, userData: userData as UserData | null }
}
