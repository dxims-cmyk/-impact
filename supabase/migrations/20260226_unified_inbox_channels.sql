-- Migration: Add Instagram DM and Messenger channels to conversations
-- Run this in Supabase SQL Editor

-- 1. Expand conversations.channel to include new channels
-- First, remove the existing constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_channel_check;

-- Add new constraint with all channels
ALTER TABLE conversations ADD CONSTRAINT conversations_channel_check
  CHECK (channel IN ('email', 'sms', 'whatsapp', 'instagram_dm', 'messenger'));

-- 2. Expand lead_activities.channel to include new channels
ALTER TABLE lead_activities DROP CONSTRAINT IF EXISTS lead_activities_channel_check;

ALTER TABLE lead_activities ADD CONSTRAINT lead_activities_channel_check
  CHECK (channel IS NULL OR channel IN ('email', 'sms', 'whatsapp', 'call', 'manychat', 'instagram_dm', 'messenger'));

-- 3. Add deal_value column to leads if not exists
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_value DECIMAL(12,2) DEFAULT NULL;

-- 4. Add metadata column to messages if not exists (for email subject, attachments, etc.)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- 5. Create index for faster conversation lookups by channel
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_channel ON conversations(lead_id, channel);

-- 6. Create index for lead source_detail JSONB lookups (Instagram/Messenger ID matching)
CREATE INDEX IF NOT EXISTS idx_leads_source_detail ON leads USING GIN(source_detail);

-- 7. RLS policies for conversations - ensure instagram_dm and messenger channels work
-- (Existing RLS policies should already work since they filter by organization_id, not channel)

-- 8. Verify: Run these queries to confirm
-- SELECT DISTINCT channel FROM conversations;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'deal_value';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'metadata';
