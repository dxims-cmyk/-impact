-- Stripe subscription billing: add subscription ID column and expand status constraint

-- Add stripe_subscription_id column
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Drop old subscription_status check constraint and add expanded one
-- The old constraint only allowed: active, past_due, cancelled
-- We need to also allow: cancelling, incomplete, incomplete_expired, trialing, unpaid
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_subscription_status_check;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_subscription_status_check
  CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'cancelling', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid'));
