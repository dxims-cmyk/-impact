// app/api/leads/[id]/qualify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { qualifyLead } from '@/lib/ai/claude'

// POST /api/leads/[id]/qualify - Manually trigger AI qualification
export async function POST(
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

  // Get lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  try {
    // Call Claude for qualification
    const qualification = await qualifyLead({
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      source: lead.source,
      utm_campaign: lead.utm_campaign,
      utm_source: lead.utm_source,
    })

    // Update lead with qualification results
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({
        score: qualification.score,
        temperature: qualification.temperature,
        ai_summary: qualification.summary,
        buying_signals: qualification.buying_signals,
        objections: qualification.objections,
        recommended_action: qualification.recommended_action,
        qualified_at: new Date().toISOString(),
        stage: qualification.temperature === 'hot' && lead.stage === 'new' ? 'qualified' : lead.stage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log activity
    await supabase.from('lead_activities').insert({
      lead_id: id,
      organization_id: lead.organization_id,
      type: 'ai_qualified',
      content: qualification.summary,
      metadata: {
        score: qualification.score,
        temperature: qualification.temperature,
        triggered_by: user.id,
      },
      performed_by: user.id,
      is_automated: false,
    })

    return NextResponse.json({
      lead: updatedLead,
      qualification,
    })
  } catch (error) {
    console.error('AI qualification error:', error)
    return NextResponse.json({ error: 'Failed to qualify lead' }, { status: 500 })
  }
}
