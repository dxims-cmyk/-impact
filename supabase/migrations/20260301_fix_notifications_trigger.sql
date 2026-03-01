-- Fix: column "message" of relation "notifications" does not exist
-- This error occurs because a database trigger on "leads" tries to INSERT into
-- "notifications" using a "message" column that doesn't exist (the column is called "body").

-- Step 1: Find the offending trigger(s) on the leads table
-- Run this SELECT first to see what triggers exist:
-- SELECT tgname, tgrelid::regclass, pg_get_triggerdef(oid)
-- FROM pg_trigger
-- WHERE tgrelid = 'leads'::regclass AND NOT tgisinternal;

-- Step 2: Find any functions that reference notifications.message
-- SELECT proname, prosrc
-- FROM pg_proc
-- WHERE prosrc ILIKE '%notifications%' AND prosrc ILIKE '%message%';

-- Step 3: OPTION A — If you find a trigger function, fix it by changing "message" to "body"
-- Example (adjust the function name based on Step 2 results):
-- CREATE OR REPLACE FUNCTION notify_new_lead()
-- RETURNS trigger AS $$
-- BEGIN
--   INSERT INTO notifications (organization_id, type, title, body, metadata)
--   VALUES (
--     NEW.organization_id,
--     'lead',
--     'New lead: ' || COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''),
--     'New lead from ' || COALESCE(NEW.source, 'unknown'),
--     jsonb_build_object('lead_id', NEW.id)
--   );
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: OPTION B — If you want a quick fix, add a "message" column as an alias
-- (NOT recommended long-term, but works immediately)
-- ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message text;

-- Step 4: OPTION C — Drop the trigger entirely (notifications are handled in app code)
-- DROP TRIGGER IF EXISTS on_new_lead_notify ON leads;
-- DROP FUNCTION IF EXISTS notify_new_lead();
