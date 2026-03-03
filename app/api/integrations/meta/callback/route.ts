// app/api/integrations/meta/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens, getLongLivedToken, getAdAccounts, getPages, subscribePageToLeadgen } from '@/lib/integrations/meta-ads'
import { encryptTokens } from '@/lib/encryption'

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

  // Verify user is authenticated before processing callback
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.redirect(
      new URL('/login?error=session_expired', request.url)
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

  // Verify user belongs to the org in state (prevents CSRF org hijacking)
  const { data: userData } = await supabase
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

    // Get long-lived token
    const longLivedTokens = await getLongLivedToken(tokens.access_token)

    // Get ad accounts and Facebook Pages in parallel
    const [adAccounts, pages] = await Promise.all([
      getAdAccounts(longLivedTokens.access_token),
      getPages(longLivedTokens.access_token),
    ])

    if (!adAccounts || adAccounts.length === 0) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=no_ad_accounts', request.url)
      )
    }

    // Use first ad account (could add UI to select)
    const primaryAccount = adAccounts[0]

    // Build metadata with page_id for leadgen webhook routing
    const metadata: Record<string, unknown> = {
      currency: primaryAccount.currency,
      timezone: primaryAccount.timezone_name,
      all_accounts: adAccounts.map(a => ({ id: a.id, name: a.name })),
    }

    // Store page IDs — the leadgen webhook uses metadata.page_id to route leads to the correct org
    if (pages.length === 1) {
      metadata.page_id = pages[0].id
      metadata.page_name = pages[0].name
    } else if (pages.length > 1) {
      // Store first page as primary + all pages for reference
      metadata.page_id = pages[0].id
      metadata.page_name = pages[0].name
      metadata.all_pages = pages.map(p => ({ id: p.id, name: p.name }))
    }

    // Auto-subscribe pages to leadgen webhook
    if (pages.length > 0) {
      const subscribeResults = await Promise.all(
        pages.filter(p => p.access_token).map(async (page) => {
          const ok = await subscribePageToLeadgen(page.id, page.access_token!)
          return { id: page.id, name: page.name, subscribed: ok }
        })
      )
      const subscribedPages = subscribeResults.filter(r => r.subscribed)
      if (subscribedPages.length > 0) {
        metadata.leadgen_subscribed = true
        metadata.leadgen_subscribed_at = new Date().toISOString()
        metadata.leadgen_subscribed_pages = subscribedPages.map(p => p.id)
      }
    }

    // Check if integration already exists
    const { data: existing } = await supabase
      .from('integrations')
      .select('id')
      .eq('organization_id', stateData.orgId)
      .eq('provider', 'meta_ads')
      .single()

    // Encrypt token before storing
    const encrypted = encryptTokens({ access_token: longLivedTokens.access_token })

    if (existing) {
      // Update existing
      await supabase
        .from('integrations')
        .update({
          status: 'connected',
          access_token: encrypted.access_token,
          token_expires_at: longLivedTokens.expires_at?.toISOString(),
          account_id: primaryAccount.id,
          account_name: primaryAccount.name,
          metadata,
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
          access_token: encrypted.access_token,
          token_expires_at: longLivedTokens.expires_at?.toISOString(),
          account_id: primaryAccount.id,
          account_name: primaryAccount.name,
          metadata,
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
