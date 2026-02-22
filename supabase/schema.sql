-- Impact Engine Database Schema
-- Run this in Supabase SQL Editor or as a migration

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Organizations (your clients)
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  settings jsonb default '{}',
  subscription_tier text default 'launch' check (subscription_tier in ('launch', 'grow', 'scale')),
  subscription_status text default 'active' check (subscription_status in ('active', 'past_due', 'cancelled')),
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Users (client team members + your team)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  organization_id uuid references organizations(id) on delete set null,
  is_agency_user boolean default false,
  created_at timestamptz default now()
);

-- Leads
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  
  -- Contact info
  email text,
  phone text,
  first_name text,
  last_name text,
  company text,
  
  -- Pipeline
  stage text default 'new' check (stage in ('new', 'qualified', 'contacted', 'booked', 'won', 'lost')),
  score integer check (score >= 1 and score <= 10),
  temperature text check (temperature in ('hot', 'warm', 'cold')),
  
  -- Attribution
  source text,
  source_detail jsonb,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  
  -- AI analysis
  ai_summary text,
  buying_signals text[],
  objections text[],
  recommended_action text,
  
  -- Ownership
  assigned_to uuid references users(id) on delete set null,
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  qualified_at timestamptz,
  contacted_at timestamptz,
  booked_at timestamptz,
  converted_at timestamptz,
  lost_at timestamptz,
  lost_reason text
);

-- Lead Activities (timeline)
create table if not exists lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade not null,
  organization_id uuid references organizations(id) on delete cascade not null,
  
  type text not null,
  direction text check (direction in ('inbound', 'outbound')),
  channel text check (channel in ('email', 'sms', 'whatsapp', 'call', 'manychat')),
  
  subject text,
  content text,
  metadata jsonb,
  
  performed_by uuid references users(id) on delete set null,
  is_automated boolean default false,
  
  created_at timestamptz default now()
);

-- Conversations (threaded messaging)
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade not null,
  organization_id uuid references organizations(id) on delete cascade not null,
  channel text not null check (channel in ('email', 'sms', 'whatsapp')),
  status text default 'open' check (status in ('open', 'closed', 'snoozed')),
  last_message_at timestamptz,
  unread_count integer default 0,
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  organization_id uuid references organizations(id) on delete cascade not null,
  
  direction text not null check (direction in ('inbound', 'outbound')),
  content text not null,
  
  status text default 'pending' check (status in ('pending', 'sent', 'delivered', 'read', 'failed')),
  external_id text,
  error_message text,
  
  is_ai_generated boolean default false,
  ai_confidence float,
  
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Appointments
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete set null,
  organization_id uuid references organizations(id) on delete cascade not null,
  
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  timezone text default 'Europe/London',
  
  status text default 'scheduled' check (status in ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  
  google_event_id text,
  outlook_event_id text,
  
  reminder_sent_24h boolean default false,
  reminder_sent_1h boolean default false,
  
  created_at timestamptz default now(),
  cancelled_at timestamptz,
  cancel_reason text
);

-- ============================================
-- INTEGRATIONS & ADS
-- ============================================

-- Integrations
create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  
  provider text not null check (provider in ('meta_ads', 'google_ads', 'tiktok_ads', 'manychat')),
  status text default 'pending' check (status in ('pending', 'connected', 'error', 'disconnected')),
  
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  
  account_id text,
  account_name text,
  metadata jsonb,
  
  last_sync_at timestamptz,
  sync_error text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ad Campaigns
create table if not exists ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  integration_id uuid references integrations(id) on delete cascade not null,
  
  platform text not null check (platform in ('meta', 'google', 'tiktok')),
  external_id text not null,
  name text not null,
  status text,
  
  objective text,
  budget_daily numeric,
  budget_lifetime numeric,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(integration_id, external_id)
);

-- Ad Performance (daily snapshots)
create table if not exists ad_performance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  campaign_id uuid references ad_campaigns(id) on delete cascade not null,
  
  date date not null,
  
  impressions integer default 0,
  clicks integer default 0,
  spend numeric default 0,
  leads integer default 0,
  conversions integer default 0,
  revenue numeric default 0,
  
  -- Computed columns
  ctr numeric generated always as (
    case when impressions > 0 then clicks::numeric / impressions else 0 end
  ) stored,
  cpc numeric generated always as (
    case when clicks > 0 then spend / clicks else 0 end
  ) stored,
  cpl numeric generated always as (
    case when leads > 0 then spend / leads else 0 end
  ) stored,
  roas numeric generated always as (
    case when spend > 0 then revenue / spend else 0 end
  ) stored,
  
  created_at timestamptz default now(),
  
  unique(campaign_id, date)
);

-- ============================================
-- REPORTS
-- ============================================

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  
  report_type text default 'weekly' check (report_type in ('weekly', 'monthly', 'custom')),
  period_start date not null,
  period_end date not null,
  
  metrics jsonb not null,
  
  ai_summary text,
  ai_recommendations text[],
  
  sent_at timestamptz,
  pdf_url text,
  
  created_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index if not exists idx_leads_org_stage on leads(organization_id, stage);
create index if not exists idx_leads_org_created on leads(organization_id, created_at desc);
create index if not exists idx_leads_phone on leads(phone);
create index if not exists idx_leads_email on leads(email);
create index if not exists idx_lead_activities_lead on lead_activities(lead_id, created_at desc);
create index if not exists idx_messages_conversation on messages(conversation_id, created_at desc);
create index if not exists idx_ad_performance_org_date on ad_performance(organization_id, date desc);
create index if not exists idx_appointments_org_time on appointments(organization_id, start_time);
create index if not exists idx_conversations_lead on conversations(lead_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table organizations enable row level security;
alter table users enable row level security;
alter table leads enable row level security;
alter table lead_activities enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table appointments enable row level security;
alter table integrations enable row level security;
alter table ad_campaigns enable row level security;
alter table ad_performance enable row level security;
alter table reports enable row level security;

-- Helper function to get user's org
create or replace function get_user_org_id()
returns uuid as $$
  select organization_id from users where id = auth.uid()
$$ language sql security definer;

-- Helper function to check if user is agency
create or replace function is_agency_user()
returns boolean as $$
  select coalesce(
    (select is_agency_user from users where id = auth.uid()),
    false
  )
$$ language sql security definer;

-- Organizations policies
create policy "Users can view their org"
  on organizations for select
  using (id = get_user_org_id() or is_agency_user());

create policy "Agency users can manage orgs"
  on organizations for all
  using (is_agency_user());

-- Users policies
create policy "Users can view users in their org"
  on users for select
  using (organization_id = get_user_org_id() or is_agency_user());

create policy "Users can update their own profile"
  on users for update
  using (id = auth.uid());

-- Leads policies
create policy "Users can view leads in their org"
  on leads for select
  using (organization_id = get_user_org_id() or is_agency_user());

create policy "Users can insert leads in their org"
  on leads for insert
  with check (organization_id = get_user_org_id() or is_agency_user());

create policy "Users can update leads in their org"
  on leads for update
  using (organization_id = get_user_org_id() or is_agency_user());

create policy "Users can delete leads in their org"
  on leads for delete
  using (organization_id = get_user_org_id() or is_agency_user());

-- Lead activities policies
create policy "Users can view activities in their org"
  on lead_activities for select
  using (organization_id = get_user_org_id() or is_agency_user());

create policy "Users can create activities in their org"
  on lead_activities for insert
  with check (organization_id = get_user_org_id() or is_agency_user());

-- Conversations policies
create policy "Users can view conversations in their org"
  on conversations for select
  using (organization_id = get_user_org_id() or is_agency_user());

create policy "Users can manage conversations in their org"
  on conversations for all
  using (organization_id = get_user_org_id() or is_agency_user());

-- Messages policies
create policy "Users can view messages in their org"
  on messages for select
  using (organization_id = get_user_org_id() or is_agency_user());

create policy "Users can send messages in their org"
  on messages for insert
  with check (organization_id = get_user_org_id() or is_agency_user());

-- Appointments policies
create policy "Users can view appointments in their org"
  on appointments for select
  using (organization_id = get_user_org_id() or is_agency_user());

create policy "Users can manage appointments in their org"
  on appointments for all
  using (organization_id = get_user_org_id() or is_agency_user());

-- Integrations policies
create policy "Users can view integrations in their org"
  on integrations for select
  using (organization_id = get_user_org_id() or is_agency_user());

create policy "Admins can manage integrations"
  on integrations for all
  using (
    is_agency_user() or 
    (organization_id = get_user_org_id() and 
     exists (select 1 from users where id = auth.uid() and role in ('owner', 'admin')))
  );

-- Ad campaigns policies
create policy "Users can view campaigns in their org"
  on ad_campaigns for select
  using (organization_id = get_user_org_id() or is_agency_user());

-- Ad performance policies
create policy "Users can view performance in their org"
  on ad_performance for select
  using (organization_id = get_user_org_id() or is_agency_user());

-- Reports policies
create policy "Users can view reports in their org"
  on reports for select
  using (organization_id = get_user_org_id() or is_agency_user());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update timestamp trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to relevant tables
create trigger update_organizations_updated_at
  before update on organizations
  for each row execute function update_updated_at();

create trigger update_leads_updated_at
  before update on leads
  for each row execute function update_updated_at();

create trigger update_integrations_updated_at
  before update on integrations
  for each row execute function update_updated_at();

create trigger update_ad_campaigns_updated_at
  before update on ad_campaigns
  for each row execute function update_updated_at();

-- Increment function for unread counts
create or replace function increment(row_id uuid, field text)
returns integer as $$
declare
  current_val integer;
begin
  execute format('select %I from conversations where id = $1', field)
    into current_val using row_id;
  return coalesce(current_val, 0) + 1;
end;
$$ language plpgsql;

-- ============================================
-- SEED DATA (for development)
-- ============================================

-- Uncomment to seed a test organization
/*
insert into organizations (name, slug, settings)
values (
  'Demo Company',
  'demo-company',
  '{
    "speed_to_lead_enabled": true,
    "speed_to_lead_sms_template": "Hi {{first_name}}! Thanks for reaching out. We will be in touch shortly.",
    "ai_auto_reply_enabled": true,
    "booking_link": "https://calendly.com/demo-company"
  }'::jsonb
);
*/
