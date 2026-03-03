// lib/hooks/use-organization.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Organization, User } from '@/types/database'
import { useAdminOrg } from './use-admin-org'

// Fetch current organization (or viewed client org for admin)
export function useOrganization() {
  const { orgId } = useAdminOrg()
  const params = new URLSearchParams()
  if (orgId) params.set('org', orgId)

  return useQuery<Organization>({
    queryKey: ['organization', orgId],
    queryFn: async () => {
      const res = await fetch(`/api/settings/organization?${params}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch organization')
      }
      return res.json()
    },
  })
}

// Update organization settings
export function useUpdateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      name?: string
      logoUrl?: string
      settings?: Record<string, unknown>
    }) => {
      const res = await fetch('/api/settings/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          logo_url: data.logoUrl,
          settings: data.settings,
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update organization')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

// Fetch team members
export function useTeamMembers() {
  return useQuery<User[]>({
    queryKey: ['team-members'],
    queryFn: async () => {
      const res = await fetch('/api/team')
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch team')
      }
      return res.json()
    },
  })
}

// Invite team member
export function useInviteTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      email: string
      role: 'admin' | 'member' | 'viewer'
    }) => {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to invite member')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
  })
}

// Update team member role
export function useUpdateTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: 'admin' | 'member' | 'viewer' }) => {
      const res = await fetch(`/api/team/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update member')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
  })
}

// Remove team member
export function useRemoveTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/team/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to remove member')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
  })
}

// Note: Integration hooks moved to use-integrations.ts
