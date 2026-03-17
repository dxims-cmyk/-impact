// app/api/integrations/meta/subscribe-leadgen/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { decryptTokens } from '@/lib/encryption'
import { getPages, subscribePageToLeadgen } from '@/lib/integrations/meta-ads'

// POST /api/integrations/meta/subscribe-leadgen - Manually subscribe pages to leadgen webhook
export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Get Meta integration for this org
  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('organization_id', userData.organization_id)
    .eq('provider', 'meta_ads')
    .eq('status', 'connected')
    .single()

  if (!integration) {
    return NextResponse.json({ error: 'Meta Ads not connected' }, { status: 404 })
  }

  try {
    // Decrypt the stored access token
    const { access_token } = decryptTokens({ access_token: integration.access_token })

    // Fetch current pages with their page access tokens
    const pages = await getPages(access_token)

    if (pages.length === 0) {
      return NextResponse.json({ error: 'No Facebook pages found for this account' }, { status: 404 })
    }

    // Subscribe all pages to leadgen
    const results = await Promise.all(
      pages.filter(p => p.access_token).map(async (page) => {
        const ok = await subscribePageToLeadgen(page.id, page.access_token!)
        return { id: page.id, name: page.name, subscribed: ok }
      })
    )

    const subscribedPages = results.filter(r => r.subscribed)

    // Update integration metadata
    const metadata = (integration.metadata || {}) as Record<string, unknown>
    if (subscribedPages.length > 0) {
      metadata.leadgen_subscribed = true
      metadata.leadgen_subscribed_at = new Date().toISOString()
      metadata.leadgen_subscribed_pages = subscribedPages.map(p => p.id)
    }

    // Also ensure page_id is stored if missing
    if (!metadata.page_id && pages.length > 0) {
      metadata.page_id = pages[0].id
      metadata.page_name = pages[0].name
      if (pages.length > 1) {
        metadata.all_pages = pages.map(p => ({ id: p.id, name: p.name }))
      }
    }

    await supabase
      .from('integrations')
      .update({ metadata, updated_at: new Date().toISOString() })
      .eq('id', integration.id)

    return NextResponse.json({
      subscribed: subscribedPages.length,
      total: pages.length,
      pages: results,
    })
  } catch (err) {
    console.error('[subscribe-leadgen] Error:', err)
    return NextResponse.json(
      { error: 'Failed to subscribe to lead ads' },
      { status: 500 }
    )
  }
}
