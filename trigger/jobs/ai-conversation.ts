// trigger/jobs/ai-conversation.ts
import { task, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/lib/supabase/server"
import { generateConversationReply } from "@/lib/ai/claude"
import { sendSMS } from "@/lib/integrations/twilio"

const MAX_AI_TURNS = 3

export const aiConversationTask = task({
  id: "ai-conversation",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: { conversationId: string; messageId: string }) => {
    const { conversationId, messageId } = payload

    logger.info("Processing inbound message", { conversationId, messageId })

    const supabase = createAdminClient()

    // Fetch conversation with messages and lead
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        lead:leads(*),
        messages(*)
      `)
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      logger.error("Conversation not found", { conversationId, error: convError })
      return { success: false, error: "Conversation not found" }
    }

    // Fetch organization settings
    const { data: org } = await supabase
      .from('organizations')
      .select('name, settings')
      .eq('id', conversation.organization_id)
      .single()

    const settings = org?.settings as {
      ai_auto_reply_enabled?: boolean
      booking_link?: string
    } | null

    // Check if AI replies are enabled
    if (!settings?.ai_auto_reply_enabled) {
      logger.info("AI replies disabled", { orgId: conversation.organization_id })
      return { success: true, skipped: true, reason: "ai_disabled" }
    }

    // Count AI-generated messages
    const aiMessageCount = conversation.messages.filter(
      (m: { is_ai_generated: boolean }) => m.is_ai_generated
    ).length

    if (aiMessageCount >= MAX_AI_TURNS) {
      logger.info("Max AI turns reached, escalating", {
        conversationId,
        aiMessageCount
      })

      await supabase
        .from('lead_activities')
        .insert({
          lead_id: conversation.lead_id,
          organization_id: conversation.organization_id,
          type: 'escalated',
          content: 'AI conversation limit reached, needs human follow-up',
          is_automated: true
        })

      return { success: true, escalated: true, reason: "max_turns" }
    }

    // Build message history for Claude
    const messageHistory = conversation.messages
      .sort((a: { created_at: string }, b: { created_at: string }) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      .map((m: { direction: string; content: string }) => ({
        role: m.direction === 'inbound' ? 'user' : 'assistant',
        content: m.content
      }))

    // Generate AI reply
    logger.info("Generating AI reply")

    const aiResponse = await generateConversationReply(
      messageHistory as { role: 'user' | 'assistant'; content: string }[],
      conversation.lead,
      {
        business_name: org?.name || 'our team',
        booking_link: settings?.booking_link || ''
      }
    )

    logger.info("AI response generated", {
      intent: aiResponse.detected_intent,
      shouldEscalate: aiResponse.should_escalate
    })

    // Handle escalation
    if (aiResponse.should_escalate) {
      await supabase
        .from('lead_activities')
        .insert({
          lead_id: conversation.lead_id,
          organization_id: conversation.organization_id,
          type: 'escalated',
          content: aiResponse.escalation_reason || 'AI requested human handoff',
          is_automated: true
        })

      if (!aiResponse.reply) {
        return { success: true, escalated: true, reason: aiResponse.escalation_reason }
      }
    }

    // Send the reply via appropriate channel
    if (conversation.channel === 'sms' && conversation.lead.phone) {
      const result = await sendSMS({
        to: conversation.lead.phone,
        body: aiResponse.reply
      })

      // Store outbound message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          organization_id: conversation.organization_id,
          direction: 'outbound',
          content: aiResponse.reply,
          status: 'sent',
          external_id: result.sid,
          is_ai_generated: true
        })

      // Update conversation
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId)

      // Log activity
      await supabase
        .from('lead_activities')
        .insert({
          lead_id: conversation.lead_id,
          organization_id: conversation.organization_id,
          type: 'sms_sent',
          direction: 'outbound',
          channel: 'sms',
          content: aiResponse.reply,
          metadata: {
            message_sid: result.sid,
            is_ai_generated: true,
            detected_intent: aiResponse.detected_intent
          },
          is_automated: true
        })
    }

    // Update lead based on detected intent
    if (aiResponse.detected_intent === 'booking') {
      await supabase
        .from('leads')
        .update({
          stage: 'booked',
          booked_at: new Date().toISOString()
        })
        .eq('id', conversation.lead_id)
    } else if (aiResponse.detected_intent === 'not_interested') {
      await supabase
        .from('leads')
        .update({
          temperature: 'cold'
        })
        .eq('id', conversation.lead_id)
    }

    return {
      success: true,
      reply: aiResponse.reply,
      intent: aiResponse.detected_intent,
      escalated: aiResponse.should_escalate
    }
  }
})
