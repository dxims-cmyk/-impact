-- Migration: 3-Tier Plan System (Core / Growth / Pro)
-- Core: £1,500/mo — basic features
-- Growth: £2,000/mo — Core + Vapi AI receptionist, calls, advanced automations
-- Pro: £2,500/mo — Growth + gallery, content creation, reputation management

-- Update plan constraint to include growth
-- Drop both possible constraint names (original was org_plan_check)
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS org_plan_check;
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;
ALTER TABLE organizations ADD CONSTRAINT org_plan_check
  CHECK (plan IN ('core', 'growth', 'pro'));

-- Insert growth tier (plan_features has: plan, name, price_monthly, features)
INSERT INTO plan_features (plan, name, price_monthly, features)
VALUES ('growth', ':Impact Growth', 2000, '{
  "leads": true,
  "ai_scoring": true,
  "whatsapp_alerts": true,
  "automations": true,
  "integrations": true,
  "calendar": true,
  "reports_basic": true,
  "vapi_receptionist": true,
  "calls_page": true,
  "call_recordings": true,
  "advanced_automations": true,
  "reports_advanced": false,
  "content_gallery": false,
  "reputation_management": false,
  "content_creation": false,
  "ad_analysis": false,
  "strategy_calls": false,
  "priority_support": false
}'::jsonb)
ON CONFLICT (plan) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  features = EXCLUDED.features;

-- Update core features to be explicit
UPDATE plan_features SET
  name = ':Impact Core',
  price_monthly = 1500,
  features = '{
  "leads": true,
  "ai_scoring": true,
  "whatsapp_alerts": true,
  "automations": true,
  "integrations": true,
  "calendar": true,
  "reports_basic": true,
  "vapi_receptionist": false,
  "calls_page": false,
  "call_recordings": false,
  "advanced_automations": false,
  "reports_advanced": false,
  "content_gallery": false,
  "reputation_management": false,
  "content_creation": false,
  "ad_analysis": false,
  "strategy_calls": false,
  "priority_support": false
}'::jsonb
WHERE plan = 'core';

-- Update pro features (everything enabled)
UPDATE plan_features SET
  name = ':Impact Pro',
  price_monthly = 2500,
  features = '{
  "leads": true,
  "ai_scoring": true,
  "whatsapp_alerts": true,
  "automations": true,
  "integrations": true,
  "calendar": true,
  "reports_basic": true,
  "vapi_receptionist": true,
  "calls_page": true,
  "call_recordings": true,
  "advanced_automations": true,
  "reports_advanced": true,
  "content_gallery": true,
  "reputation_management": true,
  "content_creation": true,
  "ad_analysis": true,
  "strategy_calls": true,
  "priority_support": true
}'::jsonb
WHERE plan = 'pro';
