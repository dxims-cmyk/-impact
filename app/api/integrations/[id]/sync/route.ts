// app/api/integrations/[id]/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncMetaAdsData } from '@/lib/integrations/meta-ads'
import { syncGoogleAdsData } from '@/lib/integrations/google-ads'
import { syncTikTokAdsData } from '@/lib/integrations/tiktok-ads'

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
      await syncGoogleAdsData(
        integration.access_token!,
        integration.account_id!,
        integration.organization_id,
        integration.id,
        supabase
      )
    } else if (integration.provider === 'tiktok_ads') {
      await syncTikTokAdsData(
        integration.access_token!,
        integration.account_id!,
        integration.organization_id,
        integration.id,
        supabase
      )
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
