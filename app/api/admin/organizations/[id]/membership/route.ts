// app/api/admin/organizations/[id]/membership/route.ts
// Membership lifecycle management (admin only)
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const membershipActionSchema = z.object({
  action: z.enum(['activate', 'pause', 'resume', 'suspend', 'cancel', 'extend']),
  paid_until: z.string().optional(),
  payment_method: z.enum(['stripe_recurring', 'card_manual', 'cash', 'bank_transfer']).optional(),
  reason: z.string().optional(),
})

// GET /api/admin/organizations/[id]/membership — Get membership details
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
  const { data: org, error } = await (admin.from('organizations') as any)
    .select('id, name, membership_status, payment_method, membership_started_at, membership_paid_until, membership_grace_until, membership_paused_at, membership_cancelled_at, total_months_paid, account_status')
    .eq('id', params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(org)
}

// PATCH /api/admin/organizations/[id]/membership — Perform membership action
export async function PATCH(
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
  const validation = membershipActionSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 })
  }

  const { action, paid_until, payment_method, reason } = validation.data
  const admin = adminSupabase2

  // Get current org state
  const { data: org, error: orgError } = await (admin.from('organizations') as any)
    .select('id, membership_status, membership_started_at, membership_paid_until, total_months_paid')
    .eq('id', params.id)
    .single()

  if (orgError || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const updates: Record<string, unknown> = {}

  switch (action) {
    case 'activate': {
      updates.membership_status = 'active'
      updates.membership_paused_at = null
      if (payment_method) updates.payment_method = payment_method
      if (paid_until) {
        updates.membership_paid_until = paid_until
        const grace = new Date(paid_until)
        grace.setDate(grace.getDate() + 3)
        updates.membership_grace_until = grace.toISOString()
      }
      if (!org.membership_started_at) {
        updates.membership_started_at = new Date().toISOString()
      }
      // Unlock if locked
      updates.account_status = 'active'
      updates.account_locked_at = null
      updates.account_lock_reason = null
      updates.account_locked_by = null
      break
    }
    case 'pause': {
      updates.membership_status = 'paused'
      updates.membership_paused_at = new Date().toISOString()
      break
    }
    case 'resume': {
      updates.membership_status = 'active'
      updates.membership_paused_at = null
      // Unlock if locked
      updates.account_status = 'active'
      updates.account_locked_at = null
      updates.account_lock_reason = null
      updates.account_locked_by = null
      break
    }
    case 'suspend': {
      updates.membership_status = 'suspended'
      updates.account_status = 'locked'
      updates.account_locked_at = new Date().toISOString()
      updates.account_lock_reason = reason || 'Membership suspended by admin'
      updates.account_locked_by = user.id
      break
    }
    case 'cancel': {
      updates.membership_status = 'cancelled'
      updates.membership_cancelled_at = new Date().toISOString()
      break
    }
    case 'extend': {
      if (!paid_until) {
        return NextResponse.json({ error: 'paid_until is required for extend action' }, { status: 400 })
      }
      updates.membership_paid_until = paid_until
      const grace = new Date(paid_until)
      grace.setDate(grace.getDate() + 3)
      updates.membership_grace_until = grace.toISOString()
      // Resume if past_due
      if (org.membership_status === 'past_due') {
        updates.membership_status = 'active'
      }
      // Unlock if locked
      updates.account_status = 'active'
      updates.account_locked_at = null
      updates.account_lock_reason = null
      updates.account_locked_by = null
      break
    }
  }

  const { error: updateError } = await (admin.from('organizations') as any)
    .update(updates)
    .eq('id', params.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, action, updates })
}
