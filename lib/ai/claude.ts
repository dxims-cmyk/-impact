// lib/ai/claude.ts
import Anthropic from '@anthropic-ai/sdk'
import { Lead } from '@/types/database'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Types for AI responses
export interface LeadQualification {
  score: number // 1-10
  temperature: 'hot' | 'warm' | 'cold'
  buying_signals: string[]
  objections: string[]
  recommended_action: string
  summary: string
}

export interface ConversationResponse {
  reply: string
  should_escalate: boolean
  escalation_reason?: string
  detected_intent: 'booking' | 'question' | 'objection' | 'not_interested' | 'unclear'
}

export interface ReportSummary {
  summary: string
  highlights: string[]
  concerns: string[]
  recommendations: string[]
}

// Lead Qualification
export async function qualifyLead(lead: Partial<Lead>): Promise<LeadQualification> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a lead qualification assistant for a growth marketing agency.

Analyze this lead and return ONLY valid JSON (no markdown, no explanation):
{
  "score": <1-10 integer>,
  "temperature": "<hot|warm|cold>",
  "buying_signals": ["<signal1>", "<signal2>"],
  "objections": ["<objection1>"],
  "recommended_action": "<specific next step>",
  "summary": "<one sentence summary>"
}

Scoring guide:
- 9-10: Ready to buy, high urgency, good budget indicators
- 7-8: Strong interest, some buying signals
- 5-6: Interested but early stage or unclear fit
- 3-4: Low engagement or poor fit signals
- 1-2: Not qualified or spam

Lead data:
${JSON.stringify(lead, null, 2)}`
      }
    ]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  
  try {
    return JSON.parse(text) as LeadQualification
  } catch {
    // Fallback if parsing fails
    return {
      score: 5,
      temperature: 'warm',
      buying_signals: [],
      objections: [],
      recommended_action: 'Review manually',
      summary: 'Could not auto-qualify, needs human review'
    }
  }
}

// Conversational AI Reply
export async function generateConversationReply(
  messages: { role: 'user' | 'assistant'; content: string }[],
  leadContext: Partial<Lead>,
  orgSettings: { business_name: string; booking_link: string }
): Promise<ConversationResponse> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: `You are a helpful assistant for ${orgSettings.business_name}, a growth marketing agency.

Your goals:
1. Answer questions briefly and helpfully
2. Qualify the lead (understand their needs, budget, timeline)
3. Offer to book a call when they seem ready: ${orgSettings.booking_link}

Rules:
- Keep responses under 160 characters for SMS compatibility
- Be friendly but professional
- Don't be pushy, but guide toward booking
- If you can't help, escalate to a human

Lead context: ${JSON.stringify(leadContext)}

Return ONLY valid JSON:
{
  "reply": "<your response under 160 chars>",
  "should_escalate": <true|false>,
  "escalation_reason": "<reason if escalating>",
  "detected_intent": "<booking|question|objection|not_interested|unclear>"
}`,
    messages
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  
  try {
    return JSON.parse(text) as ConversationResponse
  } catch {
    return {
      reply: "Thanks for your message! Let me connect you with our team.",
      should_escalate: true,
      escalation_reason: 'AI could not generate appropriate response',
      detected_intent: 'unclear'
    }
  }
}

// Weekly Report Summary
export async function generateReportSummary(
  metrics: {
    leads: number
    leads_change: number
    spend: number
    cpl: number
    cpl_change: number
    booked: number
    won: number
    revenue: number
    roas: number
    top_campaigns: { name: string; leads: number; spend: number }[]
  }
): Promise<ReportSummary> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Generate a weekly growth marketing report summary.

Be specific, use actual numbers, highlight wins, and provide actionable recommendations.

Metrics for this week:
${JSON.stringify(metrics, null, 2)}

Return ONLY valid JSON:
{
  "summary": "<2-3 sentence executive summary>",
  "highlights": ["<win 1>", "<win 2>"],
  "concerns": ["<concern if any>"],
  "recommendations": ["<action 1>", "<action 2>"]
}`
      }
    ]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  
  try {
    return JSON.parse(text) as ReportSummary
  } catch {
    return {
      summary: `This week generated ${metrics.leads} leads at £${metrics.cpl.toFixed(2)} CPL with ${metrics.roas.toFixed(1)}x ROAS.`,
      highlights: [`${metrics.leads} new leads captured`],
      concerns: [],
      recommendations: ['Review campaign performance in detail']
    }
  }
}

// Ad Performance Analysis
export async function analyzeAdPerformance(
  campaigns: {
    name: string
    spend: number
    leads: number
    cpl: number
    roas: number
    trend: 'up' | 'down' | 'stable'
  }[],
  targets: { target_cpl: number; target_roas: number }
): Promise<{
  analysis: string
  alerts: string[]
  optimizations: string[]
}> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Analyze these ad campaign performances and provide insights.

Campaigns:
${JSON.stringify(campaigns, null, 2)}

Targets:
- Target CPL: £${targets.target_cpl}
- Target ROAS: ${targets.target_roas}x

Return ONLY valid JSON:
{
  "analysis": "<brief overall analysis>",
  "alerts": ["<urgent issues>"],
  "optimizations": ["<specific recommendations>"]
}`
      }
    ]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  
  try {
    return JSON.parse(text)
  } catch {
    return {
      analysis: 'Unable to generate analysis',
      alerts: [],
      optimizations: []
    }
  }
}
