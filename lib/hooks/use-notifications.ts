// lib/hooks/use-notifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Notification } from '@/types/database'

interface NotificationsResponse {
  notifications: Notification[]
  total: number
  unreadCount: number
}

// Fetch notifications
export function useNotifications(limit: number = 20) {
  return useQuery<NotificationsResponse>({
    queryKey: ['notifications', { limit }],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?limit=${limit}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch notifications')
      }
      return res.json()
    },
    refetchInterval: 60_000, // Poll every 60s as fallback
  })
}

// Mark specific notifications as read
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to mark as read')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// Mark all notifications as read
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to mark all as read')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
