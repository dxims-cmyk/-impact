// app/api/integrations/xero/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { exchangeXeroCode, getTenants } from '@/lib/integrations/xero'
import { encryptTokens } from '@/lib/encryption'

// GET /api/integrations/xero/callback - Handle Xero OAuth callback
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=${error}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=missing_params', request.url)
    )
  }

  // Decode state
  let stateData: { orgId: string; token: string; timestamp: number }
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64').toString())
  } catch {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=invalid_state', request.url)
    )
  }

  // Validate timestamp (15 min expiry)
  if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=state_expired', request.url)
    )
  }

  const supabase = createClient()

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify user belongs to the org in state
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id || userData.organization_id !== stateData.orgId) {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=org_mismatch', request.url)
    )
  }

  try {
    // Exchange authorization code for tokens
    const tokens = await exchangeXeroCode(code)

    // Fetch connected tenants (Xero orgs)
    const tenants = await getTenants(tokens.access_token)

    if (tenants.length === 0) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=xero_no_tenants', request.url)
      )
    }

    // Use the first tenant (most small businesses have one)
    const tenant = tenants[0]
    const expiresAt = Date.now() + tokens.expires_in * 1000

    // Check for existing Xero integration
    const { data: existing } = await supabase
      .from('integrations')
      .select('id')
      .eq('organization_id', stateData.orgId)
      .eq('provider', 'xero')
      .single()

    const encrypted = encryptTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    })

    const integrationData = {
      organization_id: stateData.orgId,
      provider: 'xero' as const,
      status: 'connected' as const,
      access_token: encrypted.access_token,
      refresh_token: encrypted.refresh_token,
      account_id: tenant.tenantId,
      account_name: tenant.tenantName,
      metadata: {
        tenant_id: tenant.tenantId,
        tenant_name: tenant.tenantName,
        tenant_type: tenant.tenantType,
        expires_at: expiresAt,
      },
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      await supabase
        .from('integrations')
        .update(integrationData)
        .eq('id', existing.id)
    } else {
      await supabase
        .from('integrations')
        .insert(integrationData)
    }

    // Update org settings with Xero connection info
    const { data: org } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', stateData.orgId)
      .single()

    const currentSettings = (org?.settings as Record<string, unknown>) || {}

    await supabase
      .from('organizations')
      .update({
        settings: {
          ...currentSettings,
          xero_connected: true,
          xero_tenant_id: tenant.tenantId,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', stateData.orgId)

    return NextResponse.redirect(
      new URL('/dashboard/integrations?connected=xero', request.url)
    )
  } catch (err) {
    console.error('Xero OAuth callback error:', err)
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=xero_oauth_failed', request.url)
    )
  }
}
