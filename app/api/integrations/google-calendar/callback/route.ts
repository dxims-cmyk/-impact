// app/api/integrations/google-calendar/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeGoogleCalendarCode } from '@/lib/integrations/google-calendar'
import { encryptTokens } from '@/lib/encryption'

// GET /api/integrations/google-calendar/callback
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=${error}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=missing_params', request.url)
    )
  }

  // Decode state
  let stateData: { orgId: string; token: string; timestamp: number }
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64').toString())
  } catch {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=invalid_state', request.url)
    )
  }

  // Validate timestamp (15 min expiry)
  if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=state_expired', request.url)
    )
  }

  const supabase = createClient()

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify user belongs to the org in state
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id || userData.organization_id !== stateData.orgId) {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=org_mismatch', request.url)
    )
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-calendar/callback`
    const tokens = await exchangeGoogleCalendarCode(code, redirectUri)

    // Get user's Google profile email for account_name
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const profile = profileRes.ok ? await profileRes.json() : null

    // Check for existing integration
    const { data: existing } = await supabase
      .from('integrations')
      .select('id')
      .eq('organization_id', stateData.orgId)
      .eq('provider', 'google_calendar')
      .single()

    const encrypted = encryptTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    })

    const integrationData = {
      organization_id: stateData.orgId,
      provider: 'google_calendar' as const,
      status: 'connected' as const,
      access_token: encrypted.access_token,
      refresh_token: encrypted.refresh_token,
      account_name: profile?.email || profile?.name || 'Google Calendar',
      account_id: profile?.id || null,
      metadata: {
        expires_at: tokens.expires_at ? new Date(tokens.expires_at).toISOString() : null,
        email: profile?.email,
      },
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      await supabase
        .from('integrations')
        .update(integrationData)
        .eq('id', existing.id)
    } else {
      await supabase
        .from('integrations')
        .insert(integrationData)
    }

    return NextResponse.redirect(
      new URL('/dashboard/integrations?connected=google_calendar', request.url)
    )
  } catch (err) {
    console.error('Google Calendar OAuth callback error:', err)
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=google_calendar_oauth_failed', request.url)
    )
  }
}
