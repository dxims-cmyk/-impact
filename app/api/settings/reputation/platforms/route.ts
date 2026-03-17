// app/api/settings/reputation/platforms/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const addPlatformSchema = z.object({
  platform: z.enum(['google', 'facebook', 'trustpilot', 'tripadvisor', 'yelp']),
  review_url: z.string().url(),
})

// GET /api/settings/reputation/platforms - List active platforms
export async function GET(): Promise<NextResponse> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  const { data: platforms } = await supabase
    .from('review_platforms')
    .select('*')
    .eq('organization_id', userData.organization_id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  return NextResponse.json({ platforms: platforms || [] })
}

// POST /api/settings/reputation/platforms - Add a platform
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase2 = createAdminClient()
  const { data: userData } = await adminSupabase2
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  if (userData.role !== 'owner' && userData.role !== 'admin') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json()
  const validation = addPlatformSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten(),
    }, { status: 400 })
  }

  // Check for duplicate active platform
  const { data: existing } = await supabase
    .from('review_platforms')
    .select('id')
    .eq('organization_id', userData.organization_id)
    .eq('platform', validation.data.platform)
    .eq('is_active', true)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Platform already configured' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('review_platforms')
    .insert({
      organization_id: userData.organization_id,
      platform: validation.data.platform,
      review_url: validation.data.review_url,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ platform: data })
}
