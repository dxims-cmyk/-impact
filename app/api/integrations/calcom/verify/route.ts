// POST /api/integrations/calcom/verify
// Checks Cal.com API to see if our webhook URL is actually configured
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
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

  // Get the org slug to build expected webhook URL
  const { data: org } = await supabase
    .from('organizations')
    .select('slug')
    .eq('id', userData.organization_id)
    .single()

  const expectedUrl = `https://driveimpact.io/api/webhooks/calcom?org_slug=${org?.slug || ''}`

  const calApiKey = process.env.CAL_API_KEY
  if (!calApiKey) {
    return NextResponse.json({ error: 'Cal.com API key not configured' }, { status: 500 })
  }

  try {
    // Cal.com v1 API: list webhooks
    const res = await fetch('https://api.cal.com/v1/webhooks?apiKey=' + calApiKey, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      // Try v2 API format
      const res2 = await fetch('https://api.cal.com/v2/webhooks', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${calApiKey}`,
          'cal-api-version': '2024-08-13',
        },
      })

      if (!res2.ok) {
        return NextResponse.json({
          verified: false,
          reason: 'Could not reach Cal.com API. Please verify manually.',
        })
      }

      const data2 = await res2.json()
      const webhooks2 = data2.data || data2.webhooks || []
      const found2 = webhooks2.some((wh: { subscriberUrl?: string; url?: string }) =>
        (wh.subscriberUrl || wh.url || '').includes('driveimpact.io/api/webhooks/calcom')
      )

      return NextResponse.json({ verified: found2, webhooks: webhooks2.length })
    }

    const data = await res.json()
    const webhooks = data.webhooks || data || []

    // Check if any webhook URL contains our calcom endpoint
    const found = Array.isArray(webhooks) && webhooks.some((wh: { subscriberUrl?: string; url?: string }) =>
      (wh.subscriberUrl || wh.url || '').includes('driveimpact.io/api/webhooks/calcom')
    )

    return NextResponse.json({ verified: found, webhooks: Array.isArray(webhooks) ? webhooks.length : 0 })
  } catch (err) {
    console.error('Cal.com verify error:', err)
    return NextResponse.json({
      verified: false,
      reason: 'Could not verify Cal.com webhook. Please verify manually.',
    })
  }
}
