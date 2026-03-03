// trigger/jobs/check-membership-expiry.ts
// Scheduled task: runs every 6 hours to check membership expirations
import { schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/lib/supabase/server"

export const checkMembershipExpiryTask = schedules.task({
  id: "check-membership-expiry",
  cron: "0 */6 * * *", // Every 6 hours
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async () => {
    const admin = createAdminClient()
    const now = new Date().toISOString()

    // 1. Move active non-Stripe orgs to past_due when paid_until has passed
    const { data: expiredOrgs, error: expiredError } = await (admin
      .from('organizations') as any)
      .select('id, name, membership_paid_until')
      .eq('membership_status', 'active')
      .neq('payment_method', 'stripe_recurring')
      .not('membership_paid_until', 'is', null)
      .lt('membership_paid_until', now)

    if (expiredError) {
      logger.error('Failed to query expired orgs', { error: expiredError.message })
    } else if (expiredOrgs && expiredOrgs.length > 0) {
      for (const org of expiredOrgs) {
        const graceDate = new Date(org.membership_paid_until)
        graceDate.setDate(graceDate.getDate() + 3)

        await (admin.from('organizations') as any)
          .update({
            membership_status: 'past_due',
            membership_grace_until: graceDate.toISOString(),
          })
          .eq('id', org.id)

        logger.info(`Org ${org.name} (${org.id}) moved to past_due — grace until ${graceDate.toISOString()}`)
      }
      logger.info(`Moved ${expiredOrgs.length} org(s) to past_due`)
    }

    // 2. Suspend past_due non-Stripe orgs after grace period expires
    const { data: graceExpiredOrgs, error: graceError } = await (admin
      .from('organizations') as any)
      .select('id, name')
      .eq('membership_status', 'past_due')
      .neq('payment_method', 'stripe_recurring')
      .not('membership_grace_until', 'is', null)
      .lt('membership_grace_until', now)

    if (graceError) {
      logger.error('Failed to query grace-expired orgs', { error: graceError.message })
    } else if (graceExpiredOrgs && graceExpiredOrgs.length > 0) {
      for (const org of graceExpiredOrgs) {
        await (admin.from('organizations') as any)
          .update({
            membership_status: 'suspended',
            account_status: 'locked',
            account_locked_at: now,
            account_lock_reason: 'Membership payment overdue — contact AM:PM Media to restore access',
          })
          .eq('id', org.id)

        logger.info(`Org ${org.name} (${org.id}) suspended — grace period expired`)
      }
      logger.info(`Suspended ${graceExpiredOrgs.length} org(s) after grace period`)
    }

    return {
      movedToPastDue: expiredOrgs?.length || 0,
      suspended: graceExpiredOrgs?.length || 0,
    }
  },
})
