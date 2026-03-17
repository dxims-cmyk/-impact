// app/api/reports/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/reports/stats - Real chart data for reports page
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id, is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id && !userData?.is_agency_user) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

    // Fetch leads created in the last 30 days (just id, created_at for daily counts)
    let recentQuery = supabase
      .from('leads')
      .select('id, created_at')
      .gte('created_at', thirtyDaysAgoISO)
      .order('created_at', { ascending: true })

    if (!userData.is_agency_user) {
      recentQuery = recentQuery.eq('organization_id', userData.organization_id)
    }

    const { data: recentLeads, error: recentError } = await recentQuery

    if (recentError) {
      return NextResponse.json({ error: recentError.message }, { status: 500 })
    }

    // Fetch all leads with scores for score distribution
    let scoreQuery = supabase
      .from('leads')
      .select('id, score')
      .not('score', 'is', null)

    if (!userData.is_agency_user) {
      scoreQuery = scoreQuery.eq('organization_id', userData.organization_id)
    }

    const { data: scoredLeads, error: scoreError } = await scoreQuery

    if (scoreError) {
      return NextResponse.json({ error: scoreError.message }, { status: 500 })
    }

    // --- Build daily leads chart data ---
    // Create a map of date string -> count
    const dailyMap = new Map<string, number>()

    // Pre-fill all 30 days with 0
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0] // YYYY-MM-DD
      dailyMap.set(key, 0)
    }

    // Count leads per day
    for (const lead of recentLeads || []) {
      const key = new Date(lead.created_at).toISOString().split('T')[0]
      if (dailyMap.has(key)) {
        dailyMap.set(key, (dailyMap.get(key) || 0) + 1)
      }
    }

    // Convert to array with formatted date labels
    const dailyLeads = Array.from(dailyMap.entries()).map(([dateStr, count]) => {
      const d = new Date(dateStr + 'T00:00:00')
      return {
        date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        leads: count,
      }
    })

    // --- Build score distribution data ---
    const buckets = [
      { bucket: '1-3', min: 1, max: 3, count: 0, fill: '#6E0F1A' },
      { bucket: '4-5', min: 4, max: 5, count: 0, fill: '#D4A574' },
      { bucket: '6-7', min: 6, max: 7, count: 0, fill: '#1E3A5F' },
      { bucket: '8-10', min: 8, max: 10, count: 0, fill: '#2D4A3E' },
    ]

    for (const lead of scoredLeads || []) {
      const score = lead.score as number
      for (const bucket of buckets) {
        if (score >= bucket.min && score <= bucket.max) {
          bucket.count++
          break
        }
      }
    }

    const scoreDistribution = buckets.map(({ bucket, count, fill }) => ({
      bucket,
      count,
      fill,
    }))

    return NextResponse.json({
      dailyLeads,
      scoreDistribution,
    })
  } catch (error) {
    console.error('Reports stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch report stats' }, { status: 500 })
  }
}
