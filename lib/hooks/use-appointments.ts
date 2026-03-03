// lib/hooks/use-appointments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Appointment } from '@/types/database'
import { useAdminOrg } from './use-admin-org'

interface AppointmentsResponse {
  appointments: (Appointment & {
    lead?: {
      id: string
      first_name: string | null
      last_name: string | null
      email: string | null
      phone: string | null
      company: string | null
    }
  })[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface AppointmentFilters {
  page?: number
  limit?: number
  status?: string
  startDate?: string
  endDate?: string
  leadId?: string
}

// Fetch appointments with filters
export function useAppointments(filters: AppointmentFilters = {}) {
  const { orgId } = useAdminOrg()
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.status) params.set('status', filters.status)
  if (filters.startDate) params.set('startDate', filters.startDate)
  if (filters.endDate) params.set('endDate', filters.endDate)
  if (filters.leadId) params.set('leadId', filters.leadId)
  if (orgId) params.set('org', orgId)

  return useQuery<AppointmentsResponse>({
    queryKey: ['appointments', filters, orgId],
    queryFn: async () => {
      const res = await fetch(`/api/appointments?${params}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch appointments')
      }
      return res.json()
    },
  })
}

// Fetch single appointment
export function useAppointment(id: string | null) {
  return useQuery<Appointment & {
    lead?: {
      id: string
      first_name: string | null
      last_name: string | null
      email: string | null
      phone: string | null
    }
  }>({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const res = await fetch(`/api/appointments/${id}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch appointment')
      }
      return res.json()
    },
    enabled: !!id,
  })
}

// Create appointment
export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      title: string
      description?: string
      startTime: string
      endTime: string
      timezone?: string
      leadId?: string
    }) => {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          start_time: data.startTime,
          end_time: data.endTime,
          timezone: data.timezone || 'Europe/London',
          lead_id: data.leadId,
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create appointment')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

// Update appointment
export function useUpdateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: string
      data: {
        title?: string
        description?: string
        startTime?: string
        endTime?: string
        status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
        cancelReason?: string
      }
    }) => {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          start_time: data.startTime,
          end_time: data.endTime,
          status: data.status,
          cancel_reason: data.cancelReason,
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update appointment')
      }
      return res.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointment', id] })
    },
  })
}

// Delete appointment
export function useDeleteAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete appointment')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

// Calendar view helper - fetch by date range
export function useCalendarAppointments(startDate: string, endDate: string) {
  return useAppointments({
    startDate,
    endDate,
    limit: 100, // Get all appointments in range
  })
}
