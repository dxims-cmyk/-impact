'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useUser } from '@/lib/hooks/use-user'
import { useQueryClient } from '@tanstack/react-query'

export interface ViewingOrg {
  id: string
  name: string
  plan: 'core' | 'pro'
}

interface AdminContextType {
  viewingOrg: ViewingOrg | null
  setViewingOrg: (org: ViewingOrg) => void
  clearViewingOrg: () => void
  isViewingClient: boolean
}

const AdminContext = createContext<AdminContextType>({
  viewingOrg: null,
  setViewingOrg: () => {},
  clearViewingOrg: () => {},
  isViewingClient: false,
})

const STORAGE_KEY = 'impact-admin-viewing-org'

export function AdminContextProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { data: user } = useUser()
  const queryClient = useQueryClient()
  const [viewingOrg, setViewingOrgState] = useState<ViewingOrg | null>(null)

  // Restore from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        setViewingOrgState(JSON.parse(stored))
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  // Only allow if agency user
  const isAgency = user?.is_agency_user === true

  const setViewingOrg = useCallback((org: ViewingOrg): void => {
    if (!isAgency) return
    setViewingOrgState(org)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(org))
    // Invalidate all data queries so they refetch with new org
    queryClient.invalidateQueries()
  }, [isAgency, queryClient])

  const clearViewingOrg = useCallback((): void => {
    setViewingOrgState(null)
    sessionStorage.removeItem(STORAGE_KEY)
    queryClient.invalidateQueries()
  }, [queryClient])

  // If user isn't agency, force clear
  const effectiveViewingOrg = isAgency ? viewingOrg : null

  return (
    <AdminContext.Provider
      value={{
        viewingOrg: effectiveViewingOrg,
        setViewingOrg,
        clearViewingOrg,
        isViewingClient: effectiveViewingOrg !== null,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdminContext(): AdminContextType {
  return useContext(AdminContext)
}
