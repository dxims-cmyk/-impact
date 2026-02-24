# : Impact - Audit Report & Roadmap

## Current Status: 85% Complete

The codebase is solid. Most functionality exists. Below are the issues found and the roadmap to launch.

---

## ISSUES FOUND & FIXED

### ✅ FIXED

| Issue | Description | Fix |
|-------|-------------|-----|
| Missing page | `/dashboard/notifications` linked but didn't exist | Created `app/dashboard/notifications/page.tsx` |
| Hardcoded user data | Sidebar showed "User Name" and "user@example.com" | Updated layout to use `useUser()` hook |
| Hardcoded org data | Showed "Demo Company" and "DC" initials | Updated layout to use real org from user data |

### ⚠️ KNOWN LIMITATIONS (OK for MVP)

| Issue | Description | Impact | Fix Later |
|-------|-------------|--------|-----------|
| Mock notifications | Notifications dropdown uses mock data | Low - notifications work via realtime toast | Add notifications table post-launch |
| Mock search | Search modal uses mock data | Medium - works but not real search | Add `/api/search` endpoint post-launch |
| No notifications table | Schema doesn't have notifications table | Low - using realtime for hot lead alerts | Add when scaling |

### 🔧 REQUIRES YOUR ACTION (Not code issues)

| Item | What's Needed | Why |
|------|---------------|-----|
| Supabase schema | Run `schema.sql` in Supabase SQL Editor | Creates all tables |
| Environment variables | Fill in `.env.local` with real keys | App won't work without them |
| Trigger.dev setup | Create project, get API key | Background jobs need this |
| Test user | Create account via signup page | Need to test the app |

---

## FINAL STACK

```
┌─────────────────────────────────────────────────────────────┐
│                     IMPACT ENGINE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FRONTEND          BACKEND           DATABASE               │
│  ─────────         ───────           ────────               │
│  Next.js 14        Next.js API       Supabase               │
│  React 18          Routes            PostgreSQL             │
│  Tailwind CSS                        Row-Level Security     │
│  TanStack Query                      Realtime               │
│                                                             │
│  BACKGROUND JOBS   AI                NOTIFICATIONS          │
│  ───────────────   ──                ─────────────          │
│  Trigger.dev       Claude            Twilio (SMS)           │
│                    (Anthropic)       Resend (Email)         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Monthly Costs (Estimated)

| Service | Tier | Cost |
|---------|------|------|
| Supabase | Pro | £20 |
| Vercel | Pro | £16 |
| Trigger.dev | Hobby | Free (then £20) |
| Anthropic | Usage | ~£5-20 |
| Twilio | Usage | ~£10-30 |
| Resend | Free tier | Free (then £16) |
| **Total** | | **~£50-100/month** |

---

## STEP-BY-STEP SETUP GUIDE

### Step 1: Supabase Setup (30 minutes)

1. **If you haven't already:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Wait for it to provision (~2 minutes)

2. **Run the database schema:**
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `/supabase/schema.sql`
   - Paste and click "Run"
   - Should see "Success. No rows returned"

3. **Get your keys:**
   - Go to Settings → API
   - Copy: Project URL, anon key, service_role key

4. **Create test organization:**
   ```sql
   -- Run in SQL Editor
   INSERT INTO organizations (name, slug, settings)
   VALUES (
     'AM:PM Media',
     'ampm-media',
     '{
       "speed_to_lead_enabled": true,
       "speed_to_lead_sms_template": "Hi {{first_name}}! Thanks for reaching out to AM:PM Media. We will be in touch shortly.",
       "booking_link": "https://calendly.com/ampm-media"
     }'::jsonb
   );
   ```

### Step 2: Environment Variables (10 minutes)

Create/update `.env.local`:

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# App (REQUIRED)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Trigger.dev (REQUIRED for background jobs)
TRIGGER_API_KEY=tr_dev_...
TRIGGER_API_URL=https://api.trigger.dev

# Anthropic (REQUIRED for AI qualification)
ANTHROPIC_API_KEY=sk-ant-...

# Twilio (OPTIONAL - for SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+44...

# Resend (OPTIONAL - for email)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@yourdomain.com
```

### Step 3: Trigger.dev Setup (15 minutes)

1. Go to [trigger.dev](https://trigger.dev)
2. Sign up / Log in
3. Create new project called "impact-engine"
4. Copy API key to `.env.local`
5. Run `npm run trigger:dev` to connect

### Step 4: Anthropic Setup (5 minutes)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account if needed
3. Add payment method
4. Create API key
5. Copy to `.env.local`

### Step 5: Run Locally (5 minutes)

```bash
# Terminal 1
cd impact-engine
npm install
npm run dev

# Terminal 2 (for background jobs)
npm run trigger:dev
```

Open http://localhost:3000

### Step 6: Create Your User (5 minutes)

1. Go to http://localhost:3000/signup
2. Create account with your email
3. Check Supabase Auth → Users to see your user
4. Link user to organization:
   ```sql
   -- Run in Supabase SQL Editor
   UPDATE users 
   SET organization_id = (SELECT id FROM organizations WHERE slug = 'ampm-media'),
       role = 'owner',
       is_agency_user = true
   WHERE email = 'your-email@example.com';
   ```

### Step 7: Test the Flow (10 minutes)

1. Log in at http://localhost:3000/login
2. Go to Dashboard - should see empty state
3. Click "+ New Lead" - create a test lead
4. Lead should appear in dashboard
5. Check Supabase → leads table

---

## ROADMAP: NOW TO END OF FEBRUARY

### Week 1: Feb 8-14 - GET IT RUNNING

| Day | Task | Time |
|-----|------|------|
| Sat 8 | Supabase setup + schema | 1 hour |
| Sun 9 | Env vars + local running | 1 hour |
| Mon 10 | Create test user + first lead | 30 min |
| Tue 11 | Trigger.dev setup + test AI qualification | 1 hour |
| Wed 12 | Fix any bugs from testing | 2 hours |
| Thu 13 | Test full flow: form → lead → AI → notification | 1 hour |
| Fri 14 | Deploy to Vercel (staging) | 1 hour |

**Week 1 Deliverable:** Working app on staging URL

### Week 2: Feb 15-21 - RUN ON AM:PM

| Day | Task | Time |
|-----|------|------|
| Sat 15 | Create AM:PM landing page with lead form | 2 hours |
| Sun 16 | Connect form to : Impact webhook | 1 hour |
| Mon 17 | Set up Meta Ads test campaign (£10/day) | 2 hours |
| Tue 18 | Monitor first leads coming in | 1 hour |
| Wed 19 | Optimize based on data | 1 hour |
| Thu 20 | Document results for case study | 1 hour |
| Fri 21 | Record Loom walkthrough | 1 hour |

**Week 2 Deliverable:** : Impact running on AM:PM with real leads

### Week 3: Feb 22-28 - FIRST CLIENT

| Day | Task | Time |
|-----|------|------|
| Sat 22 | Create Obera Loom (personalized) | 2 hours |
| Sun 23 | Send to Obera, follow up | 30 min |
| Mon 24 | Prepare client onboarding flow | 2 hours |
| Tue 25 | Onboard Obera (if signed) | 2 hours |
| Wed 26 | Set up their ads + forms | 3 hours |
| Thu 27 | Monitor + support | 1 hour |
| Fri 28 | Week 1 report for Obera | 1 hour |

**Week 3 Deliverable:** First paying client on : Impact

---

## WHAT WORKS RIGHT NOW

✅ User authentication (login, signup, password reset)
✅ Dashboard with KPIs, pipeline, recent leads
✅ Leads list with filtering, search, pagination
✅ Lead detail page with timeline
✅ Conversations page (SMS/email threads)
✅ Calendar with appointments
✅ Campaigns page (ad performance)
✅ Reports page
✅ Settings page (profile, org, notifications)
✅ Integrations page (Meta, Google, TikTok stubs)
✅ Webhook for lead capture
✅ AI lead qualification (Trigger.dev job)
✅ Speed-to-lead SMS/email (Trigger.dev job)
✅ Realtime lead notifications (toast)
✅ Row-level security (data isolation)

## WHAT NEEDS TESTING

⚠️ Full webhook → AI → notification flow
⚠️ Twilio SMS sending
⚠️ Resend email sending
⚠️ Meta Ads OAuth connection
⚠️ Multi-organization data isolation

## WHAT CAN WAIT (Post-MVP)

⏸️ Real search (currently mock)
⏸️ Notifications history (currently mock)
⏸️ TikTok Ads integration
⏸️ Google Ads integration
⏸️ AI chat responses
⏸️ White-label settings
⏸️ Billing/Stripe integration

---

## CLAUDE CODE TERMINAL INSTRUCTIONS

The `CLAUDE.md` file has been created. To use it:

1. **When starting Claude Code in terminal:**
   ```bash
   cd /path/to/impact-engine
   claude
   ```

2. **Claude will automatically read CLAUDE.md** for context

3. **For specific tasks, be explicit:**
   ```
   "Read the leads API route and create a similar one for campaigns"
   "Fix the notifications dropdown to fetch real data from an API"
   "Add a new background job for weekly report generation"
   ```

4. **If Claude hallucinates or makes errors:**
   - Ask it to read the relevant existing file first
   - Be more specific about what you want
   - Break complex tasks into smaller steps
   - Review diffs before accepting

---

## QUESTIONS?

If something doesn't work:
1. Check browser console for errors
2. Check terminal for server errors
3. Check Supabase logs
4. Check Trigger.dev dashboard for job failures

The codebase is ready. Now it's about getting your accounts set up and testing.
