// app/api/integrations/[id]/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { syncMetaAdsData, getLongLivedToken } from '@/lib/integrations/meta-ads'
import { syncGoogleAdsData } from '@/lib/integrations/google-ads'
import { syncTikTokAdsData } from '@/lib/integrations/tiktok-ads'
import { decryptTokens, encryptTokens } from '@/lib/encryption'

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

  // Get user's org
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Get integration — scoped to user's org
  const { data: integration, error: intError } = await supabase
    .from('integrations')
    .select('*')
    .eq('id', id)
    .eq('organization_id', userData.organization_id)
    .single()

  if (intError || !integration) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
  }

  if (integration.status === 'disconnected') {
    return NextResponse.json({ error: 'Integration not connected' }, { status: 400 })
  }

  try {
    // Decrypt token from DB
    let accessToken: string
    const rawToken = integration.access_token!
    // Encrypted tokens are base64-encoded (long, no dots). Real Meta tokens start with "EA" and contain dots/alphanumeric.
    const looksEncrypted = rawToken.length > 200 && !rawToken.startsWith('EA')
    if (looksEncrypted) {
      const decrypted = decryptTokens({ access_token: rawToken })
      accessToken = decrypted.access_token
    } else {
      // Pre-encryption plaintext token
      accessToken = rawToken
    }

    // Refresh Meta token if expiring within 7 days
    if (integration.provider === 'meta_ads' && integration.token_expires_at) {
      const expiresAt = new Date(integration.token_expires_at)
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      if (expiresAt.getTime() - Date.now() < sevenDays) {
        try {
          const newTokens = await getLongLivedToken(accessToken)
          accessToken = newTokens.access_token
          const encrypted = encryptTokens({ access_token: accessToken })
          await supabase
            .from('integrations')
            .update({
              access_token: encrypted.access_token,
              token_expires_at: newTokens.expires_at?.toISOString()
            })
            .eq('id', id)
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          // Continue with existing token — it may still work
        }
      }
    }

    // Sync based on provider
    if (integration.provider === 'meta_ads') {
      await syncMetaAdsData(
        accessToken,
        integration.account_id!,
        integration.organization_id,
        integration.id,
        supabase
      )
    } else if (integration.provider === 'google_ads') {
      await syncGoogleAdsData(
        accessToken,
        integration.account_id!,
        integration.organization_id,
        integration.id,
        supabase
      )
    } else if (integration.provider === 'tiktok_ads') {
      await syncTikTokAdsData(
        accessToken,
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
