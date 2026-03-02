-- Account lockout feature: allow agency admin to lock/suspend client organizations
ALTER TABLE organizations
  ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'locked', 'suspended')),
  ADD COLUMN account_locked_at TIMESTAMPTZ,
  ADD COLUMN account_lock_reason TEXT,
  ADD COLUMN account_locked_by UUID REFERENCES auth.users(id);
