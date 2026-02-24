// lib/hooks/use-integrations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type IntegrationProvider =
  | 'meta_ads' | 'google_ads' | 'tiktok_ads'
  | 'twilio' | 'resend' | 'slack' | 'calcom'
  | 'whatsapp' | 'zapier' | 'google_calendar'
  | 'vapi' | 'stripe' | 'calendly' | 'xero' | 'manychat'

export interface Integration {
  id: string
  provider: IntegrationProvider
  status: 'connected' | 'disconnected' | 'error'
  account_name: string | null
  account_id: string | null
  last_sync_at: string | null
  sync_error: string | null
  metadata?: Record<string, unknown>
  created_at: string
}

export interface IntegrationAvailability {
  provider: string
  status: 'available' | 'coming_soon' | 'env_configured'
}

// Fetch all integrations for this org
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

// Fetch which integrations have platform credentials configured
export function useIntegrationAvailability() {
  return useQuery<IntegrationAvailability[]>({
    queryKey: ['integrations-availability'],
    queryFn: async () => {
      const res = await fetch('/api/integrations/available')
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch availability')
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

// Provider path mapping for OAuth redirects
const providerPaths: Record<string, string> = {
  meta_ads: 'meta',
  google_ads: 'google',
  tiktok_ads: 'tiktok',
  slack: 'slack',
  google_calendar: 'google-calendar',
  stripe: 'stripe',
  calendly: 'calendly',
  xero: 'xero',
}

// Navigate to OAuth connect URL (server-side redirect to provider)
export function useConnectIntegration() {
  return useMutation({
    mutationFn: async (provider: IntegrationProvider) => {
      const path = providerPaths[provider]
      if (!path) throw new Error(`No OAuth flow for ${provider}`)
      window.location.href = `/api/integrations/${path}/connect`
      return path
    },
  })
}

// Save Zapier webhook URL to org settings AND register the integration
export function useSaveZapierWebhook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (webhookUrl: string) => {
      // 1. Save webhook URL to org settings
      const settingsRes = await fetch('/api/settings/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            zapier_webhook_url: webhookUrl,
            zapier_enabled: true,
          },
        }),
      })
      if (!settingsRes.ok) {
        const error = await settingsRes.json()
        throw new Error(error.error || 'Failed to save webhook URL')
      }

      // 2. Register integration row so it shows as connected
      const regRes = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'zapier',
          account_name: 'Zapier Webhook',
          metadata: { webhook_url: webhookUrl },
        }),
      })
      if (!regRes.ok) {
        const error = await regRes.json()
        throw new Error(error.error || 'Failed to register integration')
      }

      return regRes.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] })
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
  })
}

// Register a non-OAuth integration (Cal.com webhook, etc.)
export function useRegisterIntegration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      provider: 'calcom' | 'zapier' | 'manychat' | 'vapi'
      account_name?: string
      metadata?: Record<string, unknown>
    }) => {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to register integration')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
  })
}

// Verify Cal.com webhook is actually configured
export function useVerifyCalcom() {
  return useMutation({
    mutationFn: async (): Promise<{ verified: boolean; reason?: string; webhooks?: number }> => {
      const res = await fetch('/api/integrations/calcom/verify', { method: 'POST' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to verify')
      }
      return res.json()
    },
  })
}
