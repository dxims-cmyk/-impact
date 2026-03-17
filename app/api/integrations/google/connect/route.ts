// app/api/integrations/google/connect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getGoogleAuthUrl } from '@/lib/integrations/google-ads'
import crypto from 'crypto'

// GET /api/integrations/google/connect
export async function GET(request: NextRequest) {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Get user's org
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.redirect(new URL('/dashboard/integrations?error=no_organization', request.url))
  }

  // Generate state token
  const state = crypto.randomBytes(32).toString('hex')
  const statePayload = Buffer.from(JSON.stringify({
    orgId: userData.organization_id,
    token: state,
    timestamp: Date.now(),
  })).toString('base64')

  const authUrl = getGoogleAuthUrl(statePayload)

  return NextResponse.redirect(authUrl)
}
