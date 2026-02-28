-- Migration: Two-Factor Authentication
-- Date: 2026-02-28

-- ============================================
-- 1. Add two_factor_enabled to users
-- ============================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT TRUE;

-- ============================================
-- 2. Create otp_codes table
-- ============================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_email_code
  ON otp_codes(email, code);

-- Index for cleanup of expired codes
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at
  ON otp_codes(expires_at);

-- Enable RLS
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by send-otp/verify-otp APIs)
-- No user-facing policies needed since these APIs use service role key

-- Allow service role full access (bypasses RLS automatically)
-- But add a policy for safety
CREATE POLICY "Service role manages OTP codes"
  ON otp_codes FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. Auto-cleanup expired OTP codes (optional cron)
-- ============================================
-- Run manually or via pg_cron if available:
-- DELETE FROM otp_codes WHERE expires_at < NOW();
