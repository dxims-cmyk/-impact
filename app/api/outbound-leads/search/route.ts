import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS, DAILY_SCRAPE_LIMIT } from '@/lib/rate-limit'

const searchSchema = z.object({
  searchTerm: z.string().min(1, 'Search term is required'),
  location: z.string().min(1, 'Location is required'),
  count: z.number().min(1).max(DAILY_SCRAPE_LIMIT).default(100),
})

/**
 * Get the number of outbound leads imported today for an org.
 * This is the source of truth — in-memory counters can be bypassed on redeploy.
 */
async function getTodaysImportCount(orgId: string): Promise<number> {
  const supabase = createClient()
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('outbound_leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('created_at', todayStart.toISOString())

  if (error) {
    console.error('Failed to check daily scrape count:', error)
    // Fail closed — deny if we can't verify
    return DAILY_SCRAPE_LIMIT
  }

  return count || 0
}

// POST — start an Apify Google Places crawl
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id, is_agency_user, role')
    .eq('id', user.id)
    .single() as { data: { organization_id: string; is_agency_user: boolean; role: string } | null }

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Only owner/admin or agency users
  if (!userData.is_agency_user && !['owner', 'admin'].includes(userData.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // --- Rate limit: 5 searches per hour per org ---
  const rateKey = `scrape:${userData.organization_id}`
  const rateResult = checkRateLimit(rateKey, RATE_LIMITS.scrape)
  if (!rateResult.success) {
    return NextResponse.json(
      { error: 'Too many searches. Try again later.' },
      { status: 429, headers: rateLimitHeaders(rateResult) }
    )
  }

  const body = await request.json()
  const parsed = searchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { searchTerm, location, count } = parsed.data

  // --- Daily limit: 200 leads per org (DB-enforced, not bypassable) ---
  const todaysCount = await getTodaysImportCount(userData.organization_id)
  const remaining = DAILY_SCRAPE_LIMIT - todaysCount

  if (remaining <= 0) {
    return NextResponse.json(
      { error: `Daily limit of ${DAILY_SCRAPE_LIMIT} leads reached. Resets at midnight UTC.` },
      { status: 429 }
    )
  }

  // Clamp requested count to what's actually available today
  const allowedCount = Math.min(count, remaining)

  const apifyToken = process.env.APIFY_TOKEN
  if (!apifyToken) {
    return NextResponse.json({ error: 'APIFY_TOKEN not configured' }, { status: 500 })
  }

  try {
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${apifyToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchTerms: [searchTerm],
          locationQuery: location,
          maxCrawledPlacesPerSearch: allowedCount,
          language: 'en',
          maxImages: 0,
          maxReviews: 0,
        }),
      }
    )

    if (!startRes.ok) {
      const errText = await startRes.text()
      console.error('Apify start error:', errText)
      return NextResponse.json({ error: 'Failed to start search' }, { status: 502 })
    }

    const runData = await startRes.json()
    const runId = runData.data?.id

    if (!runId) {
      return NextResponse.json({ error: 'No run ID returned from Apify' }, { status: 502 })
    }

    return NextResponse.json({
      runId,
      status: 'RUNNING',
      searchTerm,
      location,
      dailyRemaining: remaining - allowedCount,
      requestedCount: allowedCount,
    })
  } catch (error) {
    console.error('Apify search error:', error)
    return NextResponse.json({ error: 'Failed to start search' }, { status: 500 })
  }
}

// GET — poll run status or fetch results
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const runId = searchParams.get('runId')

  if (!runId) {
    return NextResponse.json({ error: 'Missing runId' }, { status: 400 })
  }

  // Validate runId format (alphanumeric only — prevents injection)
  if (!/^[a-zA-Z0-9]+$/.test(runId)) {
    return NextResponse.json({ error: 'Invalid runId' }, { status: 400 })
  }

  const apifyToken = process.env.APIFY_TOKEN
  if (!apifyToken) {
    return NextResponse.json({ error: 'APIFY_TOKEN not configured' }, { status: 500 })
  }

  try {
    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`
    )

    if (!statusRes.ok) {
      return NextResponse.json({ error: 'Failed to check run status' }, { status: 502 })
    }

    const statusData = await statusRes.json()
    const runStatus = statusData.data?.status

    if (runStatus === 'RUNNING' || runStatus === 'READY') {
      return NextResponse.json({ status: runStatus })
    }

    if (runStatus === 'FAILED' || runStatus === 'ABORTED' || runStatus === 'TIMED-OUT') {
      return NextResponse.json({ status: runStatus, error: `Run ${runStatus.toLowerCase()}` })
    }

    // SUCCEEDED — fetch dataset results (capped to daily limit)
    const datasetId = statusData.data?.defaultDatasetId
    if (!datasetId) {
      return NextResponse.json({ status: 'SUCCEEDED', results: [] })
    }

    // Validate datasetId format
    if (!/^[a-zA-Z0-9]+$/.test(datasetId)) {
      return NextResponse.json({ error: 'Invalid dataset ID' }, { status: 400 })
    }

    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}&limit=${DAILY_SCRAPE_LIMIT}`
    )

    if (!dataRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch results' }, { status: 502 })
    }

    const results = await dataRes.json()

    return NextResponse.json({
      status: 'SUCCEEDED',
      results: results.map((item: Record<string, unknown>) => ({
        business_name: item.title || item.name || '',
        phone: item.phone || item.phoneUnformatted || null,
        website: item.website || item.url || null,
        address: item.address || item.street || null,
        rating: item.totalScore || item.rating || null,
        reviews_count: item.reviewsCount || item.reviews || null,
        category: item.categoryName || item.category || null,
        place_id: item.placeId || null,
      })),
    })
  } catch (error) {
    console.error('Apify poll error:', error)
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}
