// app/api/addons/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { ADDONS, canPurchaseAddon, isIncludedInPlan, type AddonKey } from '@/lib/addons'

const STRIPE_API_BASE = 'https://api.stripe.com/v1'

const schema = z.object({
  addon_key: z.enum(['ai_receptionist', 'outbound_leads']),
})

function getSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  return key
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, is_agency_user, role')
    .eq('id', user.id)
    .single() as { data: { organization_id: string; is_agency_user: boolean; role: string } | null }

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (!userData.is_agency_user && !['owner', 'admin'].includes(userData.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { addon_key } = parsed.data
  const addonConfig = ADDONS[addon_key]

  // Get org
  const { data: org } = await (supabase as any)
    .from('organizations')
    .select('id, plan, stripe_customer_id, name')
    .eq('id', userData.organization_id)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const plan = org.plan || 'core'

  // Already included in plan?
  if (isIncludedInPlan(plan, addon_key)) {
    return NextResponse.json({ error: 'This feature is already included in your plan' }, { status: 400 })
  }

  // Can this plan purchase this addon?
  if (!canPurchaseAddon(plan, addon_key)) {
    return NextResponse.json({ error: 'This addon is not available for your plan' }, { status: 403 })
  }

  // Already active?
  const { data: existing } = await (supabase as any)
    .from('account_addons')
    .select('id, status')
    .eq('organization_id', userData.organization_id)
    .eq('addon_key', addon_key)
    .eq('status', 'active')
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Addon already active' }, { status: 400 })
  }

  // Get Stripe price ID
  const priceId = process.env[addonConfig.priceEnvKey]
  if (!priceId) {
    return NextResponse.json({ error: 'Addon pricing not configured' }, { status: 500 })
  }

  // Create or reuse Stripe customer
  let customerId = org.stripe_customer_id
  if (!customerId) {
    const cusBody = new URLSearchParams()
    cusBody.append('name', org.name)
    cusBody.append('email', user.email || '')
    cusBody.append('metadata[organization_id]', org.id)

    const cusRes = await fetch(`${STRIPE_API_BASE}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getSecretKey()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: cusBody.toString(),
    })

    if (!cusRes.ok) {
      return NextResponse.json({ error: 'Failed to create Stripe customer' }, { status: 500 })
    }

    const cusData = await cusRes.json()
    customerId = cusData.id

    await (supabase as any)
      .from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', org.id)
  }

  // Create Checkout Session
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.driveimpact.io'
  const checkoutBody = new URLSearchParams()
  checkoutBody.append('mode', 'subscription')
  checkoutBody.append('customer', customerId)
  checkoutBody.append('line_items[0][price]', priceId)
  checkoutBody.append('line_items[0][quantity]', '1')
  checkoutBody.append('success_url', `${appUrl}/dashboard/addons?success=true&addon=${addon_key}`)
  checkoutBody.append('cancel_url', `${appUrl}/dashboard/addons?cancelled=true`)
  checkoutBody.append('metadata[addon_key]', addon_key)
  checkoutBody.append('metadata[organization_id]', org.id)
  checkoutBody.append('subscription_data[metadata][addon_key]', addon_key)
  checkoutBody.append('subscription_data[metadata][organization_id]', org.id)

  const checkoutRes = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: checkoutBody.toString(),
  })

  if (!checkoutRes.ok) {
    const err = await checkoutRes.json()
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }

  const session = await checkoutRes.json()
  return NextResponse.json({ url: session.url })
}
