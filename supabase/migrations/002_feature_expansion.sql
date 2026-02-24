-- Migration: Feature Expansion
-- Adds: calls table, payment fields on leads, AI handling on conversations,
--        new integration providers, indexes, RLS

-- 1. Update integrations provider constraint
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_provider_check;
ALTER TABLE integrations ADD CONSTRAINT integrations_provider_check
  CHECK (provider IN ('meta_ads', 'google_ads', 'tiktok_ads', 'manychat', 'calcom', 'zapier', 'slack', 'google_calendar', 'whatsapp', 'resend', 'twilio', 'vapi', 'stripe', 'calendly', 'xero'));

-- 2. Add payment fields to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'none';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS amount_paid numeric;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS payment_link text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS invoice_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS invoice_status text DEFAULT 'none';

-- Add constraints (only if columns don't already have them)
DO $$ BEGIN
  ALTER TABLE leads ADD CONSTRAINT leads_payment_status_check CHECK (payment_status IN ('none', 'pending', 'paid', 'failed', 'refunded'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE leads ADD CONSTRAINT leads_invoice_status_check CHECK (invoice_status IN ('none', 'draft', 'sent', 'viewed', 'paid'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Add AI handling fields to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_handling text DEFAULT 'off';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_message_count integer DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE conversations ADD CONSTRAINT conversations_ai_handling_check CHECK (ai_handling IN ('off', 'active', 'paused', 'handed_off'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Create calls table
CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,

  vapi_call_id text UNIQUE,
  phone_number text,
  caller_name text,
  direction text DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),

  duration_seconds integer,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'missed')),

  transcript text,
  recording_url text,
  summary text,

  metadata jsonb,

  created_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_calls_org_created ON calls(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_lead ON calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_vapi_id ON calls(vapi_call_id);

-- 6. RLS
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calls in their org"
  ON calls FOR SELECT
  USING (organization_id = get_user_org_id() OR is_agency_user());

CREATE POLICY "Service role can manage calls"
  ON calls FOR ALL
  USING (is_agency_user());
