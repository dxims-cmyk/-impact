// lib/integrations/xero.ts
// Xero API helper functions — uses fetch() only (no xero npm package)

import { createAdminClient } from '@/lib/supabase/server'
import { decryptTokens, encryptTokens } from '@/lib/encryption'

// ── Constants ─────────────────────────────────────────────────────────

const XERO_AUTH_URL = 'https://login.xero.com/identity/connect/authorize'
const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token'
const XERO_API_BASE = 'https://api.xero.com/api.xro/2.0'
const XERO_CONNECTIONS_URL = 'https://api.xero.com/connections'

// ── Types ─────────────────────────────────────────────────────────────

export interface XeroTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  id_token?: string
}

export interface XeroTenant {
  tenantId: string
  tenantName: string
  tenantType: string
}

export interface XeroContact {
  ContactID: string
  Name: string
  FirstName?: string
  LastName?: string
  EmailAddress?: string
}

export interface XeroLineItem {
  Description: string
  Quantity: number
  UnitAmount: number
  AccountCode: string
}

export interface XeroInvoice {
  InvoiceID: string
  InvoiceNumber: string
  Status: string
  AmountDue?: number
  AmountPaid?: number
  Total?: number
}

export interface XeroWebhookEvent {
  resourceUrl: string
  resourceId: string
  eventDateUtc: string
  eventType: string
  eventCategory: string
  tenantId: string
  tenantType: string
}

// ── Helpers ───────────────────────────────────────────────────────────

function getClientId(): string {
  const id = process.env.XERO_CLIENT_ID
  if (!id) throw new Error('XERO_CLIENT_ID is not set')
  return id
}

function getClientSecret(): string {
  const secret = process.env.XERO_CLIENT_SECRET
  if (!secret) throw new Error('XERO_CLIENT_SECRET is not set')
  return secret
}

function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL
  if (!url) throw new Error('NEXT_PUBLIC_APP_URL is not set')
  return url
}

function getRedirectUri(): string {
  return `${getAppUrl()}/api/integrations/xero/callback`
}

// ── OAuth ─────────────────────────────────────────────────────────────

/** Build the Xero OAuth 2.0 authorize URL */
export function getXeroAuthUrl(orgId: string): string {
  const state = Buffer.from(JSON.stringify({
    orgId,
    token: Math.random().toString(36).substring(2),
    timestamp: Date.now(),
  })).toString('base64')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    scope: 'openid profile email accounting.transactions accounting.contacts offline_access',
    state,
  })

  return `${XERO_AUTH_URL}?${params}`
}

/** Exchange an authorization code for access and refresh tokens */
export async function exchangeXeroCode(code: string): Promise<XeroTokens> {
  const response = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${getClientId()}:${getClientSecret()}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: getRedirectUri(),
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Xero token exchange failed (${response.status}): ${errorBody}`)
  }

  const data = await response.json()

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    id_token: data.id_token,
  }
}

/** Refresh an expired access token */
export async function refreshXeroToken(refreshToken: string): Promise<XeroTokens> {
  const response = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${getClientId()}:${getClientSecret()}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Xero token refresh failed (${response.status}): ${errorBody}`)
  }

  const data = await response.json()

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  }
}

// ── Connections / Tenants ─────────────────────────────────────────────

/** Fetch the list of connected Xero tenants (orgs) */
export async function getTenants(accessToken: string): Promise<XeroTenant[]> {
  const response = await fetch(XERO_CONNECTIONS_URL, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Xero get tenants failed (${response.status}): ${errorBody}`)
  }

  const data = await response.json()

  return data.map((tenant: Record<string, unknown>) => ({
    tenantId: tenant.tenantId as string,
    tenantName: tenant.tenantName as string,
    tenantType: tenant.tenantType as string,
  }))
}

// ── Contacts ──────────────────────────────────────────────────────────

/** Create a contact in Xero */
export async function createContact(
  accessToken: string,
  tenantId: string,
  contact: {
    Name: string
    FirstName?: string
    LastName?: string
    EmailAddress?: string
    Phones?: Array<{ PhoneType: string; PhoneNumber: string }>
  }
): Promise<XeroContact> {
  const response = await fetch(`${XERO_API_BASE}/Contacts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Xero-Tenant-Id': tenantId,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ Contacts: [contact] }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Xero create contact failed (${response.status}): ${errorBody}`)
  }

  const data = await response.json()
  const created = data.Contacts?.[0]

  if (!created?.ContactID) {
    throw new Error('Xero create contact returned no ContactID')
  }

  return {
    ContactID: created.ContactID,
    Name: created.Name,
    FirstName: created.FirstName,
    LastName: created.LastName,
    EmailAddress: created.EmailAddress,
  }
}

/** Find a contact by email address, returns null if not found */
export async function findContactByEmail(
  accessToken: string,
  tenantId: string,
  email: string
): Promise<XeroContact | null> {
  const response = await fetch(
    `${XERO_API_BASE}/Contacts?where=EmailAddress%3D%3D%22${encodeURIComponent(email)}%22`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Xero-Tenant-Id': tenantId,
        'Accept': 'application/json',
      },
    }
  )

  if (!response.ok) {
    // 404 or empty is fine — means no contact found
    return null
  }

  const data = await response.json()
  const contact = data.Contacts?.[0]

  if (!contact?.ContactID) {
    return null
  }

  return {
    ContactID: contact.ContactID,
    Name: contact.Name,
    FirstName: contact.FirstName,
    LastName: contact.LastName,
    EmailAddress: contact.EmailAddress,
  }
}

// ── Invoices ──────────────────────────────────────────────────────────

/** Create an invoice in Xero */
export async function createInvoice(
  accessToken: string,
  tenantId: string,
  invoice: {
    Type: 'ACCREC'
    Contact: { ContactID: string }
    LineItems: XeroLineItem[]
    DueDate: string
    Reference?: string
    Status?: 'DRAFT' | 'SUBMITTED' | 'AUTHORISED'
  }
): Promise<XeroInvoice> {
  const response = await fetch(`${XERO_API_BASE}/Invoices`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Xero-Tenant-Id': tenantId,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ Invoices: [invoice] }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Xero create invoice failed (${response.status}): ${errorBody}`)
  }

  const data = await response.json()
  const created = data.Invoices?.[0]

  if (!created?.InvoiceID) {
    throw new Error('Xero create invoice returned no InvoiceID')
  }

  return {
    InvoiceID: created.InvoiceID,
    InvoiceNumber: created.InvoiceNumber,
    Status: created.Status,
    AmountDue: created.AmountDue,
    AmountPaid: created.AmountPaid,
    Total: created.Total,
  }
}

/** Get an invoice by ID */
export async function getInvoice(
  accessToken: string,
  tenantId: string,
  invoiceId: string
): Promise<XeroInvoice> {
  const response = await fetch(`${XERO_API_BASE}/Invoices/${invoiceId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Xero-Tenant-Id': tenantId,
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Xero get invoice failed (${response.status}): ${errorBody}`)
  }

  const data = await response.json()
  const invoice = data.Invoices?.[0]

  if (!invoice?.InvoiceID) {
    throw new Error('Xero get invoice returned no data')
  }

  return {
    InvoiceID: invoice.InvoiceID,
    InvoiceNumber: invoice.InvoiceNumber,
    Status: invoice.Status,
    AmountDue: invoice.AmountDue,
    AmountPaid: invoice.AmountPaid,
    Total: invoice.Total,
  }
}

/** Send an invoice via email through Xero */
export async function sendInvoice(
  accessToken: string,
  tenantId: string,
  invoiceId: string
): Promise<void> {
  const response = await fetch(`${XERO_API_BASE}/Invoices/${invoiceId}/Email`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Xero-Tenant-Id': tenantId,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Xero send invoice email failed (${response.status}): ${errorBody}`)
  }
}

// ── Token Management ──────────────────────────────────────────────────

/**
 * Ensure a valid Xero access token for an organization.
 * Reads the integration row, checks token expiry, refreshes if needed,
 * updates the row, and returns the valid access_token and tenant_id.
 */
export async function ensureValidToken(
  orgId: string
): Promise<{ accessToken: string; tenantId: string }> {
  const supabase = createAdminClient()

  const { data: integration, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('organization_id', orgId)
    .eq('provider', 'xero')
    .eq('status', 'connected')
    .single()

  if (error || !integration) {
    throw new Error('Xero integration not found or not connected')
  }

  const metadata = integration.metadata as Record<string, unknown> | null
  const tenantId = (metadata?.tenant_id as string) || integration.account_id

  if (!tenantId) {
    throw new Error('Xero tenant ID not found in integration')
  }

  if (!integration.access_token) {
    throw new Error('Xero access token not found')
  }

  // Decrypt tokens from DB
  let accessToken: string
  let refreshToken: string | undefined
  try {
    const decrypted = decryptTokens({ access_token: integration.access_token, refresh_token: integration.refresh_token })
    accessToken = decrypted.access_token
    refreshToken = decrypted.refresh_token
  } catch {
    // Fallback for pre-encryption plaintext tokens
    accessToken = integration.access_token
    refreshToken = integration.refresh_token || undefined
  }

  // Check if token is expired (with 5-minute buffer)
  const expiresAt = metadata?.expires_at as number | undefined
  const isExpired = expiresAt ? Date.now() > (expiresAt - 5 * 60 * 1000) : true

  if (!isExpired) {
    return { accessToken, tenantId }
  }

  // Token is expired — refresh it
  if (!refreshToken) {
    throw new Error('Xero refresh token not found — re-authentication required')
  }

  const tokens = await refreshXeroToken(refreshToken)

  const newExpiresAt = Date.now() + tokens.expires_in * 1000

  // Re-encrypt refreshed tokens before storing
  const encrypted = encryptTokens({ access_token: tokens.access_token, refresh_token: tokens.refresh_token })

  await supabase
    .from('integrations')
    .update({
      access_token: encrypted.access_token,
      refresh_token: encrypted.refresh_token,
      metadata: {
        ...(metadata || {}),
        tenant_id: tenantId,
        expires_at: newExpiresAt,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', integration.id)

  return { accessToken: tokens.access_token, tenantId }
}

// ── Xero Invoice Status Mapping ───────────────────────────────────────

/** Map Xero invoice status to our internal invoice_status */
export function mapXeroStatus(
  xeroStatus: string
): 'none' | 'draft' | 'sent' | 'viewed' | 'paid' {
  switch (xeroStatus) {
    case 'DRAFT':
      return 'draft'
    case 'SUBMITTED':
    case 'AUTHORISED':
      return 'sent'
    case 'PAID':
      return 'paid'
    case 'VOIDED':
    case 'DELETED':
      return 'none'
    default:
      return 'draft'
  }
}
