// lib/integrations/calendly.ts
// Calendly API helper functions

const CALENDLY_AUTH_BASE = 'https://auth.calendly.com'
const CALENDLY_API_BASE = 'https://api.calendly.com'

// --- Types ---

export interface CalendlyTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  owner: string
  organization: string
}

export interface CalendlyRefreshResult {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface CalendlyUser {
  uri: string
  name: string
  email: string
  scheduling_url: string
}

export interface CalendlyEventType {
  uri: string
  name: string
  slug: string
  duration: number
  scheduling_url: string
}

export interface CalendlyWebhookSubscription {
  uri: string
}

// --- Auth URL ---

export function getCalendlyAuthUrl(orgId: string): string {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/calendly/callback`

  const statePayload = Buffer.from(JSON.stringify({
    orgId,
    timestamp: Date.now(),
  })).toString('base64')

  const params = new URLSearchParams({
    client_id: process.env.CALENDLY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: redirectUri,
    state: statePayload,
  })

  return `${CALENDLY_AUTH_BASE}/oauth/authorize?${params}`
}

// --- Token Exchange ---

export async function exchangeCalendlyCode(code: string): Promise<CalendlyTokens> {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/calendly/callback`

  const response = await fetch(`${CALENDLY_AUTH_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: process.env.CALENDLY_CLIENT_ID!,
      client_secret: process.env.CALENDLY_CLIENT_SECRET!,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Calendly token exchange failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type,
    expires_in: data.expires_in,
    owner: data.owner,
    organization: data.organization,
  }
}

// --- Token Refresh ---

export async function refreshCalendlyToken(refreshToken: string): Promise<CalendlyRefreshResult> {
  const response = await fetch(`${CALENDLY_AUTH_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.CALENDLY_CLIENT_ID!,
      client_secret: process.env.CALENDLY_CLIENT_SECRET!,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Calendly token refresh failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  }
}

// --- Current User ---

export async function getCurrentUser(accessToken: string): Promise<CalendlyUser> {
  const response = await fetch(`${CALENDLY_API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Calendly get current user failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  const resource = data.resource

  return {
    uri: resource.uri,
    name: resource.name,
    email: resource.email,
    scheduling_url: resource.scheduling_url,
  }
}

// --- Event Types ---

export async function getEventTypes(
  accessToken: string,
  userUri: string
): Promise<CalendlyEventType[]> {
  const params = new URLSearchParams({ user: userUri, active: 'true' })

  const response = await fetch(`${CALENDLY_API_BASE}/event_types?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Calendly get event types failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  return (data.collection || []).map((et: Record<string, unknown>) => ({
    uri: et.uri as string,
    name: et.name as string,
    slug: et.slug as string,
    duration: et.duration as number,
    scheduling_url: et.scheduling_url as string,
  }))
}

// --- Webhook Subscription ---

export async function createWebhookSubscription(
  accessToken: string,
  orgUri: string,
  callbackUrl: string
): Promise<CalendlyWebhookSubscription> {
  const response = await fetch(`${CALENDLY_API_BASE}/webhook_subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: callbackUrl,
      events: ['invitee.created', 'invitee.canceled'],
      organization: orgUri,
      scope: 'organization',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Calendly create webhook failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  return {
    uri: data.resource.uri,
  }
}

// --- Scheduling Link ---

export function getSchedulingLink(schedulingUrl: string): string {
  return schedulingUrl
}
