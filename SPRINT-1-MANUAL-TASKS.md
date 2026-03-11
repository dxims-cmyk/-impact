# Sprint 1: Automations Overhaul — Manual Tasks

## Already Done (Code Changes)

1. **Fixed email field mismatch** — `run-automation.ts` now accepts both `body` (from UI) and `html_body` (legacy)
2. **Added template variable substitution** — `{{lead_name}}`, `{{lead_email}}`, `{{lead_phone}}`, `{{lead_company}}`, `{{lead_score}}`, `{{lead_temperature}}`, `{{lead_source}}` now all work in email subject/body, WhatsApp, SMS, Slack, and task descriptions
3. **Added config UI for assign_user** — now has a team member email field with explanation
4. **Added config UI for create_task** — now has a task description textarea with variable support
5. **Removed dead triggers** — `appointment_booked`, `appointment_cancelled`, `tag_added` removed from builder and API (they were never triggered anywhere in the codebase)
6. **Added inline help descriptions** — every trigger now shows what it does and when it fires
7. **Added personalization variable buttons** — click-to-copy variable chips under every message/email textarea
8. **Added plan gating** — Core users see a banner saying automations require Growth+, "New Automation" button disabled for Core
9. **Added sidebar minPlan** — Automations nav item now gated to Growth tier
10. **Added run history** — each automation card now has a "View runs" link showing status, errors, and timestamps
11. **Created runs API** — `GET /api/automations/[id]/runs` returns last 20 runs

## Manual Tasks for You

### 1. Run SQL Migration (Supabase SQL Editor)
The 3-tier plan constraint is already fixed (you ran it). But verify the `automation_runs` table exists:

```sql
SELECT COUNT(*) FROM automation_runs;
```

If it errors, you may need to create it:

```sql
CREATE TABLE IF NOT EXISTS automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES automations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_runs_automation ON automation_runs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_started ON automation_runs(started_at);

ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_runs_org_isolation" ON automation_runs;
CREATE POLICY "automation_runs_org_isolation" ON automation_runs
  FOR ALL USING (automation_id IN (
    SELECT id FROM automations WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));
```

### 2. Deploy to Vercel
After I commit the changes, push to trigger auto-deploy:
```bash
git push origin master
```

### 3. Test the Automations Page
1. **As admin (AM:PM Media, Pro plan)** — verify you can create automations, see all triggers, use variable buttons
2. **As Test Core Client** — verify you see the Growth plan banner and can't create new automations
3. **Create a test automation:**
   - Trigger: Lead Created
   - Action 1: Send Email with `Hi {{lead_name}}, thanks for reaching out!` in the body
   - Action 2: Add Tag "auto-welcome"
   - Save and activate
4. **Create a manual lead** to trigger it, then check the run history on the automation card

### 4. Premetheon Beta Feedback
Let your friend Kaysea know the automations page has been overhauled:
- Every trigger now has a description explaining what it does
- Dead/broken triggers have been removed
- Variable personalization actually works now
- Run history shows if automations succeeded or failed

### 5. Future Sprint Items (Not in This Sprint)
These are noted but deferred:
- Wire up `appointment_booked` trigger from calendar (needs Cal.com webhook handler)
- Wire up `tag_added` trigger from lead tag updates
- Add retry button for failed automation runs
- Add Twilio status webhook for SMS delivery tracking
- Add WhatsApp delivery receipt parsing
- Fix lead form website/location fields being dropped
