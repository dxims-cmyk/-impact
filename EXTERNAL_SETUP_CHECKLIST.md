# External Services Setup Checklist

Step-by-step instructions for setting up every external service that Impact Engine depends on. Work through each section in order. After each section, add the listed environment variables to your `.env.local` file.

---

## 1. Meta App Review (Facebook / Instagram Ads + Lead Gen)

**Console URL:** <https://developers.facebook.com/apps/>

**App ID:** `2112568086226869` (already created)

### Current Status
- Meta App created and configured
- Webhook subscription for `leadgen` is working in dev mode
- WhatsApp Cloud API is sending messages via the `hello_world` template
- Lead gen form submissions are arriving through `/api/webhooks/lead-form`
- **Needs App Review** to work with non-admin Facebook Pages in production

### Permissions to Request
Request each of these in the App Review section:

| Permission | Why Impact Needs It |
|---|---|
| `ads_read` | Pull campaign performance data (impressions, clicks, spend) into the dashboard |
| `leads_retrieval` | Receive real-time lead form submissions from Facebook/Instagram Lead Ads via webhook |
| `pages_show_list` | Let users pick which Facebook Page to connect during onboarding |
| `pages_read_engagement` | Read page-level metrics and verify page ownership |

### What to Write in the Review Submission

For each permission, Meta asks you to explain the use case and provide a screencast. Here is a template for the text portion:

> **ads_read**: Our SaaS platform (Impact Engine by AM:PM Media) is a lead management tool for advertisers. We pull campaign-level metrics -- impressions, clicks, spend, and conversions -- so clients can see ad performance alongside their leads in one dashboard. No data is shared with third parties.
>
> **leads_retrieval**: We subscribe to the `leadgen` webhook on connected Facebook Pages. When a user fills out a Lead Ad form, we instantly receive the form data, run AI qualification, and notify the advertiser within seconds (speed-to-lead). Without this permission, we cannot retrieve the actual field values from the lead form submission.
>
> **pages_show_list**: During onboarding, the user connects their Facebook account. We call `/me/accounts` to show them a list of Pages they manage, so they can select which Page's leads to import. We only store the selected Page ID and access token.
>
> **pages_read_engagement**: We verify page ownership and read basic engagement data to display alongside lead metrics. This ensures advertisers are connecting a Page they actually manage.

Attach a short screencast (< 2 min) for each permission showing the flow inside your app. Use Loom or a screen recorder.

### Estimated Approval Time
1-5 business days. Simple data-read permissions are typically approved in 1-2 days.

### Env Vars (already set)
```
META_APP_ID=2112568086226869
META_APP_SECRET=<your-app-secret>
META_WEBHOOK_VERIFY_TOKEN=<your-verify-token>
```

### Post-Approval Steps
1. Switch the app from Development to Live mode in the Meta dashboard.
2. Verify that the webhook subscription remains active after going live.
3. Test a real lead form submission from a non-admin user.

---

## 2. Google Cloud Console -- Calendar API

**Console URL:** <https://console.cloud.google.com/>

### Step-by-Step

1. **Create or select a project**
   - Go to <https://console.cloud.google.com/projectselector2/home/dashboard>
   - Create a new project named `Impact Engine` (or use an existing one).

2. **Enable the Google Calendar API**
   - Go to **APIs & Services > Library**
   - Search for **Google Calendar API**
   - Click **Enable**

3. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth client ID**
   - Application type: **Web application**
   - Name: `Impact Engine`
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/integrations/google-calendar/callback
     https://yourdomain.com/api/integrations/google-calendar/callback
     ```
   - Click **Create**. Copy the Client ID and Client Secret.

4. **Configure the OAuth Consent Screen**
   - Go to **APIs & Services > OAuth consent screen**
   - User type: **External** (unless you only need internal G Suite users)
   - App name: `Impact Engine`
   - Support email: your email
   - Scopes: click **Add or Remove Scopes** and add:
     ```
     https://www.googleapis.com/auth/calendar.events
     ```
   - Save and continue. While in "Testing" mode, add your own Google account as a test user.

### Estimated Approval Time
**Instant.** No review needed while the app is in "Testing" mode (up to 100 test users). If you publish the app for all Google users, Google reviews it in 2-6 weeks, but you likely only need internal/testing access.

### Env Vars to Set
```
GOOGLE_CALENDAR_CLIENT_ID=<from-step-3>
GOOGLE_CALENDAR_CLIENT_SECRET=<from-step-3>
```

### Post-Setup Steps
1. Build the OAuth callback route at `/api/integrations/google-calendar/callback`.
2. Store refresh tokens per user/org in the `integrations` table (encrypted with `ENCRYPTION_KEY`).
3. Use the Calendar API to create events when a lead books an appointment.

---

## 3. Google Cloud Console -- Ads API

**Console URL:** <https://console.cloud.google.com/>
**Developer Token URL:** <https://ads.google.com/aw/apicenter>

### Step-by-Step

1. **Enable the Google Ads API** (same project as Calendar, or a new one)
   - Go to **APIs & Services > Library**
   - Search for **Google Ads API**
   - Click **Enable**

2. **Create OAuth 2.0 Credentials** (or reuse the Calendar credentials)
   - Go to **APIs & Services > Credentials**
   - If you already created a Web Application client for Calendar, you can reuse it -- just add the additional redirect URI:
     ```
     http://localhost:3000/api/integrations/google/callback
     https://yourdomain.com/api/integrations/google/callback
     ```
   - If creating new credentials, follow the same steps as Section 2, Step 3.

3. **Add OAuth Scopes**
   - On the OAuth consent screen, add these scopes:
     ```
     https://www.googleapis.com/auth/adwords
     ```
   - The codebase (`lib/integrations/google-ads.ts`) uses the `adwords` scope for full read access.

4. **Apply for a Google Ads Developer Token**
   - Go to <https://ads.google.com/aw/apicenter> (you must be logged in to a Google Ads Manager account)
   - Click **Apply for access**
   - Fill out the form:
     - Describe your app: "Impact Engine is a lead management SaaS that imports campaign performance data (impressions, clicks, spend, conversions) from Google Ads so advertisers can view ad performance alongside their leads."
     - Access level: **Basic Access** (read-only, up to 15,000 operations/day -- plenty for our use case)
   - Copy the developer token shown on the page.

### Estimated Approval Time
- **Test account access**: Instant (token works immediately against test accounts).
- **Basic access**: 1-3 business days.
- **Standard access** (only if you need write operations): up to 2 weeks.

### Env Vars to Set
```
GOOGLE_ADS_CLIENT_ID=<oauth-client-id>
GOOGLE_ADS_CLIENT_SECRET=<oauth-client-secret>
GOOGLE_ADS_DEVELOPER_TOKEN=<from-api-center>
```

These env vars are already referenced in `lib/integrations/google-ads.ts` and `.env.example`.

### Post-Setup Steps
1. Connect a Google Ads account through the Integrations page -- the OAuth flow redirects to `/api/integrations/google/callback`.
2. Verify that `getAccessibleCustomers()` returns ad account IDs.
3. Verify campaign sync works by triggering a manual sync from the Integrations page.

---

## 4. TikTok Business API

**Registration URL:** <https://business-api.tiktok.com/portal/register>

### Step-by-Step

1. **Register a TikTok for Business developer account**
   - Go to <https://business-api.tiktok.com/portal/register>
   - Fill in your business details. Use AM:PM Media company info.

2. **Create an App**
   - Once registered, go to **My Apps > Create an App**
   - App name: `Impact Engine`
   - Set the redirect URI:
     ```
     http://localhost:3000/api/integrations/tiktok/callback
     https://yourdomain.com/api/integrations/tiktok/callback
     ```

3. **Request Permissions**
   - Under your app settings, request these scopes:

   | Scope | Why |
   |---|---|
   | `advertiser.read` | Read advertiser account info |
   | `campaign.read` | Read campaign data (name, status, budget) |
   | `report.read` | Pull performance metrics (impressions, clicks, spend, conversions) |

   These match what the codebase uses in `lib/integrations/tiktok-ads.ts` (line 42: `scope: 'advertiser.read,campaign.read,report.read'`).

4. **Submit for Review**
   - TikTok requires a description of your app and how you use the data.
   - Description template: "Impact Engine is a lead management SaaS for digital advertising agencies. We import campaign-level performance data (impressions, clicks, spend, conversions) from TikTok Ads so clients can monitor ad performance alongside their CRM leads in one dashboard. No data is modified or shared with third parties."
   - You may need to provide a screencast of your integration flow.

### Estimated Approval Time
3-5 business days. TikTok reviews are generally slower than Meta.

### Env Vars to Set
```
TIKTOK_APP_ID=<from-app-dashboard>
TIKTOK_APP_SECRET=<from-app-dashboard>
```

These env vars are already referenced in `lib/integrations/tiktok-ads.ts` and `.env.example`.

### Post-Setup Steps
1. Connect a TikTok Ads account through the Integrations page.
2. Verify the OAuth callback at `/api/integrations/tiktok/callback` exchanges the code for tokens.
3. Trigger a manual sync and confirm campaigns appear in the dashboard.

---

## 5. Slack App Creation

**URL:** <https://api.slack.com/apps>

### Step-by-Step

1. **Create a New App**
   - Go to <https://api.slack.com/apps> and click **Create New App**
   - Choose **From scratch**
   - App name: `Impact Notifications`
   - Workspace: Select your AM:PM Media / development workspace
   - Click **Create App**

2. **Configure OAuth & Permissions**
   - In the left sidebar, click **OAuth & Permissions**
   - Scroll to **Redirect URLs** and add:
     ```
     http://localhost:3000/api/integrations/slack/callback
     https://yourdomain.com/api/integrations/slack/callback
     ```
   - Scroll to **Bot Token Scopes** and add:

   | Scope | Why |
   |---|---|
   | `chat:write` | Post lead notifications to channels |
   | `channels:read` | List available channels so users can pick where notifications go |
   | `incoming-webhook` | Send messages to a specific channel via webhook URL |

3. **Enable Incoming Webhooks** (optional, simpler alternative to full bot)
   - In the left sidebar, click **Incoming Webhooks**
   - Toggle **Activate Incoming Webhooks** to On
   - Click **Add New Webhook to Workspace** and select a channel
   - Copy the webhook URL

4. **Install to Workspace**
   - Go to **Install App** in the left sidebar
   - Click **Install to Workspace**
   - Authorize the requested permissions
   - Copy the **Bot User OAuth Token** (starts with `xoxb-`)

5. **App Display Settings** (optional but recommended)
   - Go to **Basic Information > Display Information**
   - App icon: Upload the Impact logo
   - Short description: "Real-time lead notifications from Impact Engine"
   - Background color: `#FF4D4D` (Impact red)

### Estimated Approval Time
- **Workspace install: Instant.** No approval needed. As soon as you install to your workspace, it works.
- **Slack App Directory distribution**: Only needed if you plan to distribute the app to other workspaces (e.g., client workspaces). This requires Slack review and takes 1-3 weeks. Not needed for internal use.

### Env Vars to Set
```
SLACK_CLIENT_ID=<from-basic-information-page>
SLACK_CLIENT_SECRET=<from-basic-information-page>
SLACK_SIGNING_SECRET=<from-basic-information-page>
SLACK_BOT_TOKEN=xoxb-<from-install-step>
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../...
```

### Post-Setup Steps
1. Build the OAuth callback route at `/api/integrations/slack/callback` for multi-workspace support.
2. Add Slack notification to the `speed-to-lead` job in `trigger/jobs/speed-to-lead.ts`.
3. Store the bot token per org in the `integrations` table (encrypted with `ENCRYPTION_KEY`).
4. Let users pick their notification channel from the Integrations settings page.

---

## 6. Domain Verification (Resend)

**Status: DONE**

### What Was Completed
- Domain `mediampm.com` is verified in Resend
- DMARC record has been added to DNS
- Sending address configured: `AM:PM Media <noreply@mediampm.com>`
- Email delivery is working (auto-response emails to leads are sent inline from the webhook)

### Env Vars (already set)
```
RESEND_API_KEY=re_<your-key>
RESEND_FROM_EMAIL=AM:PM Media <noreply@mediampm.com>
```

### If You Need to Re-verify or Add Another Domain
1. Go to <https://resend.com/domains>
2. Click **Add Domain**
3. Add the DNS records Resend provides (MX, TXT, CNAME for DKIM)
4. Add a DMARC record: `v=DMARC1; p=none; rua=mailto:dmarc@mediampm.com`
5. Wait for propagation (usually 5-30 minutes)

---

## 7. WhatsApp Business -- Template Approval

**Console URL:** <https://business.facebook.com/wa/manage/message-templates/> (under Meta Business Suite)

### Current Status
- WhatsApp Cloud API is working with the `hello_world` default template
- Phone Number ID: `947102098494334` (already configured)
- Custom template `new_lead_alert` has been submitted and is **pending Meta approval**

### Template: `new_lead_alert`

The template should contain these variables:

| Variable | Maps To |
|---|---|
| `{{1}}` | Lead name (first + last) |
| `{{2}}` | Lead company |
| `{{3}}` | AI score (e.g., "8/10 - Hot") |

Example message body:
```
New lead received!

Name: {{1}}
Company: {{2}}
AI Score: {{3}}

Open your Impact dashboard to view full details and respond.
```

### Estimated Approval Time
Usually 1-24 hours. Meta auto-reviews most transactional/notification templates quickly. Promotional or marketing templates take longer.

### Env Vars (already set)
```
WHATSAPP_PHONE_NUMBER_ID=947102098494334
WHATSAPP_ACCESS_TOKEN=<your-access-token>
```

### Post-Approval Steps

Once Meta approves `new_lead_alert`, update the code in `lib/integrations/whatsapp.ts`:

**File:** `lib/integrations/whatsapp.ts` -- `sendNewLeadAlert` function (around line 136)

Change from:
```typescript
export async function sendNewLeadAlert({
  to,
}: {
  to: string
  leadName?: string
  leadCompany?: string | null
  aiScore?: string | null
}): Promise<{ messageId: string }> {
  return await sendWhatsAppTemplate({
    to,
    templateName: 'hello_world',
    languageCode: 'en_US',
  })
}
```

Change to:
```typescript
export async function sendNewLeadAlert({
  to,
  leadName,
  leadCompany,
  aiScore,
}: {
  to: string
  leadName?: string
  leadCompany?: string | null
  aiScore?: string | null
}): Promise<{ messageId: string }> {
  return await sendWhatsAppTemplate({
    to,
    templateName: 'new_lead_alert',
    languageCode: 'en',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: leadName || 'Unknown' },
          { type: 'text', text: leadCompany || 'N/A' },
          { type: 'text', text: aiScore || 'Pending' },
        ],
      },
    ],
  })
}
```

---

## Quick Reference: All Env Vars by Service

```bash
# --- Already Configured ---

# Meta Ads + WhatsApp
META_APP_ID=2112568086226869
META_APP_SECRET=<secret>
META_WEBHOOK_VERIFY_TOKEN=<token>
WHATSAPP_PHONE_NUMBER_ID=947102098494334
WHATSAPP_ACCESS_TOKEN=<token>

# Twilio (legacy SMS, still used as fallback)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=<token>
TWILIO_PHONE_NUMBER=+447473208905
TWILIO_WHATSAPP_NUMBER=

# Resend (Email)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=AM:PM Media <noreply@mediampm.com>

# Cal.com
CAL_API_KEY=cal_live_...

# --- Needs Setup ---

# Google Ads (Section 3)
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_DEVELOPER_TOKEN=

# Google Calendar (Section 2)
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=

# TikTok Ads (Section 4)
TIKTOK_APP_ID=
TIKTOK_APP_SECRET=

# Slack (Section 5)
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
SLACK_BOT_TOKEN=
SLACK_WEBHOOK_URL=

# Encryption (needed for storing OAuth tokens securely)
ENCRYPTION_KEY=<32-byte-hex-string>
```

Generate the encryption key with:
```bash
openssl rand -hex 32
```

---

## Priority Order

If you are short on time, set up services in this order:

1. **Meta App Review** (Section 1) -- submit now, it takes the longest and blocks production lead gen
2. **WhatsApp template** (Section 7) -- already submitted, just wait and apply the code change
3. **Google Ads API** (Section 3) -- submit developer token request, 1-3 day wait
4. **Slack** (Section 5) -- instant, no approval, high value for client notifications
5. **Google Calendar** (Section 2) -- instant, no approval
6. **TikTok** (Section 4) -- submit app review, 3-5 day wait
7. **Resend / Domain** (Section 6) -- already done
