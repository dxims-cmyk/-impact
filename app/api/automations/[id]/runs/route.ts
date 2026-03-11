// app/api/automations/[id]/runs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Verify automation belongs to user's org
  const { data: automation } = await supabase
    .from('automations')
    .select('id')
    .eq('id', id)
    .eq('organization_id', userData.organization_id)
    .single()

  if (!automation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Fetch recent runs (last 20)
  const { data: runs, error } = await supabase
    .from('automation_runs')
    .select('id, status, started_at, completed_at, error')
    .eq('automation_id', id)
    .order('started_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ runs: runs || [] })
}
