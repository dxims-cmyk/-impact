// app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/user - Get current user
export async function GET(request: NextRequest) {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user profile with organization
  const { data: profile, error } = await supabase
    .from('users')
    .select(`
      *,
      organization:organizations(id, name, slug, subscription_tier, subscription_status, settings, logo_url)
    `)
    .eq('id', user.id)
    .single()

  if (error) {
    // User might not exist in users table yet
    if (error.code === 'PGRST116') {
      return NextResponse.json({
        id: user.id,
        email: user.email,
        full_name: null,
        avatar_url: null,
        role: 'member',
        organization_id: null,
        is_agency_user: false,
        organization: null,
      })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(profile)
}
