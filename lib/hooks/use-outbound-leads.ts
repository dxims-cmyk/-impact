// lib/hooks/use-outbound-leads.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdminOrg } from './use-admin-org'

export interface OutboundLead {
  id: string
  organization_id: string
  created_by: string | null
  business_name: string
  phone: string | null
  website: string | null
  address: string | null
  rating: number | null
  reviews_count: number | null
  category: string | null
  place_id: string | null
  status: 'to_call' | 'called' | 'interested' | 'booked' | 'closed' | 'dead'
  notes: string | null
  search_term: string | null
  search_location: string | null
  created_at: string
  updated_at: string
}

interface OutboundLeadsResponse {
  leads: OutboundLead[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface OutboundLeadFilters {
  page?: number
  limit?: number
  status?: string
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export function useOutboundLeads(filters: OutboundLeadFilters = {}) {
  const { orgId } = useAdminOrg()
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.status) params.set('status', filters.status)
  if (filters.search) params.set('search', filters.search)
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.order) params.set('order', filters.order)
  if (orgId) params.set('org', orgId)

  return useQuery<OutboundLeadsResponse>({
    queryKey: ['outbound-leads', filters, orgId],
    queryFn: async () => {
      const res = await fetch(`/api/outbound-leads?${params}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch outbound leads')
      }
      return res.json()
    },
  })
}

export function useUpdateOutboundLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status?: string; notes?: string }) => {
      const res = await fetch('/api/outbound-leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, notes }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-leads'] })
    },
  })
}

export function useDeleteOutboundLeads() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/outbound-leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-leads'] })
    },
  })
}

export function useSearchPlaces() {
  return useMutation({
    mutationFn: async ({ searchTerm, location, count }: { searchTerm: string; location: string; count: number }) => {
      const res = await fetch('/api/outbound-leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm, location, count }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to start search')
      }
      return res.json()
    },
  })
}

export function useImportOutboundLeads() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ results, searchTerm, searchLocation }: { results: Record<string, unknown>[]; searchTerm: string; searchLocation: string }) => {
      const res = await fetch('/api/outbound-leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results, searchTerm, searchLocation }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to import')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-leads'] })
    },
  })
}
