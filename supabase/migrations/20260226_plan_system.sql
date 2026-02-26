-- ============================================
-- PLAN SYSTEM
-- ============================================

-- Add plan columns to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'core';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_changed_at TIMESTAMPTZ;

-- Plan constraint
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS org_plan_check;
ALTER TABLE organizations ADD CONSTRAINT org_plan_check
  CHECK (plan IN ('core', 'pro'));

-- Plan features reference table
CREATE TABLE IF NOT EXISTS plan_features (
  plan TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly INT NOT NULL,
  features JSONB NOT NULL
);

INSERT INTO plan_features VALUES
('core', ':Impact Core', 1500, '{
  "leads": true,
  "ai_scoring": true,
  "whatsapp_alerts": true,
  "automations": true,
  "integrations": true,
  "calendar": true,
  "reports_basic": true,
  "reports_advanced": false,
  "content_gallery": false,
  "ad_analysis": false,
  "strategy_calls": false,
  "priority_support": false
}'),
('pro', ':Impact Pro', 2500, '{
  "leads": true,
  "ai_scoring": true,
  "whatsapp_alerts": true,
  "automations": true,
  "integrations": true,
  "calendar": true,
  "reports_basic": true,
  "reports_advanced": true,
  "content_gallery": true,
  "ad_analysis": true,
  "strategy_calls": true,
  "priority_support": true
}')
ON CONFLICT (plan) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  features = EXCLUDED.features;

-- ============================================
-- CREATIVES TABLE (for Content Gallery)
-- ============================================

CREATE TABLE IF NOT EXISTS creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image',
  platform TEXT NOT NULL DEFAULT 'meta',
  file_url TEXT,
  thumbnail_url TEXT,
  meta_ad_id TEXT,
  google_ad_id TEXT,
  tiktok_ad_id TEXT,
  campaign_id UUID REFERENCES ad_campaigns(id),

  spend DECIMAL(10,2) DEFAULT 0,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  leads_count INT DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  roas DECIMAL(5,2) DEFAULT 0,

  status TEXT DEFAULT 'active',
  recommendation TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creatives_org ON creatives(organization_id);
CREATE INDEX IF NOT EXISTS idx_creatives_campaign ON creatives(campaign_id);

ALTER TABLE creatives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "creatives_org_isolation" ON creatives;
CREATE POLICY "creatives_org_isolation" ON creatives
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- ============================================
-- LEAD PIPELINE & REVENUE TRACKING
-- ============================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_value DECIMAL(10,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_status TEXT DEFAULT 'open';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_closed_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason TEXT;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_term TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS meta_campaign_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS meta_adset_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS meta_ad_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gclid TEXT;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_stage_check;
ALTER TABLE leads ADD CONSTRAINT leads_stage_check
  CHECK (stage IN ('new', 'contacted', 'qualified', 'appointment', 'proposal', 'won', 'lost'));

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_deal_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_deal_status_check
  CHECK (deal_status IN ('open', 'won', 'lost'));

-- ============================================
-- UPDATE AM:PM TO PRO
-- ============================================

UPDATE organizations SET plan = 'pro' WHERE slug = 'ampm-media';
