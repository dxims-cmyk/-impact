// app/api/addons/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    .single() as { data: { organization_id: string; is_agency_user: boolean } | null }

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Admin can query any org
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('orgId')
  const targetOrgId = (userData.is_agency_user && orgId) ? orgId : userData.organization_id

  const { data, error } = await (supabase as any)
    .from('account_addons')
    .select('*')
    .eq('organization_id', targetOrgId)
    .in('status', ['active', 'past_due'])

  if (error) {
    console.error('Addons fetch error:', error)
    return NextResponse.json([])
  }

  return NextResponse.json(data || [])
}
