// app/api/integrations/xero/connect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getXeroAuthUrl } from '@/lib/integrations/xero'

// GET /api/integrations/xero/connect - Redirect to Xero OAuth
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Get user's org
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.redirect(new URL('/dashboard/integrations?error=no_organization', request.url))
  }

  // Build auth URL with state embedded
  const authUrl = getXeroAuthUrl(userData.organization_id)

  return NextResponse.redirect(authUrl)
}
