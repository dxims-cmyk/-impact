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

// Build the system prompt for the AI receptionist
export function buildReceptionistSystemPrompt(config: {
  businessName: string
  greeting: string
  questions: string[]
  calendarLink?: string
  transferNumber?: string
}): string {
  const questionsList = config.questions
    .map((q, i) => `${i + 1}. ${q}`)
    .join('\n')

  return `You are a professional and friendly AI receptionist for ${config.businessName}.

Your role is to:
1. Greet callers warmly and professionally
2. Gather their name and contact information (phone number if not already known, email if possible)
3. Ask qualifying questions to understand their needs
4. Provide helpful information based on their questions
5. Offer to book a meeting or transfer to a team member when appropriate

Qualifying questions to ask (in natural conversation, not all at once):
${questionsList}

${config.calendarLink ? `If the caller wants to book a meeting or consultation, provide this booking link: ${config.calendarLink}` : ''}
${config.transferNumber ? `If the caller insists on speaking to a human or the question is outside your scope, transfer them to: ${config.transferNumber}` : ''}

Important rules:
- Always be polite, professional, and concise
- Collect the caller's name early in the conversation
- Ask one question at a time, listen to the response before moving on
- If the caller seems ready to commit, guide them toward booking
- Summarize what you learned at the end of the call
- Never make up information about services or pricing — offer to have a team member follow up
- Keep responses conversational and natural`
}
