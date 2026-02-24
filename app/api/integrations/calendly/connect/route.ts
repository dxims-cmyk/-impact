// app/api/integrations/calendly/connect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCalendlyAuthUrl } from '@/lib/integrations/calendly'

// GET /api/integrations/calendly/connect - Redirect to Calendly OAuth
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
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=no_organization', request.url)
    )
  }

  const authUrl = getCalendlyAuthUrl(userData.organization_id)

  return NextResponse.redirect(authUrl)
}
