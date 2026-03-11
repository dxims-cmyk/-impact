import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

  const { plan } = await req.json()

  if (!['core', 'growth', 'pro'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan. Must be "core", "growth", or "pro"' }, { status: 400 })
  }

  const { id } = await params

  // Update organization plan
  const { data, error } = await supabase
    .from('organizations')
    .update({
      plan,
      plan_changed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, organization: data })
}
