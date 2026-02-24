-- Migration 003: Automations backend + Form builder config
-- Adds: automations, automation_actions, automation_runs tables
-- Adds: form_config column on organizations

-- 1. Automations table
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE automations ADD CONSTRAINT automations_trigger_type_check
    CHECK (trigger_type IN ('lead_created', 'lead_scored', 'lead_qualified', 'appointment_booked', 'appointment_cancelled', 'form_submitted', 'tag_added'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_automations_org ON automations(organization_id);
CREATE INDEX IF NOT EXISTS idx_automations_trigger ON automations(organization_id, trigger_type, is_active);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automations_org_isolation" ON automations
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
    UNION
    SELECT organization_id FROM users WHERE id = auth.uid() AND is_agency_user = true
  ));

-- 2. Automation actions table
CREATE TABLE IF NOT EXISTS automation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}',
  action_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE automation_actions ADD CONSTRAINT automation_actions_type_check
    CHECK (action_type IN ('send_email', 'send_whatsapp', 'send_sms', 'send_slack', 'add_tag', 'assign_user', 'create_task', 'wait', 'webhook'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_automation_actions_automation ON automation_actions(automation_id, action_order);

ALTER TABLE automation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_actions_via_automation" ON automation_actions
  FOR ALL USING (automation_id IN (SELECT id FROM automations));

-- 3. Automation run logs
CREATE TABLE IF NOT EXISTS automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error TEXT,
  metadata JSONB DEFAULT '{}'
);

DO $$ BEGIN
  ALTER TABLE automation_runs ADD CONSTRAINT automation_runs_status_check
    CHECK (status IN ('running', 'completed', 'failed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_automation_runs_automation ON automation_runs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_lead ON automation_runs(lead_id);

ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_runs_via_automation" ON automation_runs
  FOR ALL USING (automation_id IN (SELECT id FROM automations));

-- 4. Form config on organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS form_config JSONB DEFAULT '{
  "fields": [
    {"id": "name", "label": "Full Name", "type": "text", "required": true, "enabled": true},
    {"id": "email", "label": "Email", "type": "email", "required": true, "enabled": true},
    {"id": "phone", "label": "Phone", "type": "tel", "required": false, "enabled": true},
    {"id": "company", "label": "Company", "type": "text", "required": false, "enabled": false},
    {"id": "message", "label": "Message", "type": "textarea", "required": false, "enabled": false}
  ],
  "appearance": {
    "title": "Get in Touch",
    "subtitle": "We will get back to you within 24 hours",
    "buttonText": "Get Started",
    "accentColor": "#E8642C",
    "darkMode": false
  },
  "behavior": {
    "successMessage": "Thanks! We will be in touch soon.",
    "redirectUrl": null,
    "successDisplaySeconds": 5,
    "enableRecaptcha": false
  },
  "embed": {
    "type": "inline",
    "width": "full"
  }
}';
