// app/api/integrations/tiktok/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens, getAdvertiserInfo } from '@/lib/integrations/tiktok-ads'

// GET /api/integrations/tiktok/callback
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  const code = searchParams.get('auth_code')
  const state = searchParams.get('state')

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

  // Check state is not too old
  if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=state_expired', request.url)
    )
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    if (!tokens.advertiser_ids || tokens.advertiser_ids.length === 0) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=no_ad_accounts', request.url)
      )
    }

    // Get details for first advertiser
    const primaryAdvertiser = await getAdvertiserInfo(
      tokens.access_token,
      tokens.advertiser_ids[0]
    )

    if (!primaryAdvertiser) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=account_access_denied', request.url)
      )
    }

    // Check if integration already exists
    const { data: existing } = await supabase
      .from('integrations')
      .select('id')
      .eq('organization_id', stateData.orgId)
      .eq('provider', 'tiktok_ads')
      .single()

    if (existing) {
      await supabase
        .from('integrations')
        .update({
          status: 'connected',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: tokens.expires_at?.toISOString(),
          account_id: primaryAdvertiser.advertiser_id,
          account_name: primaryAdvertiser.advertiser_name,
          metadata: {
            currency: primaryAdvertiser.currency,
            timezone: primaryAdvertiser.timezone,
            all_accounts: tokens.advertiser_ids,
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
          provider: 'tiktok_ads',
          status: 'connected',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: tokens.expires_at?.toISOString(),
          account_id: primaryAdvertiser.advertiser_id,
          account_name: primaryAdvertiser.advertiser_name,
          metadata: {
            currency: primaryAdvertiser.currency,
            timezone: primaryAdvertiser.timezone,
            all_accounts: tokens.advertiser_ids,
          },
        })
    }

    return NextResponse.redirect(
      new URL('/dashboard/integrations?success=tiktok_connected', request.url)
    )
  } catch (err) {
    console.error('TikTok OAuth error:', err)
    const message = err instanceof Error ? err.message : 'Connection failed'
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=${encodeURIComponent(message)}`, request.url)
    )
  }
}
