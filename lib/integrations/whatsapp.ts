// lib/integrations/whatsapp.ts
// Meta WhatsApp Cloud API — no Twilio dependency

const META_API_VERSION = 'v18.0'
const WHATSAPP_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`

export interface SendWhatsAppOptions {
  to: string
  body: string
}

export interface SendWhatsAppTemplateOptions {
  to: string
  templateName: string
  languageCode?: string
  components?: WhatsAppTemplateComponent[]
}

interface WhatsAppTemplateComponent {
  type: 'body' | 'header'
  parameters: { type: 'text'; text: string }[]
}

// Normalize phone to E.164 (required by WhatsApp API)
function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[^\d+]/g, '')

  if (!normalized.startsWith('+')) {
    if (normalized.startsWith('0')) {
      normalized = '+44' + normalized.slice(1)
    } else if (normalized.startsWith('44')) {
      normalized = '+' + normalized
    } else {
      normalized = '+44' + normalized
    }
  }

  // WhatsApp API wants digits only, no +
  return normalized.replace('+', '')
}

function getConfig(): { phoneNumberId: string; accessToken: string } {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    throw new Error(
      'WhatsApp not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.'
    )
  }

  return { phoneNumberId, accessToken }
}

// Send a free-form text message (only works within 24hr customer service window)
export async function sendWhatsAppText({ to, body }: SendWhatsAppOptions): Promise<{
  messageId: string
}> {
  const { phoneNumberId, accessToken } = getConfig()

  const response = await fetch(
    `${WHATSAPP_BASE_URL}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizePhone(to),
        type: 'text',
        text: { body },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `WhatsApp send failed: ${error.error?.message || JSON.stringify(error)}`
    )
  }

  const data = await response.json()
  return { messageId: data.messages?.[0]?.id }
}

// Send a template message (required for business-initiated conversations)
export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = 'en',
  components,
}: SendWhatsAppTemplateOptions): Promise<{ messageId: string }> {
  const { phoneNumberId, accessToken } = getConfig()

  const response = await fetch(
    `${WHATSAPP_BASE_URL}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizePhone(to),
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          ...(components && { components }),
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `WhatsApp template send failed: ${error.error?.message || JSON.stringify(error)}`
    )
  }

  const data = await response.json()
  return { messageId: data.messages?.[0]?.id }
}

// Send new lead notification to client via WhatsApp
// Uses new_lead_alert template: {{1}} = leadName, {{2}} = company, {{3}} = score
export async function sendNewLeadAlert({
  to,
  leadName,
  leadCompany,
  aiScore,
}: {
  to: string
  leadName?: string
  leadCompany?: string | null
  aiScore?: string | null
}): Promise<{ messageId: string }> {
  return await sendWhatsAppTemplate({
    to,
    templateName: 'new_lead_alert',
    languageCode: 'en',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: leadName || 'New lead' },
          { type: 'text', text: leadCompany || 'Not provided' },
          { type: 'text', text: aiScore || 'Pending' },
        ],
      },
    ],
  })
}
