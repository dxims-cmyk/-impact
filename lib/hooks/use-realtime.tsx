// lib/hooks/use-realtime.ts
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { Lead, Message, Appointment, Notification } from '@/types/database'

interface RealtimeContextType {
  isConnected: boolean
  subscribeToLeads: (callback: (lead: Lead) => void) => () => void
  subscribeToMessages: (conversationId: string, callback: (message: Message) => void) => () => void
  subscribeToAppointments: (callback: (appointment: Appointment) => void) => () => void
  subscribeToNotifications: (callback: (notification: Notification) => void) => () => void
}

const RealtimeContext = createContext<RealtimeContextType | null>(null)

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    // Set up connection status tracking
    const channel = supabase.channel('system')

    channel
      .on('system', { event: 'status' }, (payload) => {
        setIsConnected(payload.status === 'SUBSCRIBED')
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Auto-subscribe to core tables so all pages get live updates
  useEffect(() => {
    const coreChannel = supabase
      .channel('core-changes')
      .on<Lead>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['leads'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
          if (payload.eventType !== 'DELETE' && payload.new?.id) {
            queryClient.invalidateQueries({ queryKey: ['lead', payload.new.id] })
          }
        }
      )
      .on<Appointment>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['appointments'] })
        }
      )
      .on<Notification>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(coreChannel)
    }
  }, [supabase, queryClient])

  // Subscribe to new leads
  const subscribeToLeads = (callback: (lead: Lead) => void) => {
    const channel = supabase
      .channel('leads-changes')
      .on<Lead>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          callback(payload.new)
          // Invalidate leads queries
          queryClient.invalidateQueries({ queryKey: ['leads'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
        }
      )
      .on<Lead>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          // Invalidate specific lead and list queries
          queryClient.invalidateQueries({ queryKey: ['lead', payload.new.id] })
          queryClient.invalidateQueries({ queryKey: ['leads'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  // Subscribe to messages in a conversation
  const subscribeToMessages = (conversationId: string, callback: (message: Message) => void) => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on<Message>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new)
          // Invalidate messages queries
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
          queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  // Subscribe to appointments
  const subscribeToAppointments = (callback: (appointment: Appointment) => void) => {
    const channel = supabase
      .channel('appointments-changes')
      .on<Appointment>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            callback(payload.new)
          }
          // Invalidate appointments queries
          queryClient.invalidateQueries({ queryKey: ['appointments'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  // Subscribe to notifications
  const subscribeToNotifications = (callback: (notification: Notification) => void) => {
    const channel = supabase
      .channel('notifications-changes')
      .on<Notification>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          callback(payload.new)
          // Invalidate notifications queries
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        subscribeToLeads,
        subscribeToMessages,
        subscribeToAppointments,
        subscribeToNotifications,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

// Hook for subscribing to new hot leads (for notifications)
export function useHotLeadNotifications(onHotLead: (lead: Lead) => void) {
  const { subscribeToLeads } = useRealtime()

  useEffect(() => {
    const unsubscribe = subscribeToLeads((lead) => {
      if (lead.temperature === 'hot') {
        onHotLead(lead)
      }
    })

    return unsubscribe
  }, [subscribeToLeads, onHotLead])
}

// Hook for conversation messages with auto-subscription
export function useRealtimeMessages(conversationId: string | null) {
  const { subscribeToMessages } = useRealtime()
  const [newMessages, setNewMessages] = useState<Message[]>([])

  useEffect(() => {
    if (!conversationId) return

    const unsubscribe = subscribeToMessages(conversationId, (message) => {
      setNewMessages((prev) => [...prev, message])
    })

    return () => {
      unsubscribe()
      setNewMessages([])
    }
  }, [conversationId, subscribeToMessages])

  return { newMessages, clearNewMessages: () => setNewMessages([]) }
}
