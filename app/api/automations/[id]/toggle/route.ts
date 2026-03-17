// app/api/automations/[id]/toggle/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// POST /api/automations/[id]/toggle - Toggle automation active state
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Get current automation state
  const { data: automation, error: fetchError } = await supabase
    .from('automations')
    .select('id, is_active')
    .eq('id', id)
    .eq('organization_id', userData.organization_id)
    .single()

  if (fetchError || !automation) {
    if (fetchError?.code === 'PGRST116' || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  // Toggle is_active
  const { data: updated, error: updateError } = await supabase
    .from('automations')
    .update({
      is_active: !automation.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', userData.organization_id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json(updated)
}
