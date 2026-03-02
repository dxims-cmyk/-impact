import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const statusSchema = z.object({
  status: z.enum(['active', 'locked', 'suspended']),
  reason: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if admin/agency user
  const { data: userData } = await supabase
    .from('users')
    .select('is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.is_agency_user) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await req.json()
  const validation = statusSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid status. Must be "active", "locked", or "suspended"' }, { status: 400 })
  }

  const { status, reason } = validation.data
  const { id } = await params

  const isLocking = status !== 'active'

  const { data, error } = await supabase
    .from('organizations')
    .update({
      account_status: status,
      account_locked_at: isLocking ? new Date().toISOString() : null,
      account_lock_reason: isLocking ? (reason || null) : null,
      account_locked_by: isLocking ? user.id : null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, organization: data })
}
