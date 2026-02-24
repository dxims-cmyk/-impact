// lib/integrations/google-ads.ts

const GOOGLE_API_VERSION = 'v16'
const GOOGLE_ADS_BASE_URL = `https://googleads.googleapis.com/${GOOGLE_API_VERSION}`

// Safe JSON parser — avoids "Unexpected token '<'" crash when API returns HTML
async function safeJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`API returned non-JSON (HTTP ${response.status}): ${text.slice(0, 200)}`)
  }
}

export interface GoogleTokens {
  access_token: string
  refresh_token: string
  expires_at?: Date
}

export interface GoogleAdAccount {
  id: string
  descriptiveName: string
  currencyCode: string
  timeZone: string
}

export interface GoogleCampaign {
  id: string
  name: string
  status: string
  advertisingChannelType: string
  campaignBudget: {
    amountMicros: string
  }
}

export interface GoogleInsights {
  campaign_id: string
  impressions: number
  clicks: number
  costMicros: number
  conversions: number
}

// Generate OAuth URL
export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`,
    scope: 'https://www.googleapis.com/auth/adwords',
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

// Exchange code for tokens
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`,
      grant_type: 'authorization_code',
      code,
    }),
  })

  const data = await safeJson(response)

  if (!response.ok) {
    throw new Error(`Failed to exchange code: ${(data as any).error_description || (data as any).error || response.status}`)
  }

  return {
    access_token: data.access_token as string,
    refresh_token: data.refresh_token as string,
    expires_at: data.expires_in
      ? new Date(Date.now() + (data.expires_in as number) * 1000)
      : undefined,
  }
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  const data = await safeJson(response)

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${(data as any).error_description || (data as any).error || response.status}`)
  }

  return {
    access_token: data.access_token as string,
    refresh_token: refreshToken, // Refresh token doesn't change
    expires_at: data.expires_in
      ? new Date(Date.now() + (data.expires_in as number) * 1000)
      : undefined,
  }
}

// Get accessible customer IDs (ad accounts)
export async function getAccessibleCustomers(accessToken: string): Promise<string[]> {
  const response = await fetch(
    `${GOOGLE_ADS_BASE_URL}/customers:listAccessibleCustomers`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      },
    }
  )

  const data = await safeJson(response)

  if (!response.ok) {
    throw new Error(`Failed to get customers: ${JSON.stringify(data)}`)
  }

  return ((data.resourceNames as string[]) || []).map((name: string) => name.split('/')[1])
}

// Get customer details
export async function getCustomerDetails(
  accessToken: string,
  customerId: string
): Promise<GoogleAdAccount | null> {
  const query = `
    SELECT
      customer.id,
      customer.descriptive_name,
      customer.currency_code,
      customer.time_zone
    FROM customer
    LIMIT 1
  `

  const response = await fetch(
    `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  )

  if (!response.ok) {
    return null
  }

  const data = await safeJson(response)
  const result = (data.results as any[])?.[0]

  if (!result) return null

  return {
    id: result.customer.id,
    descriptiveName: result.customer.descriptiveName,
    currencyCode: result.customer.currencyCode,
    timeZone: result.customer.timeZone,
  }
}

// Get campaigns
export async function getCampaigns(
  accessToken: string,
  customerId: string
): Promise<GoogleCampaign[]> {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign_budget.amount_micros
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    ORDER BY campaign.name
  `

  const response = await fetch(
    `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to get campaigns: ${JSON.stringify(error)}`)
  }

  const data = await response.json()

  return (data.results || []).map((r: Record<string, unknown>) => ({
    id: (r.campaign as Record<string, unknown>).id,
    name: (r.campaign as Record<string, unknown>).name,
    status: (r.campaign as Record<string, unknown>).status,
    advertisingChannelType: (r.campaign as Record<string, unknown>).advertisingChannelType,
    campaignBudget: r.campaignBudget,
  }))
}

// Get campaign performance
export async function getCampaignPerformance(
  accessToken: string,
  customerId: string,
  dateRange: { since: string; until: string }
): Promise<GoogleInsights[]> {
  const query = `
    SELECT
      campaign.id,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM campaign
    WHERE segments.date BETWEEN '${dateRange.since}' AND '${dateRange.until}'
    AND campaign.status != 'REMOVED'
  `

  const response = await fetch(
    `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to get performance: ${JSON.stringify(error)}`)
  }

  const data = await response.json()

  return (data.results || []).map((r: Record<string, unknown>) => ({
    campaign_id: (r.campaign as Record<string, unknown>).id as string,
    impressions: parseInt((r.metrics as Record<string, unknown>).impressions as string || '0'),
    clicks: parseInt((r.metrics as Record<string, unknown>).clicks as string || '0'),
    costMicros: parseInt((r.metrics as Record<string, unknown>).costMicros as string || '0'),
    conversions: parseFloat((r.metrics as Record<string, unknown>).conversions as string || '0'),
  }))
}

// Sync Google Ads data
export async function syncGoogleAdsData(
  accessToken: string,
  customerId: string,
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
  const campaigns = await getCampaigns(accessToken, customerId)

  // Get performance
  const performance = await getCampaignPerformance(accessToken, customerId, dateRange)

  for (const campaign of campaigns) {
    // Upsert campaign
    await db
      .from('ad_campaigns')
      .upsert({
        organization_id: organizationId,
        integration_id: integrationId,
        platform: 'google',
        external_id: campaign.id,
        name: campaign.name,
        status: campaign.status.toLowerCase(),
        objective: campaign.advertisingChannelType,
        budget_daily: campaign.campaignBudget?.amountMicros
          ? parseInt(campaign.campaignBudget.amountMicros) / 1000000
          : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'integration_id,external_id',
      })

    // Get performance for this campaign
    const perf = performance.find(p => p.campaign_id === campaign.id)

    if (perf) {
      // Get our campaign ID
      const { data: dbCampaign } = await db
        .from('ad_campaigns')
        .select('id')
        .eq('integration_id', integrationId)
        .eq('external_id', campaign.id)
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
            spend: perf.costMicros / 1000000,
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
