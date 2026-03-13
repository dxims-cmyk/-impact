-- ============================================================
-- AI Receptionist: Call outcome tracking columns
-- ============================================================

-- Add outcome column (hot/warm/cold qualification from AI call)
ALTER TABLE calls ADD COLUMN IF NOT EXISTS outcome TEXT
  CHECK (outcome IN ('hot', 'warm', 'cold'));

-- Add action_taken column (what happened during the call)
ALTER TABLE calls ADD COLUMN IF NOT EXISTS action_taken TEXT
  CHECK (action_taken IN ('transferred', 'booked', 'ended', 'voicemail', 'no_answer'));

-- Index for filtering calls by outcome
CREATE INDEX IF NOT EXISTS idx_calls_outcome ON calls(organization_id, outcome)
  WHERE outcome IS NOT NULL;
