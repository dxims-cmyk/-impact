// lib/integrations/google-calendar.ts

const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'
const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export interface GoogleCalendarTokens {
  access_token: string
  refresh_token: string
  expires_at?: Date
}

export interface CalendarEventInput {
  summary: string
  description?: string
  startTime: string
  endTime: string
  attendees?: string[]
}

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  status: string
  htmlLink: string
  start: {
    dateTime: string
    timeZone?: string
  }
  end: {
    dateTime: string
    timeZone?: string
  }
  attendees?: Array<{
    email: string
    responseStatus: string
  }>
  created: string
  updated: string
}

export interface CalendarEventListResponse {
  items: CalendarEvent[]
  nextPageToken?: string
}

// Generate Google Calendar OAuth URL
export function getGoogleCalendarAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: 'https://www.googleapis.com/auth/calendar.events',
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
  })

  return `${GOOGLE_OAUTH_URL}?${params}`
}

// Exchange authorization code for tokens
export async function exchangeGoogleCalendarCode(
  code: string,
  redirectUri: string
): Promise<GoogleCalendarTokens> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `Failed to exchange code: ${error.error_description || error.error}`
    )
  }

  const data = await response.json()

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined,
  }
}

// Refresh an expired access token using the refresh token
export async function refreshGoogleCalendarToken(
  refreshToken: string
): Promise<GoogleCalendarTokens> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `Failed to refresh token: ${error.error_description || error.error}`
    )
  }

  const data = await response.json()

  return {
    access_token: data.access_token,
    refresh_token: refreshToken, // Refresh token does not change on refresh
    expires_at: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined,
  }
}

// Create a new event on the user's primary Google Calendar
export async function createCalendarEvent(
  accessToken: string,
  event: CalendarEventInput
): Promise<CalendarEvent> {
  const body: Record<string, unknown> = {
    summary: event.summary,
    start: {
      dateTime: event.startTime,
    },
    end: {
      dateTime: event.endTime,
    },
  }

  if (event.description) {
    body.description = event.description
  }

  if (event.attendees && event.attendees.length > 0) {
    body.attendees = event.attendees.map((email) => ({ email }))
  }

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `Failed to create calendar event: ${error.error?.message || JSON.stringify(error)}`
    )
  }

  const data = await response.json()

  return {
    id: data.id,
    summary: data.summary,
    description: data.description,
    status: data.status,
    htmlLink: data.htmlLink,
    start: data.start,
    end: data.end,
    attendees: data.attendees,
    created: data.created,
    updated: data.updated,
  }
}

// List events from the user's primary Google Calendar within a time range
export async function listCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `Failed to list calendar events: ${error.error?.message || JSON.stringify(error)}`
    )
  }

  const data: CalendarEventListResponse = await response.json()

  return (data.items || []).map((item) => ({
    id: item.id,
    summary: item.summary,
    description: item.description,
    status: item.status,
    htmlLink: item.htmlLink,
    start: item.start,
    end: item.end,
    attendees: item.attendees,
    created: item.created,
    updated: item.updated,
  }))
}
