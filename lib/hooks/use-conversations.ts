// lib/hooks/use-conversations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Conversation, Message, MessageInsert } from '@/types/database'
import { useAdminOrg } from './use-admin-org'

interface ConversationsResponse {
  conversations: (Conversation & {
    lead: {
      id: string
      first_name: string | null
      last_name: string | null
      email: string | null
      phone: string | null
      company: string | null
      temperature: string | null
      score: number | null
    }
    messages: Message[]
  })[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ConversationFilters {
  page?: number
  limit?: number
  status?: 'open' | 'closed' | 'snoozed'
  channel?: 'email' | 'sms' | 'whatsapp' | 'instagram_dm' | 'messenger' | string
  search?: string
}

// Fetch conversations with filters
export function useConversations(filters: ConversationFilters = {}) {
  const { orgId } = useAdminOrg()
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.status) params.set('status', filters.status)
  if (filters.channel) params.set('channel', filters.channel)
  if (filters.search) params.set('search', filters.search)
  if (orgId) params.set('org', orgId)

  return useQuery<ConversationsResponse>({
    queryKey: ['conversations', filters, orgId],
    queryFn: async () => {
      const res = await fetch(`/api/conversations?${params}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch conversations')
      }
      return res.json()
    },
  })
}

// Fetch single conversation with messages
export function useConversation(id: string | null) {
  return useQuery<Conversation & {
    lead: {
      id: string
      first_name: string | null
      last_name: string | null
      email: string | null
      phone: string | null
      company: string | null
      temperature: string | null
      score: number | null
    }
    messages: Message[]
  }>({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${id}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch conversation')
      }
      return res.json()
    },
    enabled: !!id,
  })
}

// Fetch messages for a conversation
export function useMessages(conversationId: string | null) {
  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch messages')
      }
      return res.json()
    },
    enabled: !!conversationId,
  })
}

// Create conversation
export function useCreateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { leadId: string; channel: 'email' | 'sms' | 'whatsapp' }) => {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create conversation')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

// Send message
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ conversationId, content, channel }: { conversationId: string; content: string; channel?: string }) => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, ...(channel ? { channel } : {}) }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to send message')
      }
      return res.json()
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (error: Error) => {
      console.error('Failed to send message:', error.message)
    },
  })
}

// Generate AI reply
export function useGenerateAIReply() {
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await fetch(`/api/conversations/${conversationId}/ai-reply`, {
        method: 'POST',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to generate AI reply')
      }
      return res.json()
    },
    onError: (error: Error) => {
      console.error('Failed to generate AI reply:', error.message)
    },
  })
}

// Update conversation status
export function useUpdateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'open' | 'closed' | 'snoozed' }) => {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update conversation')
      }
      return res.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['conversation', id] })
    },
  })
}

// Mark messages as read
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'POST',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to mark as read')
      }
      return res.json()
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
    },
  })
}
