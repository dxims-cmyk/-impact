// lib/hooks/use-automations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Automation,
  AutomationAction,
} from '@/types/database'

// Response types
interface AutomationsResponse {
  automations: (Automation & { action_count: number; recent_run_count: number })[]
  total: number
}

interface AutomationWithActions extends Automation {
  actions: AutomationAction[]
}

interface CreateAutomationInput {
  name: string
  description?: string
  trigger_type: Automation['trigger_type']
  trigger_config?: Record<string, unknown>
  actions?: {
    action_type: AutomationAction['action_type']
    action_config?: Record<string, unknown>
    action_order: number
  }[]
}

interface UpdateAutomationInput {
  name?: string
  description?: string | null
  trigger_type?: Automation['trigger_type']
  trigger_config?: Record<string, unknown>
}

// Fetch automations list
export function useAutomations(opts?: { active?: boolean }) {
  const params = new URLSearchParams()
  if (opts?.active === true) params.set('active', 'true')
  if (opts?.active === false) params.set('active', 'false')

  return useQuery<AutomationsResponse>({
    queryKey: ['automations', opts],
    queryFn: async () => {
      const res = await fetch(`/api/automations?${params}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch automations')
      }
      return res.json()
    },
  })
}

// Fetch single automation with actions
export function useAutomation(id: string) {
  return useQuery<AutomationWithActions>({
    queryKey: ['automation', id],
    queryFn: async () => {
      const res = await fetch(`/api/automations/${id}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch automation')
      }
      return res.json()
    },
    enabled: !!id,
  })
}

// Create automation
export function useCreateAutomation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAutomationInput) => {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create automation')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] })
    },
  })
}

// Update automation
export function useUpdateAutomation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAutomationInput }) => {
      const res = await fetch(`/api/automations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update automation')
      }
      return res.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['automations'] })
      queryClient.invalidateQueries({ queryKey: ['automation', id] })
    },
  })
}

// Delete automation
export function useDeleteAutomation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/automations/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete automation')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] })
    },
  })
}

// Toggle automation active/inactive
export function useToggleAutomation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/automations/${id}/toggle`, {
        method: 'POST',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to toggle automation')
      }
      return res.json()
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['automations'] })
      queryClient.invalidateQueries({ queryKey: ['automation', id] })
    },
  })
}

// Add action to automation
export function useAddAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      automationId,
      data,
    }: {
      automationId: string
      data: {
        action_type: AutomationAction['action_type']
        action_config?: Record<string, unknown>
        action_order?: number
      }
    }) => {
      const res = await fetch(`/api/automations/${automationId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to add action')
      }
      return res.json()
    },
    onSuccess: (_, { automationId }) => {
      queryClient.invalidateQueries({ queryKey: ['automations'] })
      queryClient.invalidateQueries({ queryKey: ['automation', automationId] })
    },
  })
}

// Update action
export function useUpdateAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      automationId,
      actionId,
      data,
    }: {
      automationId: string
      actionId: string
      data: {
        action_type?: AutomationAction['action_type']
        action_config?: Record<string, unknown>
        action_order?: number
      }
    }) => {
      const res = await fetch(`/api/automations/${automationId}/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update action')
      }
      return res.json()
    },
    onSuccess: (_, { automationId }) => {
      queryClient.invalidateQueries({ queryKey: ['automations'] })
      queryClient.invalidateQueries({ queryKey: ['automation', automationId] })
    },
  })
}

// Delete action
export function useDeleteAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      automationId,
      actionId,
    }: {
      automationId: string
      actionId: string
    }) => {
      const res = await fetch(`/api/automations/${automationId}/actions/${actionId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete action')
      }
      return res.json()
    },
    onSuccess: (_, { automationId }) => {
      queryClient.invalidateQueries({ queryKey: ['automations'] })
      queryClient.invalidateQueries({ queryKey: ['automation', automationId] })
    },
  })
}

// Reorder actions
export function useReorderActions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      automationId,
      actions,
    }: {
      automationId: string
      actions: { id: string; action_order: number }[]
    }) => {
      const res = await fetch(`/api/automations/${automationId}/actions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to reorder actions')
      }
      return res.json()
    },
    onSuccess: (_, { automationId }) => {
      queryClient.invalidateQueries({ queryKey: ['automations'] })
      queryClient.invalidateQueries({ queryKey: ['automation', automationId] })
    },
  })
}
