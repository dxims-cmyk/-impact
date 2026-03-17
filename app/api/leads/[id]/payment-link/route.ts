// app/api/leads/[id]/payment-link/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/integrations/stripe'
import { z } from 'zod'

// Validation schema for payment link creation
const createPaymentLinkSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(500),
  currency: z.string().length(3).default('gbp'),
})

// POST /api/leads/[id]/payment-link - Generate a Stripe payment link for a lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: leadId } = await params
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 })
  }

  // Parse and validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = createPaymentLinkSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten(),
    }, { status: 400 })
  }

  const { amount, description, currency } = validation.data

  // Verify the lead exists and belongs to this org
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id, organization_id, first_name, last_name, email')
    .eq('id', leadId)
    .eq('organization_id', userData.organization_id)
    .single()

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Get org's Stripe integration
  const { data: integration } = await supabase
    .from('integrations')
    .select('account_id, status')
    .eq('organization_id', userData.organization_id)
    .eq('provider', 'stripe')
    .eq('status', 'connected')
    .single()

  if (!integration?.account_id) {
    return NextResponse.json(
      { error: 'Stripe is not connected. Please connect Stripe in Integrations settings.' },
      { status: 400 }
    )
  }

  try {
    // Create Stripe Checkout Session on the connected account
    const session = await createCheckoutSession(
      integration.account_id,
      amount,
      currency,
      description,
      leadId
    )

    // Update lead with payment link and status
    await supabase
      .from('leads')
      .update({
        payment_status: 'pending',
        payment_link: session.url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    // Log activity
    const currencySymbol = currency.toUpperCase() === 'GBP' ? '\u00a3' : '$'
    await supabase
      .from('lead_activities')
      .insert({
        lead_id: leadId,
        organization_id: userData.organization_id,
        type: 'payment',
        content: `Payment link created: ${currencySymbol}${amount.toFixed(2)} for "${description}"`,
        performed_by: user.id,
        metadata: {
          stripe_session_id: session.id,
          amount,
          currency,
          description,
          source: 'stripe',
        },
      })

    return NextResponse.json({
      url: session.url,
      id: session.id,
    })
  } catch (err) {
    console.error('Failed to create payment link:', err)
    const message = err instanceof Error ? err.message : 'Failed to create payment link'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
