// lib/hooks/use-integrations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Integration {
  id: string
  provider: 'meta_ads' | 'google_ads' | 'tiktok_ads' | 'twilio' | 'resend' | 'slack' | 'calendly'
  status: 'connected' | 'disconnected' | 'error'
  account_name: string | null
  account_id: string | null
  last_sync_at: string | null
  sync_error: string | null
  metadata?: Record<string, unknown>
  created_at: string
}

// Fetch all integrations
export function useIntegrations() {
  return useQuery<Integration[]>({
    queryKey: ['integrations'],
    queryFn: async () => {
      const res = await fetch('/api/integrations')
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch integrations')
      }
      return res.json()
    },
  })
}

// Fetch single integration
export function useIntegration(id: string | null) {
  return useQuery<Integration>({
    queryKey: ['integration', id],
    queryFn: async () => {
      const res = await fetch(`/api/integrations/${id}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch integration')
      }
      return res.json()
    },
    enabled: !!id,
  })
}

// Disconnect integration
export function useDisconnectIntegration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/integrations/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to disconnect integration')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
  })
}

// Sync integration
export function useSyncIntegration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/integrations/${id}/sync`, {
        method: 'POST',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to sync integration')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
  })
}

// Navigate to OAuth connect URL (these routes do server-side redirects)
export function useConnectIntegration() {
  return useMutation({
    mutationFn: async (provider: 'meta_ads' | 'google_ads' | 'tiktok_ads') => {
      const providerPath = provider.replace('_ads', '')
      window.location.href = `/api/integrations/${providerPath}/connect`
      return providerPath
    },
  })
}
