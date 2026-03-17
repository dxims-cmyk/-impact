// app/api/integrations/meta/connect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getMetaAuthUrl } from '@/lib/integrations/meta-ads'
import crypto from 'crypto'

// GET /api/integrations/meta/connect - Redirect to Meta OAuth
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

  // Generate state token for CSRF protection
  const state = crypto.randomBytes(32).toString('hex')

  // Store state in session (or could use signed JWT)
  // For simplicity, we'll encode org_id in state
  const statePayload = Buffer.from(JSON.stringify({
    orgId: userData.organization_id,
    token: state,
    timestamp: Date.now(),
  })).toString('base64')

  // Get Meta auth URL
  const authUrl = getMetaAuthUrl(statePayload)

  return NextResponse.redirect(authUrl)
}
