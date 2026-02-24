// lib/hooks/use-calls.ts
import { useQuery } from '@tanstack/react-query'

export interface Call {
  id: string
  organization_id: string
  lead_id: string | null
  vapi_call_id: string
  phone_number: string | null
  caller_name: string | null
  direction: string
  duration_seconds: number | null
  status: string
  transcript: string | null
  recording_url: string | null
  summary: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  ended_at: string | null
  lead?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    stage: string
    temperature: string | null
    score: number | null
  } | null
}

interface CallsResponse {
  calls: Call[]
  pagination: {
    limit: number
    offset: number
    total: number
  }
}

interface CallFilters {
  status?: string
  limit?: number
  offset?: number
  from?: string
  to?: string
}

// Fetch calls with optional filters
export function useCalls(filters: CallFilters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.offset) params.set('offset', String(filters.offset))
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)

  return useQuery<CallsResponse>({
    queryKey: ['calls', filters],
    queryFn: async () => {
      const res = await fetch(`/api/calls?${params}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch calls')
      }
      return res.json()
    },
  })
}
