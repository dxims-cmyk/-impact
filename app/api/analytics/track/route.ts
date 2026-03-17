import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: true })
    }

    const adminSupabase = createAdminClient()
    const { data: userData } = await adminSupabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id) {
      return NextResponse.json({ ok: true })
    }

    const body = await req.json()
    const { type, page, action } = body
    const today = new Date().toISOString().split('T')[0]

    if (type === 'page_view' && page) {
      const column = `views_${page}`
      await supabase.rpc('increment_usage_metric', {
        p_org_id: userData.organization_id,
        p_date: today,
        p_column: column
      }).catch(() => {})
    }

    if (type === 'action' && action) {
      const columnMap: Record<string, string> = {
        'lead_created': 'leads_created',
        'lead_updated': 'leads_updated',
        'message_sent': 'messages_sent',
        'appointment_created': 'appointments_created',
        'automation_triggered': 'automations_triggered',
        'report_generated': 'reports_generated',
        'form_submitted': 'forms_submitted'
      }

      const column = columnMap[action]
      if (column) {
        await supabase.rpc('increment_usage_metric', {
          p_org_id: userData.organization_id,
          p_date: today,
          p_column: column
        }).catch(() => {})
      }

      const featureMap: Record<string, string> = {
        'whatsapp_sent': 'uses_whatsapp',
        'sms_sent': 'uses_sms',
        'email_sent': 'uses_email',
        'instagram_sent': 'uses_instagram',
        'messenger_sent': 'uses_messenger',
        'automation_created': 'uses_automations',
        'form_created': 'uses_forms',
        'appointment_created': 'uses_calendar'
      }

      const featureColumn = featureMap[action]
      if (featureColumn) {
        await supabase
          .from('usage_metrics')
          .upsert({
            organization_id: userData.organization_id,
            date: today,
            [featureColumn]: true
          }, {
            onConflict: 'organization_id,date'
          }).catch(() => {})
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
