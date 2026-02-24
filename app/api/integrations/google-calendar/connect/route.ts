// app/api/integrations/google-calendar/connect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGoogleCalendarAuthUrl } from '@/lib/integrations/google-calendar'
import crypto from 'crypto'

// GET /api/integrations/google-calendar/connect - Redirect to Google Calendar OAuth
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Get user's org
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.redirect(new URL('/dashboard/integrations?error=no_organization', request.url))
  }

  // Generate state token
  const state = crypto.randomBytes(32).toString('hex')
  const statePayload = Buffer.from(JSON.stringify({
    orgId: userData.organization_id,
    token: state,
    timestamp: Date.now(),
  })).toString('base64')

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-calendar/callback`
  const authUrl = getGoogleCalendarAuthUrl(redirectUri)

  // Append state
  const url = new URL(authUrl)
  url.searchParams.set('state', statePayload)

  return NextResponse.redirect(url.toString())
}
