// app/api/integrations/available/route.ts
// Returns which integrations have platform credentials configured
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type AvailabilityStatus = 'available' | 'coming_soon' | 'env_configured'

interface IntegrationAvailability {
  provider: string
  status: AvailabilityStatus
}

// GET /api/integrations/available
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check which platform credentials are configured server-side
  const availability: IntegrationAvailability[] = [
    // OAuth integrations — available only if WE have the platform app credentials
    {
      provider: 'meta_ads',
      status: (process.env.META_APP_ID && process.env.META_APP_SECRET) ? 'available' : 'coming_soon',
    },
    {
      provider: 'google_ads',
      status: (process.env.GOOGLE_ADS_CLIENT_ID && process.env.GOOGLE_ADS_CLIENT_SECRET) ? 'available' : 'coming_soon',
    },
    {
      provider: 'tiktok_ads',
      status: (process.env.TIKTOK_APP_ID && process.env.TIKTOK_APP_SECRET) ? 'available' : 'coming_soon',
    },
    {
      provider: 'slack',
      status: (process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET) ? 'available' : 'coming_soon',
    },
    {
      provider: 'google_calendar',
      status: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'available' : 'coming_soon',
    },
    // Pre-configured (uses our API keys, not client's)
    { provider: 'whatsapp', status: 'env_configured' },
    { provider: 'resend', status: 'env_configured' },
    // Webhook/API key integrations — always available (client provides their own URL/key)
    { provider: 'zapier', status: 'available' },
    { provider: 'calcom', status: 'available' },
    { provider: 'manychat', status: 'available' },
    // AI features
    {
      provider: 'vapi',
      status: process.env.VAPI_API_KEY ? 'available' : 'coming_soon',
    },
    // Payments & invoicing
    {
      provider: 'stripe',
      status: (process.env.STRIPE_CLIENT_ID && process.env.STRIPE_SECRET_KEY) ? 'available' : 'coming_soon',
    },
    {
      provider: 'calendly',
      status: (process.env.CALENDLY_CLIENT_ID && process.env.CALENDLY_CLIENT_SECRET) ? 'available' : 'coming_soon',
    },
    {
      provider: 'xero',
      status: (process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET) ? 'available' : 'coming_soon',
    },
  ]

  return NextResponse.json(availability)
}
