// lib/hooks/use-addons.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePlan } from './use-plan'
import { ADDONS, type AddonKey, isIncludedInPlan } from '../addons'

export interface AccountAddon {
  id: string
  organization_id: string
  addon_key: AddonKey
  stripe_subscription_id: string | null
  status: 'active' | 'cancelled' | 'past_due'
  granted_by: string | null
  created_at: string
  updated_at: string
}

export function useAccountAddons() {
  return useQuery<AccountAddon[]>({
    queryKey: ['addons'],
    queryFn: async () => {
      const res = await fetch('/api/addons')
      if (!res.ok) return []
      return res.json()
    },
  })
}

export function useHasAddon(addonKey: AddonKey): boolean {
  const { plan } = usePlan()
  const { data: addons } = useAccountAddons()

  if (isIncludedInPlan(plan, addonKey)) return true

  return addons?.some(
    (a) => a.addon_key === addonKey && a.status === 'active'
  ) ?? false
}

export function usePurchaseAddon() {
  return useMutation({
    mutationFn: async (addonKey: AddonKey) => {
      const res = await fetch('/api/addons/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addon_key: addonKey }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create checkout')
      }
      return res.json() as Promise<{ url: string }>
    },
  })
}

export function useCancelAddon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (addonKey: AddonKey) => {
      const res = await fetch('/api/addons/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addon_key: addonKey }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to cancel')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addons'] })
    },
  })
}
