-- Simplified Account Add-ons System
DO $$ BEGIN
  CREATE TYPE addon_key AS ENUM ('outbound_leads', 'ai_receptionist');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE addon_status AS ENUM ('active', 'cancelled', 'past_due');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS account_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  addon_key addon_key NOT NULL,
  stripe_subscription_id TEXT,
  status addon_status NOT NULL DEFAULT 'active',
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, addon_key)
);

CREATE INDEX IF NOT EXISTS idx_account_addons_org ON account_addons(organization_id);
CREATE INDEX IF NOT EXISTS idx_account_addons_status ON account_addons(status);

ALTER TABLE account_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org addons" ON account_addons
  FOR SELECT USING (organization_id = get_user_org_id() OR is_agency_user());

CREATE POLICY "Agency users manage all addons" ON account_addons
  FOR ALL USING (is_agency_user());
