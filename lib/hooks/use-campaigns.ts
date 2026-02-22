// lib/hooks/use-campaigns.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdCampaign, AdPerformance } from '@/types/database'

interface CampaignsResponse {
  campaigns: (AdCampaign & {
    performance?: AdPerformance
    integration?: {
      provider: string
      account_name: string
    }
  })[]
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

// Sync campaigns from integration
export function useSyncCampaigns() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (integrationId: string) => {
      const res = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to sync campaigns')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaign-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
  })
}
