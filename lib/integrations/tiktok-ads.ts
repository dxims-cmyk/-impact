// lib/integrations/tiktok-ads.ts

const TIKTOK_API_VERSION = 'v1.3'
const TIKTOK_BASE_URL = `https://business-api.tiktok.com/open_api/${TIKTOK_API_VERSION}`

export interface TikTokTokens {
  access_token: string
  refresh_token?: string
  expires_at?: Date
}

export interface TikTokAdAccount {
  advertiser_id: string
  advertiser_name: string
  currency: string
  timezone: string
}

export interface TikTokCampaign {
  campaign_id: string
  campaign_name: string
  campaign_status: string
  objective_type: string
  budget: number
  budget_mode: string
}

export interface TikTokInsights {
  campaign_id: string
  impressions: number
  clicks: number
  spend: number
  conversions: number
}

// Generate OAuth URL
export function getTikTokAuthUrl(state: string): string {
  const params = new URLSearchParams({
    app_id: process.env.TIKTOK_APP_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/tiktok/callback`,
    state,
    scope: 'advertiser.read,campaign.read,report.read',
  })

  return `https://ads.tiktok.com/marketing_api/auth?${params}`
}

// Exchange code for tokens
export async function exchangeCodeForTokens(code: string): Promise<TikTokTokens & { advertiser_ids: string[] }> {
  const response = await fetch(`${TIKTOK_BASE_URL}/oauth2/access_token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: process.env.TIKTOK_APP_ID,
      secret: process.env.TIKTOK_APP_SECRET,
      auth_code: code,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to exchange code: ${error.message}`)
  }

  const data = await response.json()

  if (data.code !== 0) {
    throw new Error(`TikTok API error: ${data.message}`)
  }

  return {
    access_token: data.data.access_token,
    refresh_token: data.data.refresh_token,
    expires_at: new Date(Date.now() + data.data.expires_in * 1000),
    advertiser_ids: data.data.advertiser_ids || [],
  }
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<TikTokTokens> {
  const response = await fetch(`${TIKTOK_BASE_URL}/oauth2/refresh_token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: process.env.TIKTOK_APP_ID,
      secret: process.env.TIKTOK_APP_SECRET,
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to refresh token: ${error.message}`)
  }

  const data = await response.json()

  if (data.code !== 0) {
    throw new Error(`TikTok API error: ${data.message}`)
  }

  return {
    access_token: data.data.access_token,
    refresh_token: data.data.refresh_token,
    expires_at: new Date(Date.now() + data.data.expires_in * 1000),
  }
}

// Get advertiser info
export async function getAdvertiserInfo(
  accessToken: string,
  advertiserId: string
): Promise<TikTokAdAccount | null> {
  const params = new URLSearchParams({
    advertiser_ids: JSON.stringify([advertiserId]),
  })

  const response = await fetch(`${TIKTOK_BASE_URL}/advertiser/info/?${params}`, {
    headers: {
      'Access-Token': accessToken,
    },
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()

  if (data.code !== 0 || !data.data?.list?.[0]) {
    return null
  }

  const info = data.data.list[0]

  return {
    advertiser_id: info.advertiser_id,
    advertiser_name: info.advertiser_name,
    currency: info.currency,
    timezone: info.timezone,
  }
}

// Get campaigns
export async function getCampaigns(
  accessToken: string,
  advertiserId: string
): Promise<TikTokCampaign[]> {
  const params = new URLSearchParams({
    advertiser_id: advertiserId,
    page_size: '100',
  })

  const response = await fetch(`${TIKTOK_BASE_URL}/campaign/get/?${params}`, {
    headers: {
      'Access-Token': accessToken,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to get campaigns: ${error.message}`)
  }

  const data = await response.json()

  if (data.code !== 0) {
    throw new Error(`TikTok API error: ${data.message}`)
  }

  return (data.data?.list || []).map((c: Record<string, unknown>) => ({
    campaign_id: c.campaign_id,
    campaign_name: c.campaign_name,
    campaign_status: c.secondary_status || c.operation_status,
    objective_type: c.objective_type,
    budget: c.budget,
    budget_mode: c.budget_mode,
  }))
}

// Get campaign performance
export async function getCampaignPerformance(
  accessToken: string,
  advertiserId: string,
  dateRange: { since: string; until: string }
): Promise<TikTokInsights[]> {
  const response = await fetch(`${TIKTOK_BASE_URL}/report/integrated/get/`, {
    method: 'POST',
    headers: {
      'Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      advertiser_id: advertiserId,
      report_type: 'BASIC',
      dimensions: ['campaign_id'],
      metrics: ['impressions', 'clicks', 'spend', 'conversion'],
      start_date: dateRange.since,
      end_date: dateRange.until,
      page_size: 100,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to get performance: ${error.message}`)
  }

  const data = await response.json()

  if (data.code !== 0) {
    throw new Error(`TikTok API error: ${data.message}`)
  }

  return (data.data?.list || []).map((r: Record<string, unknown>) => ({
    campaign_id: (r.dimensions as Record<string, unknown>).campaign_id as string,
    impressions: parseInt((r.metrics as Record<string, unknown>).impressions as string || '0'),
    clicks: parseInt((r.metrics as Record<string, unknown>).clicks as string || '0'),
    spend: parseFloat((r.metrics as Record<string, unknown>).spend as string || '0'),
    conversions: parseInt((r.metrics as Record<string, unknown>).conversion as string || '0'),
  }))
}

// Sync TikTok Ads data
export async function syncTikTokAdsData(
  accessToken: string,
  advertiserId: string,
  organizationId: string,
  integrationId: string,
  supabase: unknown
) {
  const db = supabase as {
    from: (table: string) => {
      upsert: (data: Record<string, unknown>, options?: Record<string, unknown>) => Promise<{ error?: Error }>
      select: (fields: string) => { eq: (field: string, value: string) => { eq: (field: string, value: string) => { single: () => Promise<{ data: Record<string, unknown> | null }> } } }
      update: (data: Record<string, unknown>) => { eq: (field: string, value: string) => Promise<{ error?: Error }> }
    }
  }

  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const dateRange = {
    since: sevenDaysAgo.toISOString().split('T')[0],
    until: today.toISOString().split('T')[0],
  }

  // Get campaigns
  const campaigns = await getCampaigns(accessToken, advertiserId)

  // Get performance
  const performance = await getCampaignPerformance(accessToken, advertiserId, dateRange)

  for (const campaign of campaigns) {
    // Upsert campaign
    await db
      .from('ad_campaigns')
      .upsert({
        organization_id: organizationId,
        integration_id: integrationId,
        platform: 'tiktok',
        external_id: campaign.campaign_id,
        name: campaign.campaign_name,
        status: campaign.campaign_status?.toLowerCase() || 'unknown',
        objective: campaign.objective_type,
        budget_daily: campaign.budget_mode === 'BUDGET_MODE_DAY' ? campaign.budget : null,
        budget_lifetime: campaign.budget_mode === 'BUDGET_MODE_TOTAL' ? campaign.budget : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'integration_id,external_id',
      })

    // Get performance for this campaign
    const perf = performance.find(p => p.campaign_id === campaign.campaign_id)

    if (perf) {
      // Get our campaign ID
      const { data: dbCampaign } = await db
        .from('ad_campaigns')
        .select('id')
        .eq('integration_id', integrationId)
        .eq('external_id', campaign.campaign_id)
        .single()

      if (dbCampaign) {
        await db
          .from('ad_performance')
          .upsert({
            organization_id: organizationId,
            campaign_id: dbCampaign.id,
            date: today.toISOString().split('T')[0],
            impressions: perf.impressions,
            clicks: perf.clicks,
            spend: perf.spend,
            conversions: perf.conversions,
          }, {
            onConflict: 'campaign_id,date',
          })
      }
    }
  }

  // Update last sync time
  await db
    .from('integrations')
    .update({
      last_sync_at: new Date().toISOString(),
      sync_error: null,
      status: 'connected',
    })
    .eq('id', integrationId)
}
