// lib/hooks/use-user.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User } from '@/types/database'

// Fetch current user
export function useUser() {
  return useQuery<User & {
    organization?: {
      id: string
      name: string
      slug: string
      subscription_tier: string
    }
  }>({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await fetch('/api/user')
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch user')
      }
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })
}

// Update user profile
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      fullName?: string
      avatarUrl?: string
      phone?: string
      jobTitle?: string
    }) => {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: data.fullName,
          avatar_url: data.avatarUrl,
          phone: data.phone,
          job_title: data.jobTitle,
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update profile')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

// Change password
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: {
      currentPassword: string
      newPassword: string
    }) => {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: data.currentPassword,
          new_password: data.newPassword,
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to change password')
      }
      return res.json()
    },
  })
}

// Get notification preferences
export function useNotificationPreferences() {
  return useQuery<{
    new_lead: { email: boolean; push: boolean; sms: boolean }
    hot_lead: { email: boolean; push: boolean; sms: boolean }
    message: { email: boolean; push: boolean; sms: boolean }
    appointment: { email: boolean; push: boolean; sms: boolean }
    report: { email: boolean; push: boolean; sms: boolean }
    system: { email: boolean; push: boolean; sms: boolean }
  }>({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const res = await fetch('/api/settings/notifications')
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch preferences')
      }
      return res.json()
    },
  })
}

// Update notification preferences
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (preferences: Record<string, { email?: boolean; push?: boolean; sms?: boolean }>) => {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update preferences')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
    },
  })
}
