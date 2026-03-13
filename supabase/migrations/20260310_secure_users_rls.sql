-- ============================================================
-- CRITICAL SECURITY FIX: Prevent privilege escalation via users table
-- ============================================================
--
-- VULNERABILITY: The "Users can update their own profile" policy
-- allowed ANY column update on the users table, including:
--   - is_agency_user (grants full platform admin access)
--   - role (escalate from member/viewer to owner)
--   - organization_id (switch to another org's data)
--
-- IMPACT: Any authenticated user could run a single Supabase call
-- to grant themselves full agency admin access to ALL organizations.
--
-- FIX: Replace with column-restricted policy using WITH CHECK
-- that prevents sensitive field changes.
-- ============================================================

-- 1. Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- 2. Drop + recreate column-restricted UPDATE policy
DROP POLICY IF EXISTS "Users can update their own safe fields" ON users;
CREATE POLICY "Users can update their own safe fields" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    is_agency_user IS NOT DISTINCT FROM (SELECT u.is_agency_user FROM users u WHERE u.id = auth.uid())
    AND role IS NOT DISTINCT FROM (SELECT u.role FROM users u WHERE u.id = auth.uid())
    AND organization_id IS NOT DISTINCT FROM (SELECT u.organization_id FROM users u WHERE u.id = auth.uid())
  );

-- 3. Secure INSERT policy — prevent users creating admin accounts via direct insert
DROP POLICY IF EXISTS "Users can insert" ON users;
DROP POLICY IF EXISTS "Only non-agency inserts allowed" ON users;
CREATE POLICY "Only non-agency inserts allowed" ON users
  FOR INSERT
  WITH CHECK (
    is_agency_user = false
  );

-- 4. Explicit agency users management policy
DROP POLICY IF EXISTS "Agency users can manage users" ON users;
DROP POLICY IF EXISTS "Agency users can manage all users" ON users;
CREATE POLICY "Agency users can manage all users" ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.is_agency_user = true
    )
  );
