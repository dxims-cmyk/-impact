// app/api/integrations/stripe/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCode } from '@/lib/integrations/stripe'
import { encryptTokens } from '@/lib/encryption'

// GET /api/integrations/stripe/callback - Handle Stripe Connect OAuth callback
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle errors from Stripe
  if (error) {
    console.error('Stripe Connect OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=${encodeURIComponent(errorDescription || error)}`, request.url)
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

  // Check state is not too old (15 minutes)
  if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=state_expired', request.url)
    )
  }

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
    // Exchange code for Stripe Connect tokens
    const tokens = await exchangeCode(code)

    // Check if integration already exists
    const { data: existing } = await supabase
      .from('integrations')
      .select('id')
      .eq('organization_id', stateData.orgId)
      .eq('provider', 'stripe')
      .single()

    const encrypted = encryptTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    })

    if (existing) {
      // Update existing integration
      await supabase
        .from('integrations')
        .update({
          status: 'connected',
          access_token: encrypted.access_token,
          account_id: tokens.stripe_user_id,
          account_name: `Stripe (${tokens.stripe_user_id})`,
          metadata: {
            refresh_token: encrypted.refresh_token,
            scope: tokens.scope,
          },
          sync_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      // Create new integration
      await supabase
        .from('integrations')
        .insert({
          organization_id: stateData.orgId,
          provider: 'stripe',
          status: 'connected',
          access_token: encrypted.access_token,
          account_id: tokens.stripe_user_id,
          account_name: `Stripe (${tokens.stripe_user_id})`,
          metadata: {
            refresh_token: encrypted.refresh_token,
            scope: tokens.scope,
          },
        })
    }

    // Update organization settings for quick Stripe lookups
    // Read current settings first, then merge to avoid overwriting other keys
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
          stripe_connected: true,
          stripe_account_id: tokens.stripe_user_id,
        },
      })
      .eq('id', stateData.orgId)

    return NextResponse.redirect(
      new URL('/dashboard/integrations?success=stripe_connected', request.url)
    )
  } catch (err) {
    console.error('Stripe Connect OAuth error:', err)
    const message = err instanceof Error ? err.message : 'Connection failed'
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=${encodeURIComponent(message)}`, request.url)
    )
  }
}
