-- Migration: Membership & Payment Tracking System
-- Adds membership lifecycle management and payment history

-- 1. Add membership columns to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS membership_status TEXT NOT NULL DEFAULT 'preview'
    CHECK (membership_status IN ('preview', 'active', 'past_due', 'paused', 'suspended', 'cancelled')),
  ADD COLUMN IF NOT EXISTS payment_method TEXT
    CHECK (payment_method IN ('stripe_recurring', 'card_manual', 'cash', 'bank_transfer') OR payment_method IS NULL),
  ADD COLUMN IF NOT EXISTS membership_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS membership_paid_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS membership_grace_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS membership_paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS membership_cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_months_paid INTEGER NOT NULL DEFAULT 0;

-- 2. Create membership_payments table
CREATE TABLE IF NOT EXISTS membership_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  payment_method TEXT NOT NULL
    CHECK (payment_method IN ('stripe_recurring', 'card_manual', 'cash', 'bank_transfer')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  stripe_invoice_id TEXT,
  reference TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_membership_payments_org ON membership_payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_membership_payments_created ON membership_payments(created_at DESC);

-- 3. RLS policies for membership_payments
ALTER TABLE membership_payments ENABLE ROW LEVEL SECURITY;

-- Agency users can see all payments
CREATE POLICY "Agency users can view all payments"
  ON membership_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_agency_user = true
    )
  );

-- Agency users can insert payments
CREATE POLICY "Agency users can insert payments"
  ON membership_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_agency_user = true
    )
  );

-- Service role can do everything (for webhooks/background jobs)
CREATE POLICY "Service role full access to payments"
  ON membership_payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Client users can view their own payments
CREATE POLICY "Users can view own org payments"
  ON membership_payments FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE users.id = auth.uid()
    )
  );

-- 4. Backfill: Existing orgs with active Stripe subscriptions → membership_status = 'active'
UPDATE organizations
SET
  membership_status = 'active',
  payment_method = 'stripe_recurring',
  membership_started_at = created_at
WHERE stripe_subscription_id IS NOT NULL
  AND subscription_status = 'active';

-- Existing orgs with past_due Stripe → membership_status = 'past_due'
UPDATE organizations
SET
  membership_status = 'past_due',
  payment_method = 'stripe_recurring',
  membership_started_at = created_at
WHERE stripe_subscription_id IS NOT NULL
  AND subscription_status = 'past_due';

-- Existing orgs with cancelled Stripe → membership_status = 'cancelled'
UPDATE organizations
SET
  membership_status = 'cancelled',
  payment_method = 'stripe_recurring',
  membership_started_at = created_at,
  membership_cancelled_at = COALESCE(account_locked_at, now())
WHERE stripe_subscription_id IS NOT NULL
  AND subscription_status = 'cancelled';
