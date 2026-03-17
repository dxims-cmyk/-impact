// app/api/admin/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

interface Alert {
  id: string // unique key for dismiss tracking
  type: string
  org_id: string
  org_name: string
  message: string
  timestamp: string
  meta?: Record<string, unknown>
  // Navigation target when clicking "Go to fix"
  nav?: {
    page: string // e.g. '/dashboard/integrations', '/dashboard/leads'
    description: string // e.g. 'Fix integration', 'Review stale leads'
  }
}

function alertId(type: string, orgId: string, extra?: string): string {
  return `${type}:${orgId}${extra ? ':' + extra : ''}`
}

// GET /api/admin/alerts - Get system-wide alerts for admin dashboard
export async function GET(request: NextRequest) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin (admin client bypasses RLS)
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.is_agency_user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const critical: Alert[] = []
  const warnings: Alert[] = []
  const info: Alert[] = []

  try {
    // 1. Integration errors
    const { data: errorIntegrations } = await supabase
      .from('integrations')
      .select('id, provider, status, sync_error, updated_at, organization_id, organizations(name)')
      .or('status.eq.error,sync_error.not.is.null')

    if (errorIntegrations) {
      for (const i of errorIntegrations) {
        const orgName = (i as any).organizations?.name || 'Unknown'
        critical.push({
          id: alertId('integration_error', i.organization_id, i.provider),
          type: 'integration_error',
          org_id: i.organization_id,
          org_name: orgName,
          message: `${i.provider} integration error: ${i.sync_error || 'Status: ' + i.status}`,
          timestamp: i.updated_at,
          nav: {
            page: '/dashboard/integrations',
            description: `Fix ${i.provider} integration`,
          },
        })
      }
    }

    // 2. Stale leads (new/qualified, older than 48h with no activity)
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const { data: staleLeads } = await supabase
      .from('leads')
      .select('organization_id, organizations(name), created_at')
      .in('stage', ['new', 'qualified'])
      .lt('created_at', twoDaysAgo)
      .order('created_at', { ascending: true })

    if (staleLeads && staleLeads.length > 0) {
      // Group by org
      const byOrg = new Map<string, { name: string; count: number; oldest: string }>()
      for (const lead of staleLeads) {
        const orgName = (lead as any).organizations?.name || 'Unknown'
        const existing = byOrg.get(lead.organization_id)
        if (existing) {
          existing.count++
        } else {
          byOrg.set(lead.organization_id, {
            name: orgName,
            count: 1,
            oldest: lead.created_at,
          })
        }
      }

      for (const [orgId, data] of byOrg) {
        const hoursOld = Math.round((Date.now() - new Date(data.oldest).getTime()) / (1000 * 60 * 60))
        warnings.push({
          id: alertId('stale_leads', orgId),
          type: 'stale_leads',
          org_id: orgId,
          org_name: data.name,
          message: `${data.count} unactioned lead(s), oldest is ${hoursOld}h old`,
          timestamp: data.oldest,
          meta: { count: data.count, oldest_hours: hoursOld },
          nav: {
            page: '/dashboard/leads',
            description: 'Review stale leads',
          },
        })
      }
    }

    // 3. Payment past due
    const { data: pastDueOrgs } = await supabase
      .from('organizations')
      .select('id, name, membership_status, membership_paid_until')
      .eq('membership_status', 'past_due')

    if (pastDueOrgs) {
      for (const org of pastDueOrgs) {
        const daysOverdue = org.membership_paid_until
          ? Math.round((Date.now() - new Date(org.membership_paid_until).getTime()) / (1000 * 60 * 60 * 24))
          : 0
        warnings.push({
          id: alertId('payment_past_due', org.id),
          type: 'payment_past_due',
          org_id: org.id,
          org_name: org.name,
          message: `Membership payment overdue by ${daysOverdue} day(s)`,
          timestamp: org.membership_paid_until || new Date().toISOString(),
          meta: { days_overdue: daysOverdue },
          nav: {
            page: '/dashboard/settings',
            description: 'View billing settings',
          },
        })
      }
    }

    // 4. Inactive orgs (no leads in 7 days, excluding preview orgs)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: allActiveOrgs } = await supabase
      .from('organizations')
      .select('id, name, membership_status, created_at')
      .eq('account_status', 'active')
      .neq('membership_status', 'preview')

    if (allActiveOrgs) {
      for (const org of allActiveOrgs) {
        // Check if they have any recent leads
        const { count } = await supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .gte('created_at', sevenDaysAgo)

        if (count === 0) {
          // Check org is older than 7 days (don't alert for brand new orgs)
          if (new Date(org.created_at) < new Date(sevenDaysAgo)) {
            warnings.push({
              id: alertId('no_activity_7d', org.id),
              type: 'no_activity_7d',
              org_id: org.id,
              org_name: org.name,
              message: 'No new leads in the last 7 days',
              timestamp: sevenDaysAgo,
              nav: {
                page: '/dashboard/leads',
                description: 'Check lead pipeline',
              },
            })
          }
        }
      }
    }

    // 5. New clients (created in last 7 days)
    const { data: newOrgs } = await supabase
      .from('organizations')
      .select('id, name, created_at, membership_status')
      .gte('created_at', sevenDaysAgo)
      .neq('slug', 'ampm-media')
      .order('created_at', { ascending: false })

    if (newOrgs) {
      for (const org of newOrgs) {
        info.push({
          id: alertId('new_client', org.id),
          type: 'new_client',
          org_id: org.id,
          org_name: org.name,
          message: `New client (${org.membership_status})`,
          timestamp: org.created_at,
          nav: {
            page: '/dashboard/settings',
            description: 'View client settings',
          },
        })
      }
    }

    // 6. Cancelled subscriptions
    const { data: cancelledOrgs } = await supabase
      .from('organizations')
      .select('id, name, membership_cancelled_at')
      .eq('membership_status', 'cancelled')

    if (cancelledOrgs) {
      for (const org of cancelledOrgs) {
        info.push({
          id: alertId('subscription_cancelled', org.id),
          type: 'subscription_cancelled',
          org_id: org.id,
          org_name: org.name,
          message: 'Membership cancelled',
          timestamp: org.membership_cancelled_at || new Date().toISOString(),
          nav: {
            page: '/dashboard/settings',
            description: 'View membership',
          },
        })
      }
    }

    return NextResponse.json({
      critical,
      warnings,
      info,
      counts: {
        critical: critical.length,
        warnings: warnings.length,
        info: info.length,
        total: critical.length + warnings.length + info.length,
      },
    })
  } catch (err) {
    console.error('[admin/alerts] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}
