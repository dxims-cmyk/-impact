// app/api/integrations/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyWebhookSignature } from '@/lib/integrations/stripe'

// POST /api/integrations/stripe/webhook - Receive Stripe webhook events
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createAdminClient()

  // Read raw body for signature verification
  const rawBody = await request.text()
  const signatureHeader = request.headers.get('stripe-signature')

  if (!signatureHeader) {
    console.error('Stripe webhook: missing stripe-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('Stripe webhook: STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  // Verify signature
  let event: { id: string; type: string; data: { object: Record<string, unknown> } }
  try {
    event = verifyWebhookSignature(rawBody, signatureHeader, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(supabase, event.data.object)
        break
      }

      case 'payment_intent.payment_failed': {
        await handlePaymentFailed(supabase, event.data.object)
        break
      }

      case 'charge.refunded': {
        await handleChargeRefunded(supabase, event.data.object)
        break
      }

      default: {
        // Unhandled event type — acknowledge receipt
        break
      }
    }
  } catch (err) {
    // Log but still return 200 to prevent Stripe retries for processing errors
    console.error(`Stripe webhook processing error for ${event.type}:`, err)
  }

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ received: true })
}

// ── Event Handlers ─────────────────────────────────────────────────────

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createAdminClient>,
  session: Record<string, unknown>
): Promise<void> {
  const metadata = session.metadata as Record<string, string> | undefined
  const leadId = metadata?.lead_id

  if (!leadId) {
    console.error('Stripe webhook: checkout.session.completed missing lead_id in metadata')
    return
  }

  const amountTotal = typeof session.amount_total === 'number' ? session.amount_total : 0
  const amountPaid = amountTotal / 100 // Convert from pence/cents to pounds/dollars
  const currency = (session.currency as string || 'gbp').toUpperCase()

  // Update lead payment status
  const { data: lead, error: updateError } = await supabase
    .from('leads')
    .update({
      payment_status: 'paid',
      amount_paid: amountPaid,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .select('id, organization_id, first_name, last_name')
    .single()

  if (updateError) {
    console.error('Stripe webhook: failed to update lead payment status:', updateError)
    return
  }

  // Log activity on lead
  await supabase
    .from('lead_activities')
    .insert({
      lead_id: leadId,
      organization_id: lead.organization_id,
      type: 'payment',
      content: `Payment received: ${currency === 'GBP' ? '£' : '$'}${amountPaid.toFixed(2)}`,
      is_automated: true,
      metadata: {
        stripe_session_id: session.id,
        amount: amountPaid,
        currency,
        source: 'stripe',
      },
    })

  // Create notification
  const leadName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'A lead'
  await supabase
    .from('notifications')
    .insert({
      organization_id: lead.organization_id,
      type: 'payment',
      title: 'Payment received',
      body: `${leadName} paid ${currency === 'GBP' ? '£' : '$'}${amountPaid.toFixed(2)}`,
      metadata: { lead_id: leadId, amount: amountPaid, currency },
    })

  // Send WhatsApp notification to org owner (best-effort)
  try {
    const { data: org } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', lead.organization_id)
      .single()

    if (org?.owner_id) {
      const { data: owner } = await supabase
        .from('users')
        .select('phone')
        .eq('id', org.owner_id)
        .single()

      if (owner?.phone) {
        // Dynamic import to avoid loading WhatsApp module if not needed
        const { sendWhatsAppText } = await import('@/lib/integrations/whatsapp')
        await sendWhatsAppText({
          to: owner.phone,
          body: `Payment received! ${leadName} paid ${currency === 'GBP' ? '£' : '$'}${amountPaid.toFixed(2)}`,
        })
      }
    }
  } catch (whatsAppErr) {
    // Non-critical — log and continue
    console.error('Stripe webhook: WhatsApp notification failed:', whatsAppErr)
  }
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createAdminClient>,
  paymentIntent: Record<string, unknown>
): Promise<void> {
  const metadata = paymentIntent.metadata as Record<string, string> | undefined
  const leadId = metadata?.lead_id

  if (!leadId) {
    // Payment intents from checkout sessions inherit metadata, but may not always have lead_id
    console.error('Stripe webhook: payment_intent.payment_failed missing lead_id in metadata')
    return
  }

  // Update lead payment status
  const { data: lead, error: updateError } = await supabase
    .from('leads')
    .update({
      payment_status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .select('id, organization_id, first_name, last_name')
    .single()

  if (updateError) {
    console.error('Stripe webhook: failed to update lead payment status:', updateError)
    return
  }

  const lastError = paymentIntent.last_payment_error as Record<string, unknown> | undefined
  const failureMessage = (lastError?.message as string) || 'Payment failed'

  // Log activity
  await supabase
    .from('lead_activities')
    .insert({
      lead_id: leadId,
      organization_id: lead.organization_id,
      type: 'payment',
      content: `Payment failed: ${failureMessage}`,
      is_automated: true,
      metadata: {
        stripe_payment_intent_id: paymentIntent.id,
        failure_message: failureMessage,
        source: 'stripe',
      },
    })

  // Create notification
  const leadName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'A lead'
  await supabase
    .from('notifications')
    .insert({
      organization_id: lead.organization_id,
      type: 'payment',
      title: 'Payment failed',
      body: `${leadName}'s payment failed: ${failureMessage}`,
      metadata: { lead_id: leadId },
    })
}

async function handleChargeRefunded(
  supabase: ReturnType<typeof createAdminClient>,
  charge: Record<string, unknown>
): Promise<void> {
  const metadata = charge.metadata as Record<string, string> | undefined
  const leadId = metadata?.lead_id

  if (!leadId) {
    console.error('Stripe webhook: charge.refunded missing lead_id in metadata')
    return
  }

  const amountRefunded = typeof charge.amount_refunded === 'number'
    ? charge.amount_refunded / 100
    : 0
  const currency = (charge.currency as string || 'gbp').toUpperCase()

  // Update lead payment status
  const { data: lead, error: updateError } = await supabase
    .from('leads')
    .update({
      payment_status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .select('id, organization_id, first_name, last_name')
    .single()

  if (updateError) {
    console.error('Stripe webhook: failed to update lead payment status:', updateError)
    return
  }

  // Log activity
  await supabase
    .from('lead_activities')
    .insert({
      lead_id: leadId,
      organization_id: lead.organization_id,
      type: 'payment',
      content: `Refund issued: ${currency === 'GBP' ? '£' : '$'}${amountRefunded.toFixed(2)}`,
      is_automated: true,
      metadata: {
        stripe_charge_id: charge.id,
        amount_refunded: amountRefunded,
        currency,
        source: 'stripe',
      },
    })

  // Create notification
  const leadName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'A lead'
  await supabase
    .from('notifications')
    .insert({
      organization_id: lead.organization_id,
      type: 'payment',
      title: 'Refund issued',
      body: `Refund of ${currency === 'GBP' ? '£' : '$'}${amountRefunded.toFixed(2)} issued for ${leadName}`,
      metadata: { lead_id: leadId, amount_refunded: amountRefunded, currency },
    })
}
