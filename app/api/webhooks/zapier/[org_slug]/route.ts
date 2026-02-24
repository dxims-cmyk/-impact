// app/api/webhooks/zapier/[org_slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { ZapierOrgSettings } from '@/lib/integrations/zapier'

/**
 * Zapier outbound webhook endpoint — per-organisation.
 *
 * GET  /api/webhooks/zapier/:org_slug  — Health check / integration status
 * POST /api/webhooks/zapier/:org_slug  — Test ping from Zapier to verify the connection
 *
 * This is NOT the endpoint that sends data to Zapier (that is handled by
 * `sendLeadToZapier()` in `lib/integrations/zapier.ts`). Instead this
 * route lets Zapier verify the connection and lets the frontend query
 * integration health.
 */

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const paramsSchema = z.object({
  org_slug: z.string().min(1),
})

const testPingSchema = z.object({
  type: z.literal('test').optional(),
  challenge: z.string().optional(),
}).passthrough()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function resolveOrg(slug: string): Promise<{
  id: string
  name: string
  settings: ZapierOrgSettings
} | null> {
  const supabase = createAdminClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select('id, name, settings')
    .eq('slug', slug)
    .single()

  if (error || !org) return null

  return {
    id: org.id,
    name: org.name,
    settings: (org.settings ?? {}) as ZapierOrgSettings,
  }
}

// ---------------------------------------------------------------------------
// GET — Integration status / health check
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: { org_slug: string } },
): Promise<NextResponse> {
  const parsed = paramsSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid org slug' },
      { status: 400 },
    )
  }

  try {
    const org = await resolveOrg(parsed.data.org_slug)

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      )
    }

    const hasWebhookUrl = Boolean(org.settings.zapier_webhook_url)
    const isEnabled = Boolean(org.settings.zapier_enabled)

    return NextResponse.json({
      ok: true,
      integration: 'zapier',
      organization: org.name,
      status: isEnabled && hasWebhookUrl ? 'active' : 'inactive',
      configured: hasWebhookUrl,
      enabled: isEnabled,
    })
  } catch (error) {
    console.error('[Zapier] Health check failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// POST — Test ping from Zapier to verify the connection
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: { org_slug: string } },
): Promise<NextResponse> {
  const parsed = paramsSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid org slug' },
      { status: 400 },
    )
  }

  try {
    const org = await resolveOrg(parsed.data.org_slug)

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      )
    }

    // Parse body (Zapier sometimes sends an empty body on subscribe)
    let body: Record<string, unknown> = {}
    try {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch {
      // Empty or non-JSON body is acceptable for a ping
    }

    const ping = testPingSchema.safeParse(body)
    if (!ping.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: ping.error.flatten() },
        { status: 400 },
      )
    }

    // If Zapier sends a challenge, echo it back (standard webhook verification)
    if (ping.data.challenge) {
      return NextResponse.json({
        ok: true,
        challenge: ping.data.challenge,
      })
    }

    // Standard ping response
    return NextResponse.json({
      ok: true,
      integration: 'zapier',
      organization: org.name,
      message: 'Webhook connection verified',
      received_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Zapier] Test ping failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
