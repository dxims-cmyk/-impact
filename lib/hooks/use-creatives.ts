// lib/hooks/use-creatives.ts
import { useQuery } from '@tanstack/react-query'
import { useOrganization } from './use-organization'

interface Creative {
  id: string
  organization_id: string
  name: string
  type: string
  platform: string
  file_url: string | null
  thumbnail_url: string | null
  campaign_id: string | null
  spend: number
  impressions: number
  clicks: number
  leads_count: number
  revenue: number
  roas: number
  status: string
  recommendation: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export function useCreatives(): {
  creatives: Creative[]
  isLoading: boolean
  error: unknown
  refetch: () => void
} {
  const { data: organization } = useOrganization()
  const orgId = organization?.id

  const { data, error, isLoading, refetch } = useQuery<{ creatives: Creative[] }>({
    queryKey: ['creatives', orgId],
    queryFn: async () => {
      const res = await fetch(`/api/creatives?org=${orgId}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to fetch creatives')
      }
      return res.json()
    },
    enabled: !!orgId,
  })

  return {
    creatives: data?.creatives || [],
    isLoading,
    error,
    refetch,
  }
}
