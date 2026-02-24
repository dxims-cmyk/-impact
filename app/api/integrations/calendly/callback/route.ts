// app/api/integrations/calendly/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  exchangeCalendlyCode,
  getCurrentUser,
  getEventTypes,
  createWebhookSubscription,
} from '@/lib/integrations/calendly'
import { encryptTokens } from '@/lib/encryption'

// GET /api/integrations/calendly/callback - Handle Calendly OAuth callback
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
  let stateData: { orgId: string; timestamp: number }
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
    // Exchange code for tokens
    const tokens = await exchangeCalendlyCode(code)

    // Fetch current user info
    const calendlyUser = await getCurrentUser(tokens.access_token)

    // The organization URI comes from the token response
    const orgUri = tokens.organization

    // Fetch event types for default selection
    const eventTypes = await getEventTypes(tokens.access_token, calendlyUser.uri)
    const defaultEventType = eventTypes.length > 0 ? eventTypes[0] : null

    // Create webhook subscription for invitee events
    const webhookCallbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/calendly`
    let webhookSubscription: { uri: string } | null = null
    try {
      webhookSubscription = await createWebhookSubscription(
        tokens.access_token,
        orgUri,
        webhookCallbackUrl
      )
    } catch (webhookError) {
      // Webhook creation may fail if one already exists for this org — non-fatal
      console.error('Calendly webhook subscription creation failed (may already exist):', webhookError)
    }

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Check for existing integration
    const { data: existing } = await supabase
      .from('integrations')
      .select('id')
      .eq('organization_id', stateData.orgId)
      .eq('provider', 'calendly')
      .single()

    const encrypted = encryptTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    })

    const integrationData = {
      organization_id: stateData.orgId,
      provider: 'calendly' as const,
      status: 'connected' as const,
      access_token: encrypted.access_token,
      refresh_token: encrypted.refresh_token,
      token_expires_at: expiresAt,
      account_name: calendlyUser.name,
      account_id: calendlyUser.email,
      metadata: {
        user_uri: calendlyUser.uri,
        org_uri: orgUri,
        scheduling_url: calendlyUser.scheduling_url,
        webhook_subscription_uri: webhookSubscription?.uri || null,
        expires_at: expiresAt,
        event_types: eventTypes.map((et) => ({
          uri: et.uri,
          name: et.name,
          slug: et.slug,
          duration: et.duration,
          scheduling_url: et.scheduling_url,
        })),
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

    // Update org settings with Calendly connection info
    const { data: org } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', stateData.orgId)
      .single()

    const currentSettings = (org?.settings as Record<string, unknown>) || {}

    await supabase
      .from('organizations')
      .update({
        settings: {
          ...currentSettings,
          calendly_connected: true,
          calendly_user_uri: calendlyUser.uri,
          calendly_default_event_type: defaultEventType?.scheduling_url || null,
          booking_link: defaultEventType?.scheduling_url || currentSettings.booking_link || null,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', stateData.orgId)

    return NextResponse.redirect(
      new URL('/dashboard/integrations?connected=calendly', request.url)
    )
  } catch (err) {
    console.error('Calendly OAuth callback error:', err)
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=calendly_oauth_failed', request.url)
    )
  }
}
