// lib/integrations/meta-ads.ts

const META_API_VERSION = 'v18.0'
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`

export interface MetaTokens {
  access_token: string
  refresh_token?: string
  expires_at?: Date
}

export interface MetaAdAccount {
  id: string
  name: string
  currency: string
  timezone_name: string
  account_status: number
}

export interface MetaCampaign {
  id: string
  name: string
  status: string
  objective: string
  daily_budget?: string
  lifetime_budget?: string
  created_time: string
}

export interface MetaInsights {
  campaign_id: string
  impressions: number
  clicks: number
  spend: number
  actions?: { action_type: string; value: string }[]
  ctr: number
  cpc: number
}

// Generate OAuth URL
export function getMetaAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/meta/callback`,
    scope: 'ads_read,ads_management,business_management,pages_read_engagement',
    response_type: 'code',
    state
  })

  return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params}`
}

// Exchange code for tokens
export async function exchangeCodeForTokens(code: string): Promise<MetaTokens> {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/meta/callback`,
    code
  })

  const response = await fetch(`${META_BASE_URL}/oauth/access_token?${params}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to exchange code: ${error.error?.message}`)
  }

  const data = await response.json()
  
  return {
    access_token: data.access_token,
    expires_at: data.expires_in 
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined
  }
}

// Get long-lived token
export async function getLongLivedToken(shortLivedToken: string): Promise<MetaTokens> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: shortLivedToken
  })

  const response = await fetch(`${META_BASE_URL}/oauth/access_token?${params}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to get long-lived token: ${error.error?.message}`)
  }

  const data = await response.json()
  
  return {
    access_token: data.access_token,
    expires_at: data.expires_in 
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined
  }
}

// Get ad accounts
export async function getAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
  const response = await fetch(
    `${META_BASE_URL}/me/adaccounts?fields=id,name,currency,timezone_name,account_status&access_token=${accessToken}`
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to fetch ad accounts: ${error.error?.message}`)
  }

  const data = await response.json()
  return data.data
}

// Get campaigns for an ad account
export async function getCampaigns(
  accessToken: string, 
  adAccountId: string,
  status?: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
): Promise<MetaCampaign[]> {
  const params = new URLSearchParams({
    fields: 'id,name,status,objective,daily_budget,lifetime_budget,created_time',
    access_token: accessToken,
    limit: '100'
  })

  if (status) {
    params.set('filtering', JSON.stringify([{ field: 'status', operator: 'EQUAL', value: status }]))
  }

  const response = await fetch(
    `${META_BASE_URL}/${adAccountId}/campaigns?${params}`
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to fetch campaigns: ${error.error?.message}`)
  }

  const data = await response.json()
  return data.data
}

// Get campaign insights
export async function getCampaignInsights(
  accessToken: string,
  campaignId: string,
  dateRange: { since: string; until: string }
): Promise<MetaInsights | null> {
  const params = new URLSearchParams({
    fields: 'impressions,clicks,spend,actions,ctr,cpc',
    time_range: JSON.stringify(dateRange),
    access_token: accessToken
  })

  const response = await fetch(
    `${META_BASE_URL}/${campaignId}/insights?${params}`
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to fetch insights: ${error.error?.message}`)
  }

  const data = await response.json()
  
  if (!data.data || data.data.length === 0) {
    return null
  }

  const insights = data.data[0]
  
  return {
    campaign_id: campaignId,
    impressions: parseInt(insights.impressions || '0'),
    clicks: parseInt(insights.clicks || '0'),
    spend: parseFloat(insights.spend || '0'),
    actions: insights.actions,
    ctr: parseFloat(insights.ctr || '0'),
    cpc: parseFloat(insights.cpc || '0')
  }
}

// Get account-level insights (aggregated)
export async function getAccountInsights(
  accessToken: string,
  adAccountId: string,
  dateRange: { since: string; until: string }
): Promise<{
  impressions: number
  clicks: number
  spend: number
  leads: number
  ctr: number
  cpc: number
  cpl: number
}> {
  const params = new URLSearchParams({
    fields: 'impressions,clicks,spend,actions,ctr,cpc',
    time_range: JSON.stringify(dateRange),
    access_token: accessToken
  })

  const response = await fetch(
    `${META_BASE_URL}/${adAccountId}/insights?${params}`
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to fetch account insights: ${error.error?.message}`)
  }

  const data = await response.json()
  
  if (!data.data || data.data.length === 0) {
    return {
      impressions: 0,
      clicks: 0,
      spend: 0,
      leads: 0,
      ctr: 0,
      cpc: 0,
      cpl: 0
    }
  }

  const insights = data.data[0]
  
  // Extract lead count from actions
  const leadAction = insights.actions?.find(
    (a: { action_type: string }) => 
      a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped'
  )
  const leads = leadAction ? parseInt(leadAction.value) : 0
  const spend = parseFloat(insights.spend || '0')

  return {
    impressions: parseInt(insights.impressions || '0'),
    clicks: parseInt(insights.clicks || '0'),
    spend,
    leads,
    ctr: parseFloat(insights.ctr || '0'),
    cpc: parseFloat(insights.cpc || '0'),
    cpl: leads > 0 ? spend / leads : 0
  }
}

// Fetch lead data from Meta Leadgen API
export interface MetaLeadgenData {
  id: string
  created_time: string
  field_data: { name: string; values: string[] }[]
  ad_id?: string
  adset_id?: string
  campaign_id?: string
  form_id?: string
}

export async function fetchLeadgenData(
  accessToken: string,
  leadgenId: string
): Promise<MetaLeadgenData> {
  const response = await fetch(
    `${META_BASE_URL}/${leadgenId}?access_token=${accessToken}`
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to fetch leadgen data: ${error.error?.message}`)
  }

  return response.json()
}

// Parse Meta leadgen field_data into a flat object
export function parseLeadgenFields(
  fieldData: { name: string; values: string[] }[]
): Record<string, string> {
  const parsed: Record<string, string> = {}
  for (const field of fieldData) {
    if (field.values && field.values.length > 0) {
      parsed[field.name] = field.values[0]
    }
  }
  return parsed
}

// Verify Meta webhook signature
export function verifyMetaSignature(
  payload: string,
  signature: string
): boolean {
  const crypto = require('crypto')
  const expectedSig = crypto
    .createHmac('sha256', process.env.META_APP_SECRET!)
    .update(payload)
    .digest('hex')
  return signature === `sha256=${expectedSig}`
}

// Sync all campaigns and insights for an integration
export async function syncMetaAdsData(
  accessToken: string,
  adAccountId: string,
  organizationId: string,
  integrationId: string,
  supabase: any // Supabase client
) {
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const dateRange = {
    since: sevenDaysAgo.toISOString().split('T')[0],
    until: today.toISOString().split('T')[0]
  }

  // Get campaigns
  const campaigns = await getCampaigns(accessToken, adAccountId, 'ACTIVE')

  for (const campaign of campaigns) {
    // Upsert campaign
    await supabase
      .from('ad_campaigns')
      .upsert({
        organization_id: organizationId,
        integration_id: integrationId,
        platform: 'meta',
        external_id: campaign.id,
        name: campaign.name,
        status: campaign.status.toLowerCase(),
        objective: campaign.objective,
        budget_daily: campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : null,
        budget_lifetime: campaign.lifetime_budget ? parseFloat(campaign.lifetime_budget) / 100 : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'integration_id,external_id'
      })

    // Get insights
    const insights = await getCampaignInsights(accessToken, campaign.id, dateRange)

    if (insights) {
      // Get our campaign ID
      const { data: dbCampaign } = await supabase
        .from('ad_campaigns')
        .select('id')
        .eq('integration_id', integrationId)
        .eq('external_id', campaign.id)
        .single()

      if (dbCampaign) {
        // Extract leads from actions
        const leadAction = insights.actions?.find(
          a => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped'
        )
        const leads = leadAction ? parseInt(leadAction.value) : 0

        // Upsert daily performance
        await supabase
          .from('ad_performance')
          .upsert({
            organization_id: organizationId,
            campaign_id: dbCampaign.id,
            date: today.toISOString().split('T')[0],
            impressions: insights.impressions,
            clicks: insights.clicks,
            spend: insights.spend,
            leads
          }, {
            onConflict: 'campaign_id,date'
          })
      }
    }
  }

  // Update last sync time
  await supabase
    .from('integrations')
    .update({ 
      last_sync_at: new Date().toISOString(),
      sync_error: null,
      status: 'connected'
    })
    .eq('id', integrationId)
}
