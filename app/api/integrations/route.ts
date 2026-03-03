// app/api/integrations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// GET /api/integrations - List integrations with live verification
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id && !userData?.is_agency_user) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Agency users can view another org's integrations via ?org= param
  const orgParam = request.nextUrl.searchParams.get('org')
  const targetOrgId = (userData.is_agency_user && orgParam) ? orgParam : userData.organization_id

  const { data: integrations, error } = await supabase
    .from('integrations')
    .select('id, provider, status, account_name, account_id, last_sync_at, sync_error, metadata, created_at')
    .eq('organization_id', targetOrgId)
    .order('provider', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Cross-check Zapier: only "connected" if org settings has a real webhook URL
  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', targetOrgId)
    .single()

  const orgSettings = (org?.settings || {}) as Record<string, unknown>
  const enriched = (integrations || []).map(i => {
    if (i.provider === 'zapier' && i.status === 'connected') {
      const hasUrl = typeof orgSettings.zapier_webhook_url === 'string' && orgSettings.zapier_webhook_url.length > 0
      if (!hasUrl) {
        return { ...i, status: 'disconnected', sync_error: 'No webhook URL configured' }
      }
    }
    return i
  })

  return NextResponse.json(enriched)
}

// POST /api/integrations - Register a non-OAuth integration (webhook, api_key, etc.)
const registerSchema = z.object({
  provider: z.enum(['calcom', 'zapier', 'manychat', 'vapi']),
  account_name: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  if (userData.role !== 'owner' && userData.role !== 'admin') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json()
  const validation = registerSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 })
  }

  const { provider, account_name, metadata } = validation.data

  // Upsert: update if exists, create if not
  const { data: existing } = await supabase
    .from('integrations')
    .select('id')
    .eq('organization_id', userData.organization_id)
    .eq('provider', provider)
    .single()

  if (existing) {
    const { data: integration, error } = await supabase
      .from('integrations')
      .update({
        status: 'connected',
        account_name: account_name || null,
        metadata: metadata || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id, provider, status, account_name, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(integration)
  }

  const { data: integration, error } = await supabase
    .from('integrations')
    .insert({
      organization_id: userData.organization_id,
      provider,
      status: 'connected',
      account_name: account_name || null,
      metadata: metadata || null,
    })
    .select('id, provider, status, account_name, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(integration, { status: 201 })
}
