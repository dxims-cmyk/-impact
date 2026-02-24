import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bulkUpdateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  stage: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
})

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 403 })

  const body = await request.json()
  const validation = bulkUpdateSchema.safeParse(body)
  if (!validation.success) return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (validation.data.stage) updates.stage = validation.data.stage
  if (validation.data.assigned_to) updates.assigned_to = validation.data.assigned_to

  const { error } = await supabase
    .from('leads')
    .update(updates)
    .in('id', validation.data.ids)
    .eq('organization_id', userData.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ updated: validation.data.ids.length })
}
