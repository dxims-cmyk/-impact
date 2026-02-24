// trigger/jobs/ai-whatsapp-reply.ts
import { task, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/lib/supabase/server"
import Anthropic from "@anthropic-ai/sdk"
import { sendWhatsAppText } from "@/lib/integrations/whatsapp"

interface AiWhatsAppReplyPayload {
  conversationId: string
  messageText: string
  leadId: string
  orgId: string
}

interface OrgAiSettings {
  ai_responder_enabled?: boolean
  ai_responder_persona?: string
  ai_responder_faqs?: string
  ai_responder_handoff_keywords?: string[]
  ai_responder_max_messages?: number
  booking_link?: string
  notification_whatsapp_numbers?: string[]
}

const DEFAULT_MAX_AI_MESSAGES = 10
const HANDOFF_MESSAGE =
  "I'm connecting you with a team member who can help further. They'll be in touch shortly!"

export const aiWhatsAppReplyTask = task({
  id: "ai-whatsapp-reply",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: AiWhatsAppReplyPayload) => {
    const { conversationId, messageText, leadId, orgId } = payload

    logger.info("AI WhatsApp reply started", { conversationId, leadId })

    const supabase = createAdminClient()

    // 1. Fetch conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, ai_handling, ai_message_count, lead_id, organization_id, channel")
      .eq("id", conversationId)
      .single()

    if (convError || !conversation) {
      logger.error("Conversation not found", { conversationId, error: convError })
      return { success: false, error: "Conversation not found" }
    }

    // Double-check AI is still active (could have been paused between trigger and run)
    if (conversation.ai_handling !== "active") {
      logger.info("AI handling no longer active, skipping", {
        conversationId,
        status: conversation.ai_handling,
      })
      return { success: true, skipped: true, reason: "ai_not_active" }
    }

    // 2. Fetch conversation history (last 20 messages)
    const { data: messages } = await supabase
      .from("messages")
      .select("content, direction, is_ai_generated, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(20)

    const sortedMessages = (messages || []).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    // 3. Fetch lead info
    const { data: lead } = await supabase
      .from("leads")
      .select("first_name, last_name, email, phone, stage, score, source, company, source_detail")
      .eq("id", leadId)
      .single()

    if (!lead) {
      logger.error("Lead not found", { leadId })
      return { success: false, error: "Lead not found" }
    }

    // 4. Fetch org settings
    const { data: org } = await supabase
      .from("organizations")
      .select("name, settings")
      .eq("id", orgId)
      .single()

    const orgSettings = (org?.settings || {}) as OrgAiSettings
    const businessName = org?.name || "our team"
    const maxMessages = orgSettings.ai_responder_max_messages || DEFAULT_MAX_AI_MESSAGES
    const handoffKeywords = orgSettings.ai_responder_handoff_keywords || []
    const persona = orgSettings.ai_responder_persona || "friendly and professional"
    const faqs = orgSettings.ai_responder_faqs || ""
    const bookingLink = orgSettings.booking_link || ""

    // 5. Check if we should hand off to human
    const currentAiCount = conversation.ai_message_count || 0

    // Max messages check
    if (currentAiCount >= maxMessages) {
      logger.info("Max AI messages reached, handing off", {
        conversationId,
        count: currentAiCount,
        max: maxMessages,
      })
      return await handOffConversation(supabase, conversation, lead, orgSettings, businessName)
    }

    // Handoff keyword check
    const lowerMessage = messageText.toLowerCase()
    const triggeredKeyword = handoffKeywords.find((kw) =>
      lowerMessage.includes(kw.toLowerCase())
    )
    if (triggeredKeyword) {
      logger.info("Handoff keyword detected", {
        conversationId,
        keyword: triggeredKeyword,
      })
      return await handOffConversation(supabase, conversation, lead, orgSettings, businessName)
    }

    // 6. Build Claude prompt
    const conversationHistory: { role: "user" | "assistant"; content: string }[] =
      sortedMessages.map((m) => ({
        role: m.direction === "inbound" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      }))

    const leadName = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "there"

    const systemPrompt = `You are a helpful assistant for ${businessName}.

Persona: ${persona}

${faqs ? `FAQs / Knowledge Base:\n${faqs}\n` : ""}
${bookingLink ? `Calendar booking link: ${bookingLink}` : ""}

Important rules:
- Keep responses concise (1-3 sentences max).
- Be natural and conversational, like a real person texting.
- If they want to book a call or meeting, send them the calendar link.
- Never make up information that is not in the FAQs above.
- If you are unsure about something, say so and offer to connect them with the team.
- Do not use markdown formatting (no **, no ##, no bullet points with -). Write plain text suitable for WhatsApp.
- The lead's name is ${leadName}.`

    // 7. Call Anthropic API
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })

    let aiReplyText: string

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 300,
        system: systemPrompt,
        messages: conversationHistory,
      })

      aiReplyText =
        response.content[0].type === "text"
          ? response.content[0].text
          : "Thanks for your message! Let me connect you with our team."

      logger.info("AI response generated", {
        conversationId,
        responseLength: aiReplyText.length,
      })
    } catch (error) {
      logger.error("Anthropic API error", { error })
      return { success: false, error: "AI generation failed" }
    }

    // 8. Send AI response via WhatsApp
    let waMessageId: string | undefined

    try {
      const result = await sendWhatsAppText({
        to: lead.phone!,
        body: aiReplyText,
      })
      waMessageId = result.messageId
      logger.info("WhatsApp AI reply sent", { messageId: waMessageId })
    } catch (error) {
      logger.error("WhatsApp send failed", { error })
      return { success: false, error: "WhatsApp send failed" }
    }

    // 9. Store outbound message
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      organization_id: orgId,
      direction: "outbound",
      content: aiReplyText,
      status: "sent",
      external_id: waMessageId || null,
      is_ai_generated: true,
      sent_at: new Date().toISOString(),
    })

    // 10. Increment ai_message_count and update conversation
    await supabase
      .from("conversations")
      .update({
        ai_message_count: currentAiCount + 1,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversationId)

    // 11. Log activity
    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      organization_id: orgId,
      type: "whatsapp_sent",
      direction: "outbound",
      channel: "whatsapp",
      content: aiReplyText,
      metadata: {
        message_id: waMessageId,
        is_ai_generated: true,
        conversation_id: conversationId,
      },
      is_automated: true,
    })

    return {
      success: true,
      reply: aiReplyText,
      messageId: waMessageId,
      aiMessageCount: currentAiCount + 1,
    }
  },
})

// Helper: hand off conversation to human
async function handOffConversation(
  supabase: ReturnType<typeof createAdminClient>,
  conversation: { id: string; organization_id: string; lead_id: string },
  lead: { phone: string | null; first_name: string | null; last_name: string | null },
  orgSettings: OrgAiSettings,
  businessName: string
): Promise<{
  success: boolean
  handedOff: boolean
  reason: string
}> {
  // Update conversation to handed_off
  await supabase
    .from("conversations")
    .update({ ai_handling: "handed_off" })
    .eq("id", conversation.id)

  // Send handoff message to lead
  if (lead.phone) {
    try {
      const result = await sendWhatsAppText({
        to: lead.phone,
        body: HANDOFF_MESSAGE,
      })

      // Store the handoff message
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        organization_id: conversation.organization_id,
        direction: "outbound",
        content: HANDOFF_MESSAGE,
        status: "sent",
        external_id: result.messageId || null,
        is_ai_generated: true,
        sent_at: new Date().toISOString(),
      })
    } catch (error) {
      logger.error("Failed to send handoff message to lead", { error })
    }
  }

  // Notify owner(s) via WhatsApp
  const ownerNumbers = orgSettings.notification_whatsapp_numbers || []
  const leadName =
    [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "A lead"

  for (const number of ownerNumbers) {
    try {
      await sendWhatsAppText({
        to: number,
        body: `${leadName} needs human attention on WhatsApp. The AI responder has handed off this conversation. Please check your ${businessName} dashboard.`,
      })
    } catch (error) {
      logger.error("Failed to notify owner about handoff", {
        to: number,
        error,
      })
    }
  }

  // Create notification in-app
  await supabase.from("notifications").insert({
    organization_id: conversation.organization_id,
    type: "ai",
    title: "AI Handoff",
    body: `${leadName} has been handed off from AI to human support.`,
    metadata: {
      conversation_id: conversation.id,
      lead_id: conversation.lead_id,
    },
  })

  // Log activity
  await supabase.from("lead_activities").insert({
    lead_id: conversation.lead_id,
    organization_id: conversation.organization_id,
    type: "ai_handoff",
    channel: "whatsapp",
    content: `AI conversation handed off to human`,
    is_automated: true,
  })

  return { success: true, handedOff: true, reason: "handed_off" }
}
