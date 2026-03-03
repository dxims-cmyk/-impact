// app/api/leads/nurture/route.ts
// Manual trigger for pipeline nurture — runs for the authenticated user's org
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { nurturePipelineTask } from '@/trigger/jobs/nurture-pipeline'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 })
  }

  // Check nurture is enabled for this org
  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', userData.organization_id)
    .single()

  const settings = org?.settings as Record<string, unknown> | null
  if (!settings?.nurture_enabled) {
    return NextResponse.json(
      { error: 'Pipeline nurture is not enabled. Enable it in Settings.' },
      { status: 400 }
    )
  }

  // Trigger the task
  const handle = await nurturePipelineTask.trigger({
    organizationId: userData.organization_id,
  })

  return NextResponse.json({
    success: true,
    message: 'Pipeline nurture started',
    runId: handle.id,
  })
}
