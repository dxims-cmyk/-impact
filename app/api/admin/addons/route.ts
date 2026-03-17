// app/api/admin/addons/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const grantSchema = z.object({
  organizationId: z.string().uuid(),
  addonKey: z.enum(['ai_receptionist', 'outbound_leads']),
})

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from('users')
    .select('is_agency_user')
    .eq('id', user.id)
    .single() as { data: { is_agency_user: boolean } | null }

  if (!data?.is_agency_user) return null
  return user
}

// POST — grant addon
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()
  const user = await requireAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = grantSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { organizationId, addonKey } = parsed.data
  const admin = createAdminClient()

  const { data: existing } = await (admin as any)
    .from('account_addons')
    .select('id, status')
    .eq('organization_id', organizationId)
    .eq('addon_key', addonKey)
    .single()

  if (existing) {
    await (admin as any)
      .from('account_addons')
      .update({ status: 'active', granted_by: user.id })
      .eq('id', existing.id)
  } else {
    await (admin as any)
      .from('account_addons')
      .insert({
        organization_id: organizationId,
        addon_key: addonKey,
        status: 'active',
        granted_by: user.id,
      })
  }

  return NextResponse.json({ granted: true })
}

// DELETE — revoke addon
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()
  const user = await requireAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = grantSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { organizationId, addonKey } = parsed.data
  const admin = createAdminClient()

  await (admin as any)
    .from('account_addons')
    .update({ status: 'cancelled' })
    .eq('organization_id', organizationId)
    .eq('addon_key', addonKey)

  return NextResponse.json({ revoked: true })
}
