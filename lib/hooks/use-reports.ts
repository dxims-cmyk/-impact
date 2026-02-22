// lib/hooks/use-reports.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Report } from '@/types/database'

interface ReportsResponse {
  reports: Report[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface ReportFilters {
  page?: number
  limit?: number
  type?: 'weekly' | 'monthly' | 'custom'
}

// Fetch reports with filters
export function useReports(filters: ReportFilters = {}) {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.type) params.set('type', filters.type)

  return useQuery<ReportsResponse>({
    queryKey: ['reports', filters],
    queryFn: async () => {
      const res = await fetch(`/api/reports?${params}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch reports')
      }
      return res.json()
    },
  })
}

// Fetch single report
export function useReport(id: string | null) {
  return useQuery<Report>({
    queryKey: ['report', id],
    queryFn: async () => {
      const res = await fetch(`/api/reports/${id}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch report')
      }
      return res.json()
    },
    enabled: !!id,
  })
}

// Generate new report
export function useGenerateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      type: 'weekly' | 'monthly' | 'custom'
      periodStart: string
      periodEnd: string
    }) => {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type: data.type,
          period_start: data.periodStart,
          period_end: data.periodEnd,
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to generate report')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

// Send report via email
export function useSendReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, recipients }: { id: string; recipients: string[] }) => {
      const res = await fetch(`/api/reports/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to send report')
      }
      return res.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['report', id] })
    },
  })
}

// Get latest report
export function useLatestReport(type?: 'weekly' | 'monthly') {
  const params = new URLSearchParams()
  params.set('limit', '1')
  if (type) params.set('type', type)

  return useQuery<Report | null>({
    queryKey: ['latest-report', type],
    queryFn: async () => {
      const res = await fetch(`/api/reports?${params}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch report')
      }
      const data = await res.json()
      return data.reports[0] || null
    },
  })
}
