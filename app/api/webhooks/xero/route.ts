// app/api/webhooks/xero/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  ensureValidToken,
  getInvoice,
  mapXeroStatus,
} from '@/lib/integrations/xero'
import type { XeroWebhookEvent } from '@/lib/integrations/xero'
import crypto from 'crypto'

// Xero sends an initial validation request (intent-to-receive) with a
// specific header. We must return a 200 with the correct HMAC-SHA256 hash
// of the request body using our webhook key.

function getWebhookKey(): string {
  const key = process.env.XERO_WEBHOOK_KEY
  if (!key) throw new Error('XERO_WEBHOOK_KEY is not set')
  return key
}

/** Verify the Xero webhook signature */
function verifySignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', getWebhookKey())
    .update(payload)
    .digest('base64')

  // Constant-time comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'base64'),
      Buffer.from(signature, 'base64')
    )
  } catch {
    return false
  }
}

// POST /api/webhooks/xero - Receive Xero webhook events
export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text()
  const signature = request.headers.get('x-xero-signature') || ''

  // Verify webhook signature
  const isValid = verifySignature(rawBody, signature)

  if (!isValid) {
    // Xero requires a 401 for failed signature validation
    return new NextResponse(null, { status: 401 })
  }

  // Parse the webhook payload
  let payload: { events: XeroWebhookEvent[]; firstEventSequence?: number; lastEventSequence?: number }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // If no events, Xero is just doing intent-to-receive validation
  if (!payload.events || payload.events.length === 0) {
    return new NextResponse(null, { status: 200 })
  }

  const supabase = createAdminClient()

  // Process each event
  for (const event of payload.events) {
    // We only care about invoice events for now
    if (event.eventCategory !== 'INVOICE') {
      continue
    }

    try {
      const invoiceId = event.resourceId
      const tenantId = event.tenantId

      // Find the org that has this tenant connected
      const { data: integration } = await supabase
        .from('integrations')
        .select('organization_id, access_token, refresh_token, metadata')
        .eq('provider', 'xero')
        .eq('account_id', tenantId)
        .eq('status', 'connected')
        .single()

      if (!integration) {
        console.error(`Xero webhook: no integration found for tenant ${tenantId}`)
        continue
      }

      // Get a valid token
      const { accessToken } = await ensureValidToken(integration.organization_id)

      // Fetch current invoice details from Xero
      const invoice = await getInvoice(accessToken, tenantId, invoiceId)

      // Map Xero status to our internal status
      const internalStatus = mapXeroStatus(invoice.Status)

      // Find leads that have this invoice_id and update their status
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, organization_id')
        .eq('invoice_id', invoiceId)

      if (leadsError) {
        console.error('Xero webhook: failed to find leads for invoice:', leadsError)
        continue
      }

      for (const lead of leads || []) {
        await supabase
          .from('leads')
          .update({
            invoice_status: internalStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lead.id)

        // Log activity
        await supabase
          .from('lead_activities')
          .insert({
            lead_id: lead.id,
            organization_id: lead.organization_id,
            type: 'invoice_updated',
            content: `Invoice status updated to ${internalStatus} (Xero: ${invoice.Status})`,
            is_automated: true,
            metadata: {
              invoice_id: invoiceId,
              invoice_number: invoice.InvoiceNumber,
              xero_status: invoice.Status,
              amount_due: invoice.AmountDue,
              amount_paid: invoice.AmountPaid,
            },
          })
      }
    } catch (err) {
      console.error('Xero webhook: error processing event:', err)
      // Continue processing other events even if one fails
    }
  }

  return new NextResponse(null, { status: 200 })
}
