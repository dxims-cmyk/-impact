// lib/hooks/use-admin-org.ts
import { useAdminContext, type ViewingOrg } from '@/lib/contexts/admin-context'

/**
 * Hook for data hooks to get the org param when admin is viewing a client.
 * Returns orgParam string to append to URL params, the viewingOrg, and a boolean.
 */
export function useAdminOrg(): {
  orgParam: string
  orgId: string | null
  viewingOrg: ViewingOrg | null
  isViewingClient: boolean
} {
  const { viewingOrg, isViewingClient } = useAdminContext()

  return {
    orgParam: viewingOrg ? `org=${viewingOrg.id}` : '',
    orgId: viewingOrg?.id ?? null,
    viewingOrg,
    isViewingClient,
  }
}
