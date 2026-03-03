// app/api/admin/organizations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/organizations/[id] - Get full org details (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin check
  const { data: userData } = await (supabase
    .from('users') as any)
    .select('is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.is_agency_user) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: org, error } = await (admin
    .from('organizations') as any)
    .select('id, name, slug, subscription_tier, subscription_status, plan, plan_changed_at, created_at, settings, account_status, account_locked_at, account_lock_reason, stripe_customer_id, stripe_subscription_id, membership_status, payment_method, membership_started_at, membership_paid_until, membership_grace_until, membership_paused_at, membership_cancelled_at, total_months_paid')
    .eq('id', params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  return NextResponse.json(org)
}

// DELETE /api/admin/organizations/[id] - Delete org and all related data (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = createClient()
  const orgId = params.id

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin check
  const { data: userData } = await (supabase
    .from('users') as any)
    .select('is_agency_user, organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.is_agency_user) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Prevent deleting your own org
  if (userData.organization_id === orgId) {
    return NextResponse.json({ error: 'Cannot delete your own organization' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify org exists
  const { data: org } = await (admin
    .from('organizations') as any)
    .select('id, name')
    .eq('id', orgId)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // Get all users in this org (to delete auth accounts)
  const { data: orgUsers } = await (admin
    .from('users') as any)
    .select('id')
    .eq('organization_id', orgId)

  // Get all lead IDs for cascade cleanup
  const { data: orgLeads } = await (admin
    .from('leads') as any)
    .select('id')
    .eq('organization_id', orgId)

  const leadIds = (orgLeads || []).map((l: { id: string }) => l.id)

  // Delete in dependency order (child tables first)
  // 1. Messages (via conversations)
  if (leadIds.length > 0) {
    const { data: convs } = await (admin
      .from('conversations') as any)
      .select('id')
      .in('lead_id', leadIds)

    const convIds = (convs || []).map((c: { id: string }) => c.id)
    if (convIds.length > 0) {
      await (admin.from('messages') as any).delete().in('conversation_id', convIds)
    }

    // 2. Conversations
    await (admin.from('conversations') as any).delete().in('lead_id', leadIds)

    // 3. Lead activities
    await (admin.from('lead_activities') as any).delete().eq('organization_id', orgId)
  }

  // 4. Leads
  await (admin.from('leads') as any).delete().eq('organization_id', orgId)

  // 5. Automation runs, actions, automations
  const { data: automations } = await (admin
    .from('automations') as any)
    .select('id')
    .eq('organization_id', orgId)

  const automationIds = (automations || []).map((a: { id: string }) => a.id)
  if (automationIds.length > 0) {
    await (admin.from('automation_runs') as any).delete().in('automation_id', automationIds)
    await (admin.from('automation_actions') as any).delete().in('automation_id', automationIds)
  }
  await (admin.from('automations') as any).delete().eq('organization_id', orgId)

  // 6. Ad performance & campaigns
  await (admin.from('ad_performance') as any).delete().eq('organization_id', orgId)
  await (admin.from('ad_campaigns') as any).delete().eq('organization_id', orgId)

  // 7. Integrations
  await (admin.from('integrations') as any).delete().eq('organization_id', orgId)

  // 8. Membership payments
  await (admin.from('membership_payments') as any).delete().eq('organization_id', orgId)

  // 9. System logs
  await (admin.from('system_logs') as any).delete().eq('organization_id', orgId)

  // 10. Admin alerts
  await (admin.from('admin_alerts') as any).delete().eq('organization_id', orgId)

  // 11. Delete users from users table
  await (admin.from('users') as any).delete().eq('organization_id', orgId)

  // 12. Delete organization
  const { error: deleteError } = await (admin
    .from('organizations') as any)
    .delete()
    .eq('id', orgId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // 13. Delete auth users
  for (const u of (orgUsers || [])) {
    try {
      await admin.auth.admin.deleteUser(u.id)
    } catch {
      // Best effort — auth user may already be gone
    }
  }

  return NextResponse.json({ success: true, deleted: org.name })
}
