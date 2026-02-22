// lib/integrations/twilio.ts
import twilio from 'twilio'

function getClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.')
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
}

export interface SendSMSOptions {
  to: string
  body: string
  statusCallback?: string
}

export interface SendWhatsAppOptions {
  to: string
  body: string
  mediaUrl?: string
}

// Normalize phone number to E.164 format
export function normalizePhone(phone: string): string {
  // Remove all non-numeric characters except +
  let normalized = phone.replace(/[^\d+]/g, '')
  
  // Add + if missing and starts with country code
  if (!normalized.startsWith('+')) {
    // Assume UK if starts with 0
    if (normalized.startsWith('0')) {
      normalized = '+44' + normalized.slice(1)
    } else if (normalized.startsWith('44')) {
      normalized = '+' + normalized
    } else {
      // Default to UK
      normalized = '+44' + normalized
    }
  }
  
  return normalized
}

// Send SMS
export async function sendSMS({ to, body, statusCallback }: SendSMSOptions) {
  const message = await getClient().messages.create({
    to: normalizePhone(to),
    from: process.env.TWILIO_PHONE_NUMBER!,
    body,
    statusCallback: statusCallback || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`
  })

  return {
    sid: message.sid,
    status: message.status,
    to: message.to,
    dateCreated: message.dateCreated
  }
}

// Send WhatsApp message
export async function sendWhatsApp({ to, body, mediaUrl }: SendWhatsAppOptions) {
  const message = await getClient().messages.create({
    to: `whatsapp:${normalizePhone(to)}`,
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER!}`,
    body,
    mediaUrl: mediaUrl ? [mediaUrl] : undefined
  })

  return {
    sid: message.sid,
    status: message.status,
    to: message.to,
    dateCreated: message.dateCreated
  }
}

// Validate Twilio webhook signature
export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params
  )
}

// Parse inbound SMS webhook
export function parseInboundSMS(body: FormData) {
  return {
    messageSid: body.get('MessageSid') as string,
    from: body.get('From') as string,
    to: body.get('To') as string,
    body: body.get('Body') as string,
    numMedia: parseInt(body.get('NumMedia') as string || '0'),
    fromCity: body.get('FromCity') as string | null,
    fromState: body.get('FromState') as string | null,
    fromCountry: body.get('FromCountry') as string | null,
  }
}

// Get message status
export async function getMessageStatus(messageSid: string) {
  const message = await getClient().messages(messageSid).fetch()
  return {
    status: message.status,
    errorCode: message.errorCode,
    errorMessage: message.errorMessage,
    dateSent: message.dateSent,
    dateDelivered: message.dateDelivered
  }
}
