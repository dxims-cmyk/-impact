// app/api/integrations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/integrations/[id]
export async function GET(
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

  // Get user's org for filtering
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  const { data: integration, error } = await supabase
    .from('integrations')
    .select('id, provider, status, account_name, account_id, last_sync_at, sync_error, metadata, created_at')
    .eq('id', id)
    .eq('organization_id', userData.organization_id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(integration)
}

// DELETE /api/integrations/[id] - Disconnect integration
export async function DELETE(
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

  // Get user's role
  const adminSupabase2 = createAdminClient()
  const { data: userData } = await adminSupabase2
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

  // Update integration status (soft disconnect)
  const { error } = await supabase
    .from('integrations')
    .update({
      status: 'disconnected',
      access_token: null,
      refresh_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', userData.organization_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
