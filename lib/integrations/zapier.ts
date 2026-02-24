// lib/integrations/zapier.ts
import { z } from 'zod'

/**
 * Zapier outbound webhook integration.
 *
 * When a new lead is created (or updated), the system POSTs a flat lead
 * payload to the Zapier webhook URL stored in the organisation's settings
 * (`zapier_webhook_url`). This lets customers build automations in Zapier
 * triggered by new leads (e.g. add to Google Sheet, create HubSpot contact).
 *
 * The helper is intentionally fire-and-forget so it never blocks the
 * critical lead-creation path.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal lead shape accepted by the Zapier helper. */
export interface ZapierLead {
  id: string
  organization_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  company: string | null
  stage: string | null
  score: number | null
  temperature: string | null
  source: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  ai_summary: string | null
  buying_signals: string[] | null
  objections: string[] | null
  recommended_action: string | null
  created_at: string
  updated_at: string
}

/** Organisation settings relevant to Zapier. */
export interface ZapierOrgSettings {
  zapier_webhook_url?: string
  zapier_enabled?: boolean
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Validates that the webhook URL is a well-formed HTTPS URL. */
const webhookUrlSchema = z
  .string()
  .url()
  .refine((url) => url.startsWith('https://'), {
    message: 'Zapier webhook URL must use HTTPS',
  })

// ---------------------------------------------------------------------------
// Flat payload formatter
// ---------------------------------------------------------------------------

/**
 * Converts a lead row into a flat key-value object that Zapier can easily
 * map in their editor — no nested objects, arrays are joined as CSV strings.
 */
export function formatLeadForZapier(lead: ZapierLead): Record<string, string | number | null> {
  return {
    lead_id: lead.id,
    organization_id: lead.organization_id,
    first_name: lead.first_name,
    last_name: lead.last_name,
    full_name: [lead.first_name, lead.last_name].filter(Boolean).join(' ') || null,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    stage: lead.stage,
    score: lead.score,
    temperature: lead.temperature,
    source: lead.source,
    utm_source: lead.utm_source,
    utm_medium: lead.utm_medium,
    utm_campaign: lead.utm_campaign,
    utm_content: lead.utm_content,
    ai_summary: lead.ai_summary,
    buying_signals: lead.buying_signals?.join(', ') ?? null,
    objections: lead.objections?.join(', ') ?? null,
    recommended_action: lead.recommended_action,
    created_at: lead.created_at,
    updated_at: lead.updated_at,
  }
}

// ---------------------------------------------------------------------------
// Outbound webhook dispatcher (fire-and-forget)
// ---------------------------------------------------------------------------

export interface SendLeadToZapierResult {
  success: boolean
  skipped?: boolean
  reason?: string
  statusCode?: number
}

/**
 * POST the lead payload to the organisation's Zapier webhook URL.
 *
 * - Returns immediately (fire-and-forget when called with `.catch()`).
 * - Validates the webhook URL before sending.
 * - Logs errors to console.error rather than throwing so callers that
 *   forget to catch are not affected.
 */
export async function sendLeadToZapier(
  lead: ZapierLead,
  orgSettings: ZapierOrgSettings,
): Promise<SendLeadToZapierResult> {
  // Guard: integration not enabled
  if (!orgSettings.zapier_enabled) {
    return { success: true, skipped: true, reason: 'zapier_disabled' }
  }

  // Guard: no URL configured
  if (!orgSettings.zapier_webhook_url) {
    return { success: true, skipped: true, reason: 'no_webhook_url' }
  }

  // Validate URL
  const urlResult = webhookUrlSchema.safeParse(orgSettings.zapier_webhook_url)
  if (!urlResult.success) {
    console.error('[Zapier] Invalid webhook URL:', urlResult.error.flatten())
    return { success: false, reason: 'invalid_webhook_url' }
  }

  const payload = formatLeadForZapier(lead)

  try {
    const response = await fetch(urlResult.data, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000), // 10 s timeout
    })

    if (!response.ok) {
      console.error(
        `[Zapier] Webhook returned ${response.status}: ${response.statusText}`,
      )
      return { success: false, statusCode: response.status }
    }

    return { success: true, statusCode: response.status }
  } catch (error) {
    console.error('[Zapier] Failed to send webhook:', error)
    return { success: false, reason: 'fetch_error' }
  }
}
