// lib/integrations/stripe-billing.ts
// Stripe subscription billing helpers — uses fetch() only (no stripe npm package)
// Separate from stripe.ts which handles Stripe Connect (payment links to leads)

const STRIPE_API_BASE = 'https://api.stripe.com/v1'

// ── Types ──────────────────────────────────────────────────────────────

export interface StripeCustomer {
  id: string
  email: string
  name: string
}

export interface StripeSubscription {
  id: string
  status: string
  current_period_end: number
  items: {
    data: { id: string; price: { id: string } }[]
  }
}

export interface StripeBillingPortalSession {
  id: string
  url: string
}

// ── Helpers ────────────────────────────────────────────────────────────

function getSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  return key
}

function getPriceId(plan: 'core' | 'pro'): string {
  const key = plan === 'core' ? 'STRIPE_PRICE_CORE' : 'STRIPE_PRICE_PRO'
  const id = process.env[key]
  if (!id) throw new Error(`${key} is not set`)
  return id
}

/** Map a Stripe price ID back to a plan name */
export function priceIdToPlan(priceId: string): 'core' | 'pro' | null {
  if (priceId === process.env.STRIPE_PRICE_CORE) return 'core'
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro'
  return null
}

async function stripeRequest<T>(
  path: string,
  options: {
    method?: string
    body?: URLSearchParams
  } = {}
): Promise<T> {
  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${getSecretKey()}`,
      ...(options.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    ...(options.body ? { body: options.body.toString() } : {}),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Stripe API error: ${error.error?.message || 'Unknown error'}`)
  }

  return response.json()
}

// ── Customer ──────────────────────────────────────────────────────────

/** Create a Stripe customer for a new client org */
export async function createCustomer(
  name: string,
  email: string
): Promise<StripeCustomer> {
  const body = new URLSearchParams()
  body.append('name', name)
  body.append('email', email)

  return stripeRequest<StripeCustomer>('/customers', {
    method: 'POST',
    body,
  })
}

// ── Subscriptions ─────────────────────────────────────────────────────

/** Create a subscription for a customer (defaults to Core plan) */
export async function createSubscription(
  customerId: string,
  plan: 'core' | 'pro' = 'core'
): Promise<StripeSubscription> {
  const body = new URLSearchParams()
  body.append('customer', customerId)
  body.append('items[0][price]', getPriceId(plan))
  // Allow the first invoice to go through even without payment method yet
  body.append('payment_behavior', 'default_incomplete')
  body.append('payment_settings[save_default_payment_method]', 'on_subscription')
  body.append('expand[]', 'latest_invoice.payment_intent')

  return stripeRequest<StripeSubscription>('/subscriptions', {
    method: 'POST',
    body,
  })
}

/** Cancel a subscription at period end */
export async function cancelSubscription(
  subscriptionId: string
): Promise<StripeSubscription> {
  const body = new URLSearchParams()
  body.append('cancel_at_period_end', 'true')

  return stripeRequest<StripeSubscription>(`/subscriptions/${subscriptionId}`, {
    method: 'POST',
    body,
  })
}

/** Swap subscription price (Core ↔ Pro) */
export async function updateSubscriptionPrice(
  subscriptionId: string,
  newPlan: 'core' | 'pro'
): Promise<StripeSubscription> {
  // First get the subscription to find the item ID
  const sub = await stripeRequest<StripeSubscription>(`/subscriptions/${subscriptionId}`)

  const itemId = sub.items.data[0]?.id
  if (!itemId) throw new Error('Subscription has no items')

  const body = new URLSearchParams()
  body.append('items[0][id]', itemId)
  body.append('items[0][price]', getPriceId(newPlan))
  body.append('proration_behavior', 'create_prorations')

  return stripeRequest<StripeSubscription>(`/subscriptions/${subscriptionId}`, {
    method: 'POST',
    body,
  })
}

/** Get a subscription by ID */
export async function getSubscription(
  subscriptionId: string
): Promise<StripeSubscription> {
  return stripeRequest<StripeSubscription>(`/subscriptions/${subscriptionId}`)
}

// ── Billing Portal ────────────────────────────────────────────────────

/** Create a Stripe Customer Portal session for self-service billing */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<StripeBillingPortalSession> {
  const body = new URLSearchParams()
  body.append('customer', customerId)
  body.append('return_url', returnUrl)

  return stripeRequest<StripeBillingPortalSession>('/billing_portal/sessions', {
    method: 'POST',
    body,
  })
}
