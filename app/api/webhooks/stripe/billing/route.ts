// app/api/webhooks/stripe/billing/route.ts
// Handles Stripe subscription billing events (separate from Connect webhooks)
// Path is under /api/webhooks/ so middleware skips auth

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyWebhookSignature, type StripeWebhookEvent } from '@/lib/integrations/stripe'
import { priceIdToPlan } from '@/lib/integrations/stripe-billing'
import { systemLog } from '@/lib/system-log'

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
    .select('id, plan, subscription_status, account_status, stripe_subscription_id, membership_started_at, total_months_paid')
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
        // Extract invoice period
        const invoice = obj as Record<string, unknown>
        const periodStart = invoice.period_start as number | undefined
        const periodEnd = invoice.period_end as number | undefined
        const amountPaid = ((invoice.amount_paid as number) || 0) / 100
        const invoiceId = invoice.id as string

        await updateOrg(org.id, {
          account_status: 'active',
          account_locked_at: null,
          account_lock_reason: null,
          account_locked_by: null,
          subscription_status: 'active',
          membership_status: 'active',
          payment_method: 'stripe_recurring',
          membership_started_at: org.membership_started_at || new Date().toISOString(),
          membership_paid_until: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          total_months_paid: (org.total_months_paid || 0) + 1,
        })

        // Write payment record
        if (amountPaid > 0) {
          const admin = createAdminClient()
          await (admin.from('membership_payments') as any).insert({
            organization_id: org.id,
            amount: amountPaid,
            currency: (invoice.currency as string)?.toUpperCase() || 'GBP',
            payment_method: 'stripe_recurring',
            period_start: periodStart ? new Date(periodStart * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            period_end: periodEnd ? new Date(periodEnd * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            stripe_invoice_id: invoiceId || null,
            recorded_by: null,
          })
        }

        console.log(`Payment succeeded for org ${org.id} — account unlocked, membership active`)
        break
      }

      case 'invoice.payment_failed': {
        const failedInvoice = obj as Record<string, unknown>
        await updateOrg(org.id, {
          account_status: 'locked',
          account_locked_at: new Date().toISOString(),
          account_lock_reason: 'Payment failed — please update your payment method',
          subscription_status: 'past_due',
          membership_status: 'past_due',
        })
        console.log(`Payment failed for org ${org.id} — account locked, membership past_due`)
        await systemLog('error', 'billing', 'Payment failed for org', org.id, { stripe_invoice_id: failedInvoice.id as string, error: 'invoice.payment_failed' })
        break
      }

      case 'customer.subscription.deleted': {
        const deletedSub = obj as Record<string, unknown>
        const deletedSubId = deletedSub.id as string
        const deletedMeta = deletedSub.metadata as Record<string, string> | undefined

        // Check if this is an addon subscription
        if (deletedMeta?.addon_key) {
          const admin = createAdminClient()
          await (admin as any)
            .from('account_addons')
            .update({ status: 'cancelled' })
            .eq('stripe_subscription_id', deletedSubId)
          console.log(`Addon subscription ${deletedSubId} cancelled for org ${org.id}`)
        } else {
          // Main membership subscription
          await updateOrg(org.id, {
            account_status: 'locked',
            account_locked_at: new Date().toISOString(),
            account_lock_reason: 'Subscription cancelled',
            subscription_status: 'cancelled',
            stripe_subscription_id: null,
            membership_status: 'cancelled',
            membership_cancelled_at: new Date().toISOString(),
          })
          console.log(`Subscription deleted for org ${org.id} — account locked, membership cancelled`)
          await systemLog('error', 'billing', 'Subscription deleted for org', org.id, { stripe_subscription_id: deletedSubId, error: 'customer.subscription.deleted' })
        }
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

      case 'checkout.session.completed': {
        const session = obj as Record<string, unknown>
        const metadata = session.metadata as Record<string, string> | undefined
        const addonKey = metadata?.addon_key
        const addonOrgId = metadata?.organization_id
        const subId = session.subscription as string | undefined

        if (addonKey && addonOrgId && subId) {
          const admin = createAdminClient()
          const { data: existing } = await (admin as any)
            .from('account_addons')
            .select('id')
            .eq('organization_id', addonOrgId)
            .eq('addon_key', addonKey)
            .single()

          if (existing) {
            await (admin as any)
              .from('account_addons')
              .update({ status: 'active', stripe_subscription_id: subId, granted_by: null })
              .eq('id', existing.id)
          } else {
            await (admin as any)
              .from('account_addons')
              .insert({
                organization_id: addonOrgId,
                addon_key: addonKey,
                stripe_subscription_id: subId,
                status: 'active',
              })
          }
          console.log(`Addon ${addonKey} activated for org ${addonOrgId}`)
        }
        break
      }

      default:
        console.log(`Unhandled billing webhook event: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Billing webhook error:', err)
    await systemLog('error', 'billing', 'Billing webhook handler failed', undefined, { error: String(err) })
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
