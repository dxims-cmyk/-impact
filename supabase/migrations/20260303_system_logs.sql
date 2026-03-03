-- System logs table for tracking errors, warnings, and events across all orgs
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'critical')),
  category TEXT NOT NULL, -- 'webhook', 'email', 'whatsapp', 'sync', 'billing', 'auth'
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_system_logs_org ON system_logs(organization_id);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_created ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_category ON system_logs(category);

-- RLS: admin-only read access
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency users can view all system logs" ON system_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_agency_user = true)
  );

-- Service role can insert (for webhooks/background jobs)
CREATE POLICY "Service role can insert system logs" ON system_logs
  FOR INSERT WITH CHECK (true);

-- Auto-cleanup: delete logs older than 90 days (optional, can be run via cron)
-- DELETE FROM system_logs WHERE created_at < now() - interval '90 days';
