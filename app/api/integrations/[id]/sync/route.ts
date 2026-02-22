// app/api/integrations/[id]/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncMetaAdsData } from '@/lib/integrations/meta-ads'

// POST /api/integrations/[id]/sync - Manual sync
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get integration
  const { data: integration, error: intError } = await supabase
    .from('integrations')
    .select('*')
    .eq('id', id)
    .single()

  if (intError || !integration) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
  }

  if (integration.status !== 'connected') {
    return NextResponse.json({ error: 'Integration not connected' }, { status: 400 })
  }

  try {
    // Sync based on provider
    if (integration.provider === 'meta_ads') {
      await syncMetaAdsData(
        integration.access_token!,
        integration.account_id!,
        integration.organization_id,
        integration.id,
        supabase
      )
    } else if (integration.provider === 'google_ads') {
      // TODO: Implement Google Ads sync
      return NextResponse.json({ error: 'Google Ads sync not yet implemented' }, { status: 501 })
    } else if (integration.provider === 'tiktok_ads') {
      // TODO: Implement TikTok Ads sync
      return NextResponse.json({ error: 'TikTok Ads sync not yet implemented' }, { status: 501 })
    }

    // Update last sync time
    await supabase
      .from('integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_error: null,
      })
      .eq('id', id)

    return NextResponse.json({ success: true, synced_at: new Date().toISOString() })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Sync failed'

    // Update sync error
    await supabase
      .from('integrations')
      .update({
        sync_error: errorMessage,
        status: 'error',
      })
      .eq('id', id)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
