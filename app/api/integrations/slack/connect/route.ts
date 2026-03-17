// app/api/integrations/slack/connect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getSlackAuthUrl } from '@/lib/integrations/slack'
import crypto from 'crypto'

// GET /api/integrations/slack/connect - Redirect to Slack OAuth
export async function GET(request: NextRequest): Promise<NextResponse> {
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
  const statePayload = Buffer.from(JSON.stringify({
    orgId: userData.organization_id,
    token: state,
    timestamp: Date.now(),
  })).toString('base64')

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`
  const authUrl = getSlackAuthUrl(redirectUri)

  // Append state to the URL
  const url = new URL(authUrl)
  url.searchParams.set('state', statePayload)

  return NextResponse.redirect(url.toString())
}
