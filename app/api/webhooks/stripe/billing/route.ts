// app/api/webhooks/stripe/billing/route.ts
// Handles Stripe subscription billing events (separate from Connect webhooks)
// Path is under /api/webhooks/ so middleware skips auth

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyWebhookSignature, type StripeWebhookEvent } from '@/lib/integrations/stripe'
import { priceIdToPlan } from '@/lib/integrations/stripe-billing'

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_BILLING_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_BILLING_WEBHOOK_SECRET is not set')
  return secret
}

/** Find org by Stripe customer ID */
async function findOrgByCustomer(customerId: string) {
  const admin = createAdminClient()
  const { data, error } = await (admin
    .from('organizations') as any)
    .select('id, plan, subscription_status, account_status, stripe_subscription_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (error || !data) return null
  return data
}

/** Update org fields */
async function updateOrg(orgId: string, updates: Record<string, unknown>) {
  const admin = createAdminClient()
  const { error } = await (admin
    .from('organizations') as any)
    .update(updates)
    .eq('id', orgId)

  if (error) {
    console.error('Failed to update org:', error.message)
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    let event: StripeWebhookEvent
    try {
      event = verifyWebhookSignature(payload, signature, getWebhookSecret())
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const obj = event.data.object as Record<string, unknown>
    const customerId = (obj.customer as string) || ''

    if (!customerId) {
      // Some events may not have a customer — ignore gracefully
      return NextResponse.json({ received: true })
    }

    const org = await findOrgByCustomer(customerId)
    if (!org) {
      console.error(`No org found for Stripe customer: ${customerId}`)
      return NextResponse.json({ received: true })
    }

    switch (event.type) {
      case 'invoice.payment_succeeded': {
        await updateOrg(org.id, {
          account_status: 'active',
          account_locked_at: null,
          account_lock_reason: null,
          account_locked_by: null,
          subscription_status: 'active',
        })
        console.log(`Payment succeeded for org ${org.id} — account unlocked`)
        break
      }

      case 'invoice.payment_failed': {
        await updateOrg(org.id, {
          account_status: 'locked',
          account_locked_at: new Date().toISOString(),
          account_lock_reason: 'Payment failed — please update your payment method',
          subscription_status: 'past_due',
        })
        console.log(`Payment failed for org ${org.id} — account locked`)
        break
      }

      case 'customer.subscription.deleted': {
        await updateOrg(org.id, {
          account_status: 'locked',
          account_locked_at: new Date().toISOString(),
          account_lock_reason: 'Subscription cancelled',
          subscription_status: 'cancelled',
          stripe_subscription_id: null,
        })
        console.log(`Subscription deleted for org ${org.id} — account locked`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = obj as Record<string, unknown>
        const items = subscription.items as { data: { price: { id: string } }[] } | undefined
        const priceId = items?.data?.[0]?.price?.id

        if (priceId) {
          const plan = priceIdToPlan(priceId)
          if (plan && plan !== org.plan) {
            await updateOrg(org.id, {
              plan,
              plan_changed_at: new Date().toISOString(),
            })
            console.log(`Subscription updated for org ${org.id} — plan changed to ${plan}`)
          }
        }

        // Also sync subscription status
        const status = subscription.status as string
        if (status) {
          const updates: Record<string, unknown> = { subscription_status: status }
          // If reactivated, unlock
          if (status === 'active' && org.account_status === 'locked') {
            updates.account_status = 'active'
            updates.account_locked_at = null
            updates.account_lock_reason = null
            updates.account_locked_by = null
          }
          await updateOrg(org.id, updates)
        }
        break
      }

      default:
        console.log(`Unhandled billing webhook event: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Billing webhook error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
