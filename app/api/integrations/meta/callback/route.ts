// app/api/integrations/meta/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens, getLongLivedToken, getAdAccounts } from '@/lib/integrations/meta-ads'

// GET /api/integrations/meta/callback - Handle Meta OAuth callback
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle errors from Meta
  if (error) {
    console.error('Meta OAuth error:', error, errorDescription)
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

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Get long-lived token
    const longLivedTokens = await getLongLivedToken(tokens.access_token)

    // Get ad accounts
    const adAccounts = await getAdAccounts(longLivedTokens.access_token)

    if (!adAccounts || adAccounts.length === 0) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=no_ad_accounts', request.url)
      )
    }

    // Use first ad account (could add UI to select)
    const primaryAccount = adAccounts[0]

    // Check if integration already exists
    const { data: existing } = await supabase
      .from('integrations')
      .select('id')
      .eq('organization_id', stateData.orgId)
      .eq('provider', 'meta_ads')
      .single()

    if (existing) {
      // Update existing
      await supabase
        .from('integrations')
        .update({
          status: 'connected',
          access_token: longLivedTokens.access_token,
          token_expires_at: longLivedTokens.expires_at?.toISOString(),
          account_id: primaryAccount.id,
          account_name: primaryAccount.name,
          metadata: {
            currency: primaryAccount.currency,
            timezone: primaryAccount.timezone_name,
            all_accounts: adAccounts.map(a => ({ id: a.id, name: a.name })),
          },
          sync_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      // Create new
      await supabase
        .from('integrations')
        .insert({
          organization_id: stateData.orgId,
          provider: 'meta_ads',
          status: 'connected',
          access_token: longLivedTokens.access_token,
          token_expires_at: longLivedTokens.expires_at?.toISOString(),
          account_id: primaryAccount.id,
          account_name: primaryAccount.name,
          metadata: {
            currency: primaryAccount.currency,
            timezone: primaryAccount.timezone_name,
            all_accounts: adAccounts.map(a => ({ id: a.id, name: a.name })),
          },
        })
    }

    return NextResponse.redirect(
      new URL('/dashboard/integrations?success=meta_connected', request.url)
    )
  } catch (err) {
    console.error('Meta OAuth error:', err)
    const message = err instanceof Error ? err.message : 'Connection failed'
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=${encodeURIComponent(message)}`, request.url)
    )
  }
}
