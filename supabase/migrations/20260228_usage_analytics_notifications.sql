-- Migration: Usage Analytics + Notification Preferences
-- Date: 2026-02-28

-- ============================================
-- 1. Create usage_metrics table
-- ============================================
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Page view counters
  views_dashboard INT DEFAULT 0,
  views_leads INT DEFAULT 0,
  views_conversations INT DEFAULT 0,
  views_calendar INT DEFAULT 0,
  views_campaigns INT DEFAULT 0,
  views_reports INT DEFAULT 0,
  views_automations INT DEFAULT 0,
  views_settings INT DEFAULT 0,
  views_gallery INT DEFAULT 0,
  views_calls INT DEFAULT 0,

  -- Action counters
  leads_created INT DEFAULT 0,
  leads_updated INT DEFAULT 0,
  messages_sent INT DEFAULT 0,
  appointments_created INT DEFAULT 0,
  automations_triggered INT DEFAULT 0,
  reports_generated INT DEFAULT 0,
  forms_submitted INT DEFAULT 0,

  -- Feature adoption flags
  uses_whatsapp BOOLEAN DEFAULT FALSE,
  uses_sms BOOLEAN DEFAULT FALSE,
  uses_email BOOLEAN DEFAULT FALSE,
  uses_instagram BOOLEAN DEFAULT FALSE,
  uses_messenger BOOLEAN DEFAULT FALSE,
  uses_automations BOOLEAN DEFAULT FALSE,
  uses_forms BOOLEAN DEFAULT FALSE,
  uses_calendar BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, date)
);

-- Index for querying by org and date range
CREATE INDEX IF NOT EXISTS idx_usage_metrics_org_date
  ON usage_metrics(organization_id, date DESC);

-- Enable RLS
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Agency users can see all metrics
CREATE POLICY "Agency users can view all usage metrics"
  ON usage_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_agency_user = TRUE
    )
  );

-- Org users can see their own metrics
CREATE POLICY "Org users can view own usage metrics"
  ON usage_metrics FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE users.id = auth.uid()
    )
  );

-- Insert/update allowed for authenticated users (own org only)
CREATE POLICY "Users can insert own usage metrics"
  ON usage_metrics FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "Users can update own usage metrics"
  ON usage_metrics FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE users.id = auth.uid()
    )
  );

-- ============================================
-- 2. Create increment_usage_metric RPC function
-- ============================================
CREATE OR REPLACE FUNCTION increment_usage_metric(
  p_org_id UUID,
  p_date DATE,
  p_column TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  allowed_columns TEXT[] := ARRAY[
    'views_dashboard', 'views_leads', 'views_conversations', 'views_calendar',
    'views_campaigns', 'views_reports', 'views_automations', 'views_settings',
    'views_gallery', 'views_calls',
    'leads_created', 'leads_updated', 'messages_sent', 'appointments_created',
    'automations_triggered', 'reports_generated', 'forms_submitted'
  ];
BEGIN
  -- Validate column name to prevent SQL injection
  IF NOT (p_column = ANY(allowed_columns)) THEN
    RAISE EXCEPTION 'Invalid column name: %', p_column;
  END IF;

  -- Upsert: insert row if not exists, then increment the column
  INSERT INTO usage_metrics (organization_id, date)
  VALUES (p_org_id, p_date)
  ON CONFLICT (organization_id, date) DO NOTHING;

  EXECUTE format(
    'UPDATE usage_metrics SET %I = COALESCE(%I, 0) + 1 WHERE organization_id = $1 AND date = $2',
    p_column, p_column
  ) USING p_org_id, p_date;
END;
$$;

-- ============================================
-- 3. Add notification_preferences to users
-- ============================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}'::jsonb;
