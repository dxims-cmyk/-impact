-- ============================================
-- REPUTATION MANAGEMENT TABLES
-- ============================================

-- Review platforms configured per org
CREATE TABLE IF NOT EXISTS review_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'google', 'facebook', 'trustpilot', 'tripadvisor', 'yelp'
  review_url TEXT NOT NULL, -- Direct link to leave a review
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_platforms_org ON review_platforms(organization_id);

ALTER TABLE review_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_platforms_org_isolation" ON review_platforms
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Review requests sent
CREATE TABLE IF NOT EXISTS review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  review_url TEXT NOT NULL,
  sent_via TEXT NOT NULL, -- 'email', 'whatsapp', 'sms'
  sent_at TIMESTAMPTZ DEFAULT now(),
  clicked_at TIMESTAMPTZ, -- Track if they clicked the link
  review_received BOOLEAN DEFAULT false,
  review_rating INT, -- 1-5 if we can track it
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_requests_org ON review_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_lead ON review_requests(lead_id);

ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_requests_org_isolation" ON review_requests
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Reputation settings per org (JSONB column on organizations)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS reputation_settings JSONB DEFAULT '{
  "enabled": false,
  "trigger_stage": "won",
  "delay_hours": 48,
  "send_via": ["email"],
  "email_subject": "How was your experience?",
  "email_message": "Hi {{name}}, thank you for choosing us! We would love to hear about your experience. Please take a moment to leave us a review.",
  "whatsapp_message": "Hi {{name}}! Thanks for choosing us. Wed really appreciate a quick review: {{review_link}}",
  "sms_message": "Thanks for choosing us {{name}}! Leave a review: {{review_link}}",
  "max_requests_per_lead": 1
}';
