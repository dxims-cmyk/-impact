import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const searchSchema = z.object({
  searchTerm: z.string().min(1, 'Search term is required'),
  location: z.string().min(1, 'Location is required'),
  count: z.number().min(1).max(500).default(100),
})

// POST — start an Apify Google Places crawl
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await supabase
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

  const body = await request.json()
  const parsed = searchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { searchTerm, location, count } = parsed.data
  const apifyToken = process.env.APIFY_TOKEN

  if (!apifyToken) {
    return NextResponse.json({ error: 'APIFY_TOKEN not configured' }, { status: 500 })
  }

  try {
    // Start the Apify actor run
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${apifyToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchTerms: [searchTerm],
          locationQuery: location,
          maxCrawledPlacesPerSearch: count,
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
    })
  } catch (error) {
    console.error('Apify search error:', error)
    return NextResponse.json({ error: 'Failed to start search' }, { status: 500 })
  }
}

// GET — poll run status or fetch results
export async function GET(request: NextRequest) {
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

  const apifyToken = process.env.APIFY_TOKEN
  if (!apifyToken) {
    return NextResponse.json({ error: 'APIFY_TOKEN not configured' }, { status: 500 })
  }

  try {
    // Check run status
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

    // SUCCEEDED — fetch dataset results
    const datasetId = statusData.data?.defaultDatasetId
    if (!datasetId) {
      return NextResponse.json({ status: 'SUCCEEDED', results: [] })
    }

    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}&limit=500`
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
