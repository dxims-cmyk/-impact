import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Admin emails that should get owner role (configurable via ADMIN_EMAILS env var)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'dxims@mediampm.com').split(',').map(e => e.trim())

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const redirect = searchParams.get('redirect') || '/dashboard'

  const supabase = createClient()
  let user = null

  // Handle PKCE code exchange (OAuth, magic link via PKCE)
  if (code) {
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && sessionData.user) {
      user = sessionData.user
    }
  }

  // Handle token hash verification (magic link / OTP email)
  if (!user && token_hash && type) {
    const { data: sessionData, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    })
    if (!error && sessionData.user) {
      user = sessionData.user
    }
  }

  if (user) {
    // Check if user exists in our users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingUser) {
      // Create organization for new user
      const orgName = user.user_metadata?.full_name
        ? `${user.user_metadata.full_name}'s Organization`
        : `${user.email?.split('@')[0]}'s Organization`

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          slug: user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'org',
          subscription_tier: 'launch',
        })
        .select('id')
        .single()

      if (orgError) {
        console.error('Error creating organization:', orgError)
        return NextResponse.redirect(`${origin}/login?error=org_creation_failed`)
      }

      // Determine role
      const isAdmin = ADMIN_EMAILS.includes(user.email || '')

      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
          role: 'owner',
          organization_id: org.id,
          is_agency_user: isAdmin,
        })

      if (userError) {
        console.error('Error creating user:', userError)
        return NextResponse.redirect(`${origin}/login?error=user_creation_failed`)
      }
    }

    return NextResponse.redirect(`${origin}${redirect}`)
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
