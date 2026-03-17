// app/api/admin/organizations/[id]/payments/route.ts
// Record and list payment history for an organization (admin only)
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('GBP'),
  payment_method: z.enum(['card_manual', 'cash', 'bank_transfer']),
  period_start: z.string(), // ISO date
  period_end: z.string(),   // ISO date
  reference: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/admin/organizations/[id]/payments — List payment history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase = createAdminClient()
  const { data: userData } = await (adminSupabase.from('users') as any)
    .select('is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.is_agency_user) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const admin = adminSupabase
  const { data: payments, error } = await (admin.from('membership_payments') as any)
    .select('*')
    .eq('organization_id', params.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(payments || [])
}

// POST /api/admin/organizations/[id]/payments — Record manual payment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase2 = createAdminClient()
  const { data: userData } = await (adminSupabase2.from('users') as any)
    .select('is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.is_agency_user) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await request.json()
  const validation = recordPaymentSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 })
  }

  const { amount, currency, payment_method, period_start, period_end, reference, notes } = validation.data
  const admin = adminSupabase2

  try {
    // 1. Insert payment record
    const { data: payment, error: paymentError } = await (admin.from('membership_payments') as any)
      .insert({
        organization_id: params.id,
        amount,
        currency,
        payment_method,
        period_start,
        period_end,
        reference: reference || null,
        notes: notes || null,
        recorded_by: user.id,
      })
      .select()
      .single()

    if (paymentError) {
      return NextResponse.json({ error: paymentError.message }, { status: 500 })
    }

    // 2. Get current org to check if first payment
    const { data: org } = await (admin.from('organizations') as any)
      .select('membership_started_at, total_months_paid, account_status')
      .eq('id', params.id)
      .single()

    // 3. Compute grace_until = period_end + 3 days
    const graceDate = new Date(period_end)
    graceDate.setDate(graceDate.getDate() + 3)

    // 4. Update org membership fields
    const updates: Record<string, unknown> = {
      membership_status: 'active',
      payment_method,
      membership_paid_until: period_end,
      membership_grace_until: graceDate.toISOString(),
      total_months_paid: (org?.total_months_paid || 0) + 1,
      membership_paused_at: null,
    }

    // Set membership_started_at if first time
    if (!org?.membership_started_at) {
      updates.membership_started_at = new Date().toISOString()
    }

    // Unlock account if it was locked for payment reasons
    if (org?.account_status === 'locked') {
      updates.account_status = 'active'
      updates.account_locked_at = null
      updates.account_lock_reason = null
      updates.account_locked_by = null
    }

    await (admin.from('organizations') as any)
      .update(updates)
      .eq('id', params.id)

    return NextResponse.json({ payment, membership_status: 'active' }, { status: 201 })
  } catch (err) {
    console.error('Record payment error:', err)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }
}
