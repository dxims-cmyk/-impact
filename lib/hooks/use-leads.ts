// lib/hooks/use-leads.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Lead, LeadActivity, LeadInsert, LeadUpdate } from '@/types/database'

interface LeadsResponse {
  leads: Lead[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface LeadFilters {
  page?: number
  limit?: number
  stage?: string
  temperature?: string
  source?: string
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
  org?: string // for agency users
}

// Fetch leads with filters and pagination
export function useLeads(filters: LeadFilters = {}) {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.stage) params.set('stage', filters.stage)
  if (filters.temperature) params.set('temperature', filters.temperature)
  if (filters.source) params.set('source', filters.source)
  if (filters.search) params.set('search', filters.search)
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.order) params.set('order', filters.order)
  if (filters.org) params.set('org', filters.org)

  return useQuery<LeadsResponse>({
    queryKey: ['leads', filters],
    queryFn: async () => {
      const res = await fetch(`/api/leads?${params}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch leads')
      }
      return res.json()
    },
  })
}

// Fetch single lead by ID
export function useLead(id: string | null) {
  return useQuery<Lead & { assigned_user?: { full_name: string; avatar_url: string } }>({
    queryKey: ['lead', id],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${id}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch lead')
      }
      return res.json()
    },
    enabled: !!id,
  })
}

// Fetch lead timeline/activities
export function useLeadTimeline(leadId: string | null) {
  return useQuery<LeadActivity[]>({
    queryKey: ['lead-timeline', leadId],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${leadId}/timeline`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch timeline')
      }
      return res.json()
    },
    enabled: !!leadId,
  })
}

// Create lead mutation
export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: LeadInsert) => {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create lead')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

// Update lead mutation
export function useUpdateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LeadUpdate }) => {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update lead')
      }
      return res.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
    },
  })
}

// Delete lead mutation
export function useDeleteLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete lead')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

// Manual AI qualification
export function useQualifyLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leads/${id}/qualify`, {
        method: 'POST',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to qualify lead')
      }
      return res.json()
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
      queryClient.invalidateQueries({ queryKey: ['lead-timeline', id] })
    },
  })
}

// Dashboard metrics hook
export function useDashboardMetrics() {
  return useQuery<{
    leads: number
    leadsChange: number
    cpl: number
    cplChange: number
    booked: number
    bookedChange: number
    roas: number
    roasChange: number
    pipeline: { stage: string; count: number }[]
    recentLeads: Lead[]
  }>({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/metrics')
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch metrics')
      }
      return res.json()
    },
  })
}
