// app/api/billing/portal/route.ts
// Authenticated endpoint: creates a Stripe Customer Portal session for self-service billing

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBillingPortalSession } from '@/lib/integrations/stripe-billing'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org
  const { data: userData } = await (supabase
    .from('users') as any)
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 })
  }

  // Get org's Stripe customer ID
  const { data: org } = await (supabase
    .from('organizations') as any)
    .select('stripe_customer_id')
    .eq('id', userData.organization_id)
    .single()

  if (!org?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No billing account found. Please contact support.' },
      { status: 404 }
    )
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const returnUrl = `${appUrl}/dashboard/settings`

    const session = await createBillingPortalSession(org.stripe_customer_id, returnUrl)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Billing portal error:', err)
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}
