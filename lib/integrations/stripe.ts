// lib/integrations/stripe.ts
// Stripe Connect helper functions — uses fetch() only (no stripe npm package)

import crypto from 'crypto'

const STRIPE_API_BASE = 'https://api.stripe.com/v1'
const STRIPE_CONNECT_BASE = 'https://connect.stripe.com'

// ── Types ──────────────────────────────────────────────────────────────

export interface StripeConnectTokens {
  stripe_user_id: string
  access_token: string
  refresh_token: string
  scope: string
}

export interface StripeCheckoutSession {
  id: string
  url: string
  payment_status: string
  amount_total: number | null
  metadata: Record<string, string>
}

export interface StripeBalance {
  available: { amount: number; currency: string }[]
  pending: { amount: number; currency: string }[]
}

export interface StripeWebhookEvent {
  id: string
  type: string
  data: {
    object: Record<string, unknown>
  }
}

// ── Helpers ────────────────────────────────────────────────────────────

function getSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  return key
}

function getClientId(): string {
  const id = process.env.STRIPE_CLIENT_ID
  if (!id) throw new Error('STRIPE_CLIENT_ID is not set')
  return id
}

function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL
  if (!url) throw new Error('NEXT_PUBLIC_APP_URL is not set')
  return url
}

/** Encode an object as application/x-www-form-urlencoded (Stripe API format) */
function encodeFormData(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
}

// ── OAuth ──────────────────────────────────────────────────────────────

/** Build the Stripe Connect OAuth authorize URL */
export function getConnectAuthUrl(statePayload: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: getClientId(),
    scope: 'read_write',
    state: statePayload,
    redirect_uri: `${getAppUrl()}/api/integrations/stripe/callback`,
  })

  return `${STRIPE_CONNECT_BASE}/oauth/authorize?${params}`
}

/** Exchange an authorization code for connected-account tokens */
export async function exchangeCode(code: string): Promise<StripeConnectTokens> {
  const response = await fetch(`${STRIPE_CONNECT_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: encodeFormData({
      grant_type: 'authorization_code',
      code,
      client_secret: getSecretKey(),
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Stripe code exchange failed: ${error.error_description || error.error || 'Unknown error'}`)
  }

  const data = await response.json()

  return {
    stripe_user_id: data.stripe_user_id,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    scope: data.scope,
  }
}

// ── Checkout Sessions (Payment Links) ──────────────────────────────────

/** Create a Stripe Checkout Session on a connected account */
export async function createCheckoutSession(
  stripeAccountId: string,
  amount: number,
  currency: string,
  description: string,
  leadId: string
): Promise<StripeCheckoutSession> {
  const appUrl = getAppUrl()

  // Build form-encoded body for Stripe API
  // Stripe expects nested params via bracket notation
  const body = new URLSearchParams()
  body.append('mode', 'payment')
  body.append('line_items[0][price_data][currency]', currency)
  body.append('line_items[0][price_data][unit_amount]', String(Math.round(amount * 100))) // amount in pence/cents
  body.append('line_items[0][price_data][product_data][name]', description)
  body.append('line_items[0][quantity]', '1')
  body.append('metadata[lead_id]', leadId)
  body.append('success_url', `${appUrl}/payment/success?lead_id=${leadId}&session_id={CHECKOUT_SESSION_ID}`)
  body.append('cancel_url', `${appUrl}/payment/cancelled`)

  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getSecretKey()}`,
      'Stripe-Account': stripeAccountId,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Stripe checkout session failed: ${error.error?.message || 'Unknown error'}`)
  }

  const session = await response.json()

  return {
    id: session.id,
    url: session.url,
    payment_status: session.payment_status,
    amount_total: session.amount_total,
    metadata: session.metadata || {},
  }
}

// ── Balance ────────────────────────────────────────────────────────────

/** Get balance for a connected account */
export async function getBalance(stripeAccountId: string): Promise<StripeBalance> {
  const response = await fetch(`${STRIPE_API_BASE}/balance`, {
    headers: {
      'Authorization': `Bearer ${getSecretKey()}`,
      'Stripe-Account': stripeAccountId,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Stripe balance fetch failed: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()

  return {
    available: data.available || [],
    pending: data.pending || [],
  }
}

// ── Webhook Signature Verification ─────────────────────────────────────

/** Verify a Stripe webhook signature (constant-time comparison) */
export function verifyWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret: string
): StripeWebhookEvent {
  const parts = signatureHeader.split(',')
  const timestampPart = parts.find(p => p.startsWith('t='))
  const signatureParts = parts.filter(p => p.startsWith('v1='))

  if (!timestampPart || signatureParts.length === 0) {
    throw new Error('Invalid Stripe webhook signature format')
  }

  const timestamp = timestampPart.split('=')[1]
  const signatures = signatureParts.map(p => p.split('=')[1])

  // Check timestamp tolerance (5 minutes)
  const timestampAge = Math.abs(Date.now() / 1000 - parseInt(timestamp))
  if (timestampAge > 300) {
    throw new Error('Stripe webhook timestamp too old')
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex')

  // Constant-time comparison against all v1 signatures
  const valid = signatures.some(sig => {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(sig, 'hex')
      )
    } catch {
      return false
    }
  })

  if (!valid) {
    throw new Error('Stripe webhook signature verification failed')
  }

  return JSON.parse(payload) as StripeWebhookEvent
}
