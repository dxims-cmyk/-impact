// app/api/admin/organizations/[id]/subscription/route.ts
// Admin-only: manage Stripe subscriptions for client orgs

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import {
  createCustomer,
  createSubscription,
  updateSubscriptionPrice,
  cancelSubscription,
} from '@/lib/integrations/stripe-billing'

// ── Auth helper ──────────────────────────────────────────────────────

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userData } = await (supabase
    .from('users') as any)
    .select('is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.is_agency_user) return null
  return user
}

// ── POST: Create subscription for org (backfill) ─────────────────────

const createSchema = z.object({
  plan: z.enum(['core', 'growth', 'pro']).default('core'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = createClient()
  const user = await requireAdmin(supabase)
  if (!user) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await req.json()
  const validation = createSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { plan } = validation.data
  const { id } = await params
  const admin = createAdminClient()

  // Get org
  const { data: org, error: orgError } = await (admin
    .from('organizations') as any)
    .select('id, name, stripe_customer_id, stripe_subscription_id')
    .eq('id', id)
    .single()

  if (orgError || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  try {
    let customerId = org.stripe_customer_id

    // Create Stripe customer if none exists
    if (!customerId) {
      // Get the owner's email
      const { data: owner } = await (admin
        .from('users') as any)
        .select('email')
        .eq('organization_id', id)
        .eq('role', 'owner')
        .single()

      const customer = await createCustomer(org.name, owner?.email || '')
      customerId = customer.id

      await (admin
        .from('organizations') as any)
        .update({ stripe_customer_id: customerId })
        .eq('id', id)
    }

    // Create subscription if none exists
    if (org.stripe_subscription_id) {
      return NextResponse.json({ error: 'Subscription already exists' }, { status: 409 })
    }

    const subscription = await createSubscription(customerId, plan)

    await (admin
      .from('organizations') as any)
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        plan,
        plan_changed_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
      },
    }, { status: 201 })
  } catch (err) {
    console.error('Create subscription error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

// ── PATCH: Change subscription plan ──────────────────────────────────

const updateSchema = z.object({
  plan: z.enum(['core', 'growth', 'pro']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = createClient()
  const user = await requireAdmin(supabase)
  if (!user) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await req.json()
  const validation = updateSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const { plan } = validation.data
  const { id } = await params
  const admin = createAdminClient()

  const { data: org } = await (admin
    .from('organizations') as any)
    .select('id, stripe_subscription_id, plan')
    .eq('id', id)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  if (org.plan === plan) {
    return NextResponse.json({ error: 'Already on this plan' }, { status: 400 })
  }

  try {
    // Update Stripe subscription if one exists
    if (org.stripe_subscription_id) {
      await updateSubscriptionPrice(org.stripe_subscription_id, plan)
    }

    // Always update the DB plan
    await (admin
      .from('organizations') as any)
      .update({
        plan,
        plan_changed_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({ success: true, plan })
  } catch (err) {
    console.error('Update subscription error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

// ── DELETE: Cancel subscription ──────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = createClient()
  const user = await requireAdmin(supabase)
  if (!user) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { id } = await params
  const admin = createAdminClient()

  const { data: org } = await (admin
    .from('organizations') as any)
    .select('id, stripe_subscription_id')
    .eq('id', id)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  if (!org.stripe_subscription_id) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
  }

  try {
    await cancelSubscription(org.stripe_subscription_id)

    await (admin
      .from('organizations') as any)
      .update({
        subscription_status: 'cancelling',
      })
      .eq('id', id)

    return NextResponse.json({ success: true, message: 'Subscription will cancel at period end' })
  } catch (err) {
    console.error('Cancel subscription error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
