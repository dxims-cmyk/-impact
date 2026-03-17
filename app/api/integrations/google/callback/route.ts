// app/api/integrations/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  exchangeCodeForTokens,
  getAccessibleCustomers,
  getCustomerDetails,
} from '@/lib/integrations/google-ads'
import { encryptTokens } from '@/lib/encryption'

// GET /api/integrations/google/callback
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=missing_params', request.url)
    )
  }

  // Verify user is authenticated before processing callback
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.redirect(
      new URL('/login?error=session_expired', request.url)
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

  // Check state is not too old
  if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=state_expired', request.url)
    )
  }

  // Verify user belongs to the org in state (prevents CSRF org hijacking)
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData || userData.organization_id !== stateData.orgId) {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=org_mismatch', request.url)
    )
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Get accessible customers (ad accounts)
    const customerIds = await getAccessibleCustomers(tokens.access_token)

    if (!customerIds || customerIds.length === 0) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=no_ad_accounts', request.url)
      )
    }

    // Get details for first customer
    const primaryCustomer = await getCustomerDetails(tokens.access_token, customerIds[0])

    if (!primaryCustomer) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=account_access_denied', request.url)
      )
    }

    // Check if integration already exists
    const { data: existing } = await supabase
      .from('integrations')
      .select('id')
      .eq('organization_id', stateData.orgId)
      .eq('provider', 'google_ads')
      .single()

    // Encrypt tokens before storing
    const encrypted = encryptTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    })

    if (existing) {
      await supabase
        .from('integrations')
        .update({
          status: 'connected',
          access_token: encrypted.access_token,
          refresh_token: encrypted.refresh_token,
          token_expires_at: tokens.expires_at?.toISOString(),
          account_id: primaryCustomer.id,
          account_name: primaryCustomer.descriptiveName,
          metadata: {
            currency: primaryCustomer.currencyCode,
            timezone: primaryCustomer.timeZone,
            all_accounts: customerIds,
          },
          sync_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('integrations')
        .insert({
          organization_id: stateData.orgId,
          provider: 'google_ads',
          status: 'connected',
          access_token: encrypted.access_token,
          refresh_token: encrypted.refresh_token,
          token_expires_at: tokens.expires_at?.toISOString(),
          account_id: primaryCustomer.id,
          account_name: primaryCustomer.descriptiveName,
          metadata: {
            currency: primaryCustomer.currencyCode,
            timezone: primaryCustomer.timeZone,
            all_accounts: customerIds,
          },
        })
    }

    return NextResponse.redirect(
      new URL('/dashboard/integrations?success=google_connected', request.url)
    )
  } catch (err) {
    console.error('Google OAuth error:', err)
    const message = err instanceof Error ? err.message : 'Connection failed'
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=${encodeURIComponent(message)}`, request.url)
    )
  }
}
