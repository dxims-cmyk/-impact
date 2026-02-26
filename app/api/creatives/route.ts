import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('org')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user belongs to this org (or is agency user)
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.is_agency_user && userData?.organization_id !== orgId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const targetOrg = orgId || userData?.organization_id

  const { data: creatives, error } = await supabase
    .from('creatives')
    .select('*')
    .eq('organization_id', targetOrg)
    .order('roas', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ creatives })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if admin
  const { data: userData } = await supabase
    .from('users')
    .select('is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.is_agency_user) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await req.json()

  const { data, error } = await supabase
    .from('creatives')
    .insert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ creative: data }, { status: 201 })
}
