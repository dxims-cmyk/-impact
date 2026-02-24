// lib/hooks/use-campaigns.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdCampaign, AdPerformance } from '@/types/database'

interface CampaignWithMetrics extends AdCampaign {
  spent: number
  impressions: number
  clicks: number
  leads: number
  conversions: number
  revenue: number
  budget: number | null
  ctr: number
  cpc: number
  cpl: number
  roas: number
  performance?: AdPerformance | null
  integration?: {
    provider: string
    account_name: string
  }
}

interface CampaignsResponse {
  campaigns: CampaignWithMetrics[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface CampaignFilters {
  page?: number
  limit?: number
  platform?: 'meta' | 'google' | 'tiktok'
  status?: string
  search?: string
  dateRange?: {
    start: string
    end: string
  }
}

// Fetch campaigns with filters
export function useCampaigns(filters: CampaignFilters = {}) {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.platform) params.set('platform', filters.platform)
  if (filters.status) params.set('status', filters.status)
  if (filters.search) params.set('search', filters.search)
  if (filters.dateRange?.start) params.set('startDate', filters.dateRange.start)
  if (filters.dateRange?.end) params.set('endDate', filters.dateRange.end)

  return useQuery<CampaignsResponse>({
    queryKey: ['campaigns', filters],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns?${params}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch campaigns')
      }
      return res.json()
    },
  })
}

// Fetch campaign performance over time
export function useCampaignPerformance(campaignId: string | null, dateRange?: { start: string; end: string }) {
  const params = new URLSearchParams()
  if (dateRange?.start) params.set('startDate', dateRange.start)
  if (dateRange?.end) params.set('endDate', dateRange.end)

  return useQuery<AdPerformance[]>({
    queryKey: ['campaign-performance', campaignId, dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/performance?${params}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch performance')
      }
      return res.json()
    },
    enabled: !!campaignId,
  })
}

// Fetch aggregated campaign metrics
export function useCampaignMetrics(dateRange?: { start: string; end: string }) {
  const params = new URLSearchParams()
  if (dateRange?.start) params.set('startDate', dateRange.start)
  if (dateRange?.end) params.set('endDate', dateRange.end)

  return useQuery<{
    totalSpend: number
    totalLeads: number
    totalClicks: number
    totalImpressions: number
    avgCpl: number
    avgCtr: number
    avgRoas: number
    spendChange: number
    leadsChange: number
    byPlatform: {
      platform: string
      spend: number
      leads: number
      cpl: number
    }[]
    topCampaigns: {
      id: string
      name: string
      platform: string
      spend: number
      leads: number
      cpl: number
      roas: number
    }[]
  }>({
    queryKey: ['campaign-metrics', dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/metrics?${params}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch metrics')
      }
      return res.json()
    },
  })
}

// Delete one or more campaigns
export function useDeleteCampaigns() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/campaigns', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete campaigns')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaign-metrics'] })
    },
  })
}

// Sync campaigns from all connected ad integrations
export function useSyncCampaigns() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // Fetch all integrations to find connected ad platforms
      const intRes = await fetch('/api/integrations')
      if (!intRes.ok) {
        throw new Error('Failed to fetch integrations')
      }
      const integrations = await intRes.json()

      const adIntegrations = integrations.filter(
        (i: { provider: string; status: string }) =>
          ['meta_ads', 'google_ads', 'tiktok_ads'].includes(i.provider) &&
          i.status === 'connected'
      )

      if (adIntegrations.length === 0) {
        throw new Error('No connected ad integrations found')
      }

      // Sync each integration
      const results = await Promise.allSettled(
        adIntegrations.map(async (integration: { id: string }) => {
          const res = await fetch(`/api/integrations/${integration.id}/sync`, {
            method: 'POST',
          })
          if (!res.ok) {
            const error = await res.json()
            throw new Error(error.error || 'Failed to sync')
          }
          return res.json()
        })
      )

      const failures = results.filter(r => r.status === 'rejected')
      if (failures.length > 0 && failures.length === results.length) {
        throw new Error('All syncs failed')
      }

      return { synced: results.filter(r => r.status === 'fulfilled').length, total: results.length }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaign-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
  })
}
