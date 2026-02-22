# : Impact

A custom SaaS client portal for AM:PM Impact, built with Next.js, Supabase, and AI.

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Background Jobs**: Trigger.dev
- **AI**: Claude API (Anthropic)
- **SMS/WhatsApp**: Twilio
- **Email**: Resend
- **Ad Platforms**: Meta, Google, TikTok APIs
- **Hosting**: Vercel

## Quick Start

### 1. Clone and Install

```bash
cd impact-engine
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema:
   ```bash
   # Copy contents of supabase/schema.sql and run in SQL Editor
   ```
3. Get your project URL and keys from Settings > API

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Fill in your credentials:
- Supabase URL and keys
- Anthropic API key
- Twilio credentials
- Resend API key
- Meta/Google app credentials (for OAuth)

### 4. Set Up Trigger.dev

1. Create account at [trigger.dev](https://trigger.dev)
2. Create a new project
3. Add your API key to `.env.local`

```bash
npm run trigger:dev
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
impact-engine/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Main app pages
│   ├── (agency)/          # Agency admin pages
│   ├── (public)/          # Public pages (booking, forms)
│   └── api/               # API routes
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific
│   ├── leads/             # Lead management
│   ├── conversations/     # Messaging UI
│   └── ui/                # Shared UI components
├── lib/                   # Utilities and integrations
│   ├── supabase/          # Database clients
│   ├── ai/                # Claude integration
│   └── integrations/      # Third-party APIs
├── trigger/               # Background jobs
│   └── jobs/              # Job definitions
├── types/                 # TypeScript types
└── supabase/              # Database schema
```

## Key Features

### Lead Management
- Automatic lead capture from forms, ads, ManyChat
- AI qualification scoring (1-10) with temperature tags
- Pipeline visualization and tracking
- Activity timeline

### Messaging
- SMS/WhatsApp via Twilio
- Email via Resend
- AI-powered auto-replies (max 3 turns)
- Conversation threading

### Ad Integration
- Meta Ads sync (campaigns + performance)
- Google Ads sync
- TikTok Ads sync
- Unified performance dashboard

### Automation
- Speed-to-lead (instant SMS on form submit)
- AI lead qualification
- Appointment reminders
- Weekly reports with AI summaries

### Client Portal
- White-labeled per organization
- Real-time dashboard updates
- Self-service report access
- Appointment booking

## API Endpoints

### Leads
- `GET /api/leads` - List leads (paginated, filterable)
- `POST /api/leads` - Create lead
- `GET /api/leads/[id]` - Get lead details
- `PATCH /api/leads/[id]` - Update lead

### Webhooks
- `POST /api/webhooks/lead-form` - Public lead submission
- `POST /api/webhooks/twilio` - Inbound SMS/WhatsApp
- `POST /api/webhooks/manychat` - ManyChat events
- `POST /api/webhooks/meta` - Meta Lead Ads

### Integrations
- `GET /api/integrations` - List connected integrations
- `GET /api/integrations/meta/connect` - Start Meta OAuth
- `POST /api/integrations/[id]/sync` - Manual sync

## Background Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `qualify-lead` | On lead.created | AI qualification |
| `speed-to-lead` | On lead.created | Instant follow-up |
| `ai-conversation` | On message.inbound | AI replies |
| `sync-meta-ads` | Hourly | Sync ad performance |
| `weekly-report` | Monday 7am | Generate reports |

## Deployment

### Vercel

1. Connect your GitHub repo
2. Add environment variables
3. Deploy

### Trigger.dev

1. Connect to your Vercel project
2. Deploy jobs:
   ```bash
   npx trigger.dev@latest deploy
   ```

## Lead Form Integration

Embed on client websites:

```html
<form action="https://your-domain.com/api/webhooks/lead-form" method="POST">
  <input type="hidden" name="org_slug" value="client-slug">
  <input type="text" name="first_name" required>
  <input type="email" name="email" required>
  <input type="tel" name="phone">
  <button type="submit">Get Started</button>
</form>
```

Or via JavaScript:

```javascript
fetch('https://your-domain.com/api/webhooks/lead-form', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    org_slug: 'client-slug',
    email: 'lead@example.com',
    first_name: 'John',
    utm_source: 'google',
    utm_campaign: 'spring-promo'
  })
})
```

## Development Roadmap

### Phase 1: Core (Week 1-2)
- [x] Database schema
- [x] Auth setup
- [x] Lead CRUD
- [x] Pipeline view
- [x] Twilio integration
- [ ] Basic dashboard UI

### Phase 2: Intelligence (Week 3-4)
- [x] AI lead qualification
- [x] AI conversation handler
- [x] Speed-to-lead automation
- [ ] Activity timeline UI

### Phase 3: Integrations (Week 5-6)
- [x] Meta Ads OAuth + sync
- [ ] Google Ads integration
- [ ] ManyChat webhook
- [ ] Unified analytics view

### Phase 4: Polish (Week 7-8)
- [x] Weekly reports
- [ ] PDF generation
- [ ] Client onboarding
- [ ] White-label settings

## License

Proprietary - AM:PM Media
