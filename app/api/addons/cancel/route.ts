// app/api/addons/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

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

  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
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
  const admin = adminSupabase

  const { data: addon } = await (admin as any)
    .from('account_addons')
    .select('id, stripe_subscription_id, granted_by')
    .eq('organization_id', userData.organization_id)
    .eq('addon_key', addon_key)
    .eq('status', 'active')
    .single()

  if (!addon) {
    return NextResponse.json({ error: 'No active addon found' }, { status: 404 })
  }

  // If manually granted, just update status
  if (!addon.stripe_subscription_id) {
    await (admin as any)
      .from('account_addons')
      .update({ status: 'cancelled' })
      .eq('id', addon.id)
    return NextResponse.json({ cancelled: true })
  }

  // Cancel Stripe subscription immediately
  const cancelRes = await fetch(
    `${STRIPE_API_BASE}/subscriptions/${addon.stripe_subscription_id}`,
    {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getSecretKey()}` },
    }
  )

  if (!cancelRes.ok) {
    console.error('Stripe cancel error:', await cancelRes.text())
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }

  await (admin as any)
    .from('account_addons')
    .update({ status: 'cancelled' })
    .eq('id', addon.id)

  return NextResponse.json({ cancelled: true })
}
