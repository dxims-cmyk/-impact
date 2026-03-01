-- Add meta_page_id to organizations for Meta webhook routing
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS meta_page_id TEXT;
CREATE INDEX IF NOT EXISTS idx_organizations_meta_page_id ON organizations(meta_page_id);

-- To link your AM:PM org to your Facebook Page, run:
-- UPDATE organizations SET meta_page_id = 'YOUR_FACEBOOK_PAGE_ID' WHERE id = 'd0aab918-77c9-474f-85d3-eb19e31dfb81';
