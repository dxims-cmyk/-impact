// lib/ai/follow-up.ts
// AI-powered follow-up message generation for pipeline nurture
import Anthropic from '@anthropic-ai/sdk'

export interface FollowUpResult {
  subject: string
  message: string
  channel: 'email' | 'whatsapp'
}

interface FollowUpParams {
  leadName: string
  leadEmail: string | null
  leadPhone: string | null
  company: string | null
  stage: string
  conversationHistory: { direction: string; content: string; sent_at: string | null }[]
  recentActivities: { type: string; content: string | null; created_at: string }[]
  orgName: string
  bookingLink?: string
  persona?: string
}

export async function generateFollowUp(params: FollowUpParams): Promise<FollowUpResult> {
  const {
    leadName,
    leadEmail,
    leadPhone,
    company,
    stage,
    conversationHistory,
    recentActivities,
    orgName,
    bookingLink,
    persona,
  } = params

  const channel: 'email' | 'whatsapp' = leadEmail ? 'email' : 'whatsapp'

  // Build conversation context string
  const convoContext = conversationHistory.length > 0
    ? conversationHistory.map(m => `[${m.direction}] ${m.content}`).join('\n')
    : 'No previous messages.'

  // Build activity context
  const activityContext = recentActivities.length > 0
    ? recentActivities
        .slice(0, 5)
        .map(a => `${a.type}: ${a.content || '(no details)'}`)
        .join('\n')
    : 'No recent activities.'

  const stageGuidance: Record<string, string> = {
    qualified: `This lead has been qualified but not yet contacted. Goal: make first contact, introduce yourself, and offer a call. ${bookingLink ? `Include booking link: ${bookingLink}` : ''}`,
    contacted: `This lead has been contacted before. Goal: follow up on previous conversation, check if they have questions, nudge toward booking. ${bookingLink ? `Include booking link: ${bookingLink}` : ''}`,
    booked: `This lead has an appointment booked. Goal: confirm they're still good for the call, ask if they have anything they'd like to discuss, build anticipation.`,
  }

  const channelGuidance = channel === 'whatsapp'
    ? 'Keep it very short (2-3 sentences max). No subject line needed. Casual tone suitable for WhatsApp.'
    : 'Write a professional but warm email. Include a subject line. Keep the body to 3-5 sentences.'

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `Generate a follow-up message for a lead in our pipeline.

Business: ${orgName}
Lead name: ${leadName}
${company ? `Company: ${company}` : ''}
Stage: ${stage}
Channel: ${channel}
${persona ? `Tone/persona: ${persona}` : 'Tone: friendly, professional, human'}

Stage guidance: ${stageGuidance[stage] || 'Follow up naturally.'}

Channel guidance: ${channelGuidance}

Recent conversation history:
${convoContext}

Recent activities:
${activityContext}

Rules:
- Sound like a real person, not a bot
- Reference previous conversation if there is any
- Don't be pushy or salesy
- Use the lead's first name
- No markdown formatting
- No emojis (keep it professional)
- If there's a booking link, weave it in naturally, don't just dump it

Return ONLY valid JSON:
{
  "subject": "<email subject line, or empty string for WhatsApp>",
  "message": "<the follow-up message body>"
}`
      }
    ]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const parsed = JSON.parse(text) as { subject: string; message: string }
    return {
      subject: parsed.subject || `Following up - ${orgName}`,
      message: parsed.message,
      channel,
    }
  } catch {
    // Fallback message
    const fallbackMessage = channel === 'whatsapp'
      ? `Hi ${leadName}, just checking in from ${orgName}. Let me know if you have any questions or if there's anything I can help with.`
      : `Hi ${leadName},\n\nJust wanted to follow up and see how things are going. If you have any questions or would like to chat, I'm here to help.\n\nBest regards,\nThe ${orgName} Team`

    return {
      subject: `Following up - ${orgName}`,
      message: fallbackMessage,
      channel,
    }
  }
}
