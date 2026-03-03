// app/api/settings/organization/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateOrgSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  logo_url: z.string().url().optional().nullable(),
  settings: z.record(z.unknown()).optional(),
})

// GET /api/settings/organization - Get organization
export async function GET(request: NextRequest) {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org + agency flag
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, role, is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id && !userData?.is_agency_user) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Agency users can view another org's details via ?org= param (read-only)
  const requestedOrg = request.nextUrl.searchParams.get('org')
  const targetOrgId = (userData.is_agency_user && requestedOrg) ? requestedOrg : userData.organization_id

  const { data: organization, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', targetOrgId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(organization)
}

// PATCH /api/settings/organization - Update organization
export async function PATCH(request: NextRequest) {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org and role
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Check permissions
  if (userData.role !== 'owner' && userData.role !== 'admin') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  // Parse and validate body
  const body = await request.json()
  const validation = updateOrgSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  // Merge settings if provided
  let updates = { ...validation.data, updated_at: new Date().toISOString() }

  if (validation.data.settings) {
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', userData.organization_id)
      .single()

    updates.settings = {
      ...(currentOrg?.settings as Record<string, unknown> || {}),
      ...validation.data.settings,
    }
  }

  const { data: organization, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', userData.organization_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(organization)
}
