// lib/integrations/vapi.ts
// Vapi AI Receptionist API helper functions

const VAPI_BASE_URL = 'https://api.vapi.ai'

function getApiKey(): string {
  const key = process.env.VAPI_API_KEY
  if (!key) {
    throw new Error('VAPI_API_KEY environment variable is not set')
  }
  return key
}

function headers(): Record<string, string> {
  return {
    'Authorization': `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
  }
}

// --- Types ---

export interface VapiAssistantConfig {
  name: string
  firstMessage: string
  model: {
    provider: string
    model: string
    messages: { role: 'system'; content: string }[]
  }
  voice: {
    provider: string
    voiceId: string
  }
  forwardingPhoneNumber?: string
  serverUrl: string
  metadata?: Record<string, unknown>
}

export interface VapiAssistant {
  id: string
  name: string
  firstMessage: string
  model: Record<string, unknown>
  voice: Record<string, unknown>
  serverUrl: string | null
  forwardingPhoneNumber: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface VapiCall {
  id: string
  assistantId: string
  phoneNumber?: {
    number: string
  }
  customer?: {
    number: string
    name?: string
  }
  status: string
  startedAt: string
  endedAt: string | null
  transcript: string | null
  recordingUrl: string | null
  summary: string | null
  duration: number | null
  cost: number | null
  metadata: Record<string, unknown> | null
}

// --- API Functions ---

export async function createAssistant(
  config: VapiAssistantConfig
): Promise<VapiAssistant> {
  const response = await fetch(`${VAPI_BASE_URL}/assistant`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(config),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(`Vapi createAssistant failed (${response.status}): ${error.message || JSON.stringify(error)}`)
  }

  return response.json()
}

export async function updateAssistant(
  assistantId: string,
  config: Partial<VapiAssistantConfig>
): Promise<VapiAssistant> {
  const response = await fetch(`${VAPI_BASE_URL}/assistant/${assistantId}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(config),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(`Vapi updateAssistant failed (${response.status}): ${error.message || JSON.stringify(error)}`)
  }

  return response.json()
}

export async function getAssistant(
  assistantId: string
): Promise<VapiAssistant> {
  const response = await fetch(`${VAPI_BASE_URL}/assistant/${assistantId}`, {
    method: 'GET',
    headers: headers(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(`Vapi getAssistant failed (${response.status}): ${error.message || JSON.stringify(error)}`)
  }

  return response.json()
}

export async function deleteAssistant(
  assistantId: string
): Promise<void> {
  const response = await fetch(`${VAPI_BASE_URL}/assistant/${assistantId}`, {
    method: 'DELETE',
    headers: headers(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(`Vapi deleteAssistant failed (${response.status}): ${error.message || JSON.stringify(error)}`)
  }
}

export async function getCallLogs(
  assistantId: string,
  limit: number = 100
): Promise<VapiCall[]> {
  const params = new URLSearchParams({
    assistantId,
    limit: String(limit),
  })

  const response = await fetch(`${VAPI_BASE_URL}/call?${params}`, {
    method: 'GET',
    headers: headers(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(`Vapi getCallLogs failed (${response.status}): ${error.message || JSON.stringify(error)}`)
  }

  return response.json()
}

export async function getCall(
  callId: string
): Promise<VapiCall> {
  const response = await fetch(`${VAPI_BASE_URL}/call/${callId}`, {
    method: 'GET',
    headers: headers(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(`Vapi getCall failed (${response.status}): ${error.message || JSON.stringify(error)}`)
  }

  return response.json()
}

// --- Outbound call ---

export interface CreateOutboundCallParams {
  assistantId: string
  phoneNumberId: string // VAPI phone number ID to call FROM
  customerNumber: string // Lead's phone number to call
  metadata?: Record<string, unknown>
}

export async function createOutboundCall(
  params: CreateOutboundCallParams
): Promise<VapiCall> {
  const response = await fetch(`${VAPI_BASE_URL}/call`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      assistantId: params.assistantId,
      phoneNumberId: params.phoneNumberId,
      customer: {
        number: params.customerNumber,
      },
      metadata: params.metadata || {},
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(`Vapi createOutboundCall failed (${response.status}): ${error.message || JSON.stringify(error)}`)
  }

  return response.json()
}

// --- Business hours helper ---

export interface BusinessHours {
  enabled: boolean
  timezone: string
  days: number[] // 0=Sun, 1=Mon, ..., 6=Sat
  start: string  // "09:00"
  end: string    // "17:00"
}

export function isWithinBusinessHours(hours: BusinessHours | null | undefined): boolean {
  if (!hours || !hours.enabled) return true // No hours configured = always available

  const now = new Date()
  // Get current time in the org's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: hours.timezone || 'Europe/London',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  })

  const parts = formatter.formatToParts(now)
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
  const weekdayStr = parts.find(p => p.type === 'weekday')?.value || ''

  // Map weekday string to number
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const currentDay = dayMap[weekdayStr] ?? new Date().getDay()

  if (!hours.days.includes(currentDay)) return false

  const currentMinutes = hour * 60 + minute
  const [startH, startM] = hours.start.split(':').map(Number)
  const [endH, endM] = hours.end.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

// Build the system prompt for the AI receptionist
export function buildReceptionistSystemPrompt(config: {
  businessName: string
  greeting: string
  questions: string[]
  calendarLink?: string
  transferNumber?: string
  greetingStyle?: 'formal' | 'casual'
  isWithinHours?: boolean
}): string {
  const questionsList = config.questions
    .map((q, i) => `${i + 1}. ${q}`)
    .join('\n')

  const tone = config.greetingStyle === 'casual'
    ? 'Use a warm, casual, and friendly tone. Be conversational like a helpful colleague.'
    : 'Use a professional, polished tone. Be courteous and businesslike.'

  const transferBlock = config.transferNumber && config.isWithinHours !== false
    ? `If the caller is clearly ready to buy, very interested, or asks to speak to someone, transfer them immediately to: ${config.transferNumber}. Say something like "Let me connect you with the team right now."`
    : ''

  const bookingBlock = config.calendarLink
    ? `If the caller wants to schedule a meeting or consultation, provide this booking link: ${config.calendarLink}. Say "I can send you a link to book a time that works for you."`
    : ''

  const outsideHoursNote = config.isWithinHours === false && config.calendarLink
    ? `IMPORTANT: The team is currently outside business hours. Do NOT offer to transfer the call. Instead, guide the caller to book a meeting using the booking link.`
    : ''

  return `You are an AI receptionist for ${config.businessName}.

${tone}

Your job on every call:
1. Greet the caller and get their name
2. Find out why they're calling
3. Ask the qualifying questions below (naturally, one at a time)
4. Based on their answers, take the right action:
   - HOT (ready to buy, urgent need, clear budget): Transfer to the team
   - WARM (interested but not urgent): Offer to book a meeting
   - COLD (just browsing, wrong fit, no budget): Thank them and end politely

Qualifying questions (ask in natural conversation):
${questionsList}

${outsideHoursNote}
${transferBlock}
${bookingBlock}

At the end of every call, you MUST state your assessment clearly:
"Based on our conversation, I'd classify this as a [HOT/WARM/COLD] lead because [brief reason]."

Rules:
- Collect the caller's name and email if possible
- Ask ONE question at a time, listen before moving on
- Never fabricate pricing, availability, or service details
- If unsure, offer to have the team follow up
- Keep responses short and natural (this is a phone call, not an essay)
- Summarize what you learned before ending`
}
