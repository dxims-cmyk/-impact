// app/api/team/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateMemberSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']),
})

// PATCH /api/team/[id] - Update team member role
export async function PATCH(
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

  // Get user's org and role
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
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
  const validation = updateMemberSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  // Verify target user is in same org
  const { data: targetUser } = await adminSupabase
    .from('users')
    .select('id, organization_id, role')
    .eq('id', id)
    .single()

  if (!targetUser || targetUser.organization_id !== userData.organization_id) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Can't change owner role
  if (targetUser.role === 'owner') {
    return NextResponse.json({ error: 'Cannot change owner role' }, { status: 403 })
  }

  // Update role
  const { data: member, error } = await adminSupabase
    .from('users')
    .update({ role: validation.data.role })
    .eq('id', id)
    .select('id, email, full_name, avatar_url, role')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(member)
}

// DELETE /api/team/[id] - Remove team member
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

  // Get user's org and role
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

  // Can't remove yourself
  if (id === user.id) {
    return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
  }

  // Verify target user is in same org
  const { data: targetUser } = await adminSupabase2
    .from('users')
    .select('id, organization_id, role')
    .eq('id', id)
    .single()

  if (!targetUser || targetUser.organization_id !== userData.organization_id) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Can't remove owner
  if (targetUser.role === 'owner') {
    return NextResponse.json({ error: 'Cannot remove owner' }, { status: 403 })
  }

  // Remove from organization (set org to null)
  const { error } = await adminSupabase2
    .from('users')
    .update({ organization_id: null, role: 'member' })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
