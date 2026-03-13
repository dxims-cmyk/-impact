-- ============================================================
-- Outbound Leads: Google Places prospecting via Apify
-- ============================================================

CREATE TABLE IF NOT EXISTS outbound_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Business info from Google Places
  business_name TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  address TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  category TEXT,
  place_id TEXT,

  -- Outreach tracking
  status TEXT DEFAULT 'to_call' CHECK (status IN ('to_call', 'called', 'interested', 'booked', 'closed', 'dead')),
  notes TEXT,

  -- Search metadata
  search_term TEXT,
  search_location TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_outbound_leads_org ON outbound_leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_outbound_leads_status ON outbound_leads(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_outbound_leads_created ON outbound_leads(organization_id, created_at DESC);

-- RLS
ALTER TABLE outbound_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "outbound_leads_org_isolation" ON outbound_leads;
CREATE POLICY "outbound_leads_org_isolation" ON outbound_leads
  FOR ALL USING (
    organization_id = get_user_org_id() OR is_agency_user()
  );

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_outbound_leads_updated_at ON outbound_leads;
CREATE TRIGGER update_outbound_leads_updated_at
  BEFORE UPDATE ON outbound_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
