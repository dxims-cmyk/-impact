'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { SearchModal } from '@/components/dashboard/search-modal'
import { NewLeadModal } from '@/components/dashboard/new-lead-modal'
import { NotificationsDropdown } from '@/components/dashboard/notifications-dropdown'
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist'
import { HelpButton } from '@/components/help/HelpButton'
import { ForcePasswordChange } from '@/components/auth/ForcePasswordChange'
import { AccountLockoutScreen } from '@/components/dashboard/account-lockout-screen'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { useUser } from '@/lib/hooks/use-user'
import { createClient } from '@/lib/supabase/client'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [newLeadOpen, setNewLeadOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const { data: currentUser } = useUser()
  const supabase = createClient()

  // Check if user must change password (first login)
  useEffect(() => {
    const checkPasswordFlag = async (): Promise<void> => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser?.user_metadata?.must_change_password) {
        setMustChangePassword(true)
      }
    }
    checkPasswordFlag()
  }, [])

  // Listen for onboarding reopen events (from HelpButton)
  useEffect(() => {
    const handler = (): void => setShowOnboarding(true)
    window.addEventListener('onboarding-reopen', handler)
    return () => window.removeEventListener('onboarding-reopen', handler)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        setNewLeadOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen flex bg-[#FAF8F5]">
      {/* Animated Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
          {/* Search */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-400 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1">Search leads, conversations...</span>
              <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-xs text-gray-500">
                <span className="text-xs">Ctrl+</span>K
              </kbd>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <NotificationsDropdown
              isOpen={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
              onToggle={() => setNotificationsOpen(!notificationsOpen)}
            />
            <button
              onClick={() => setNewLeadOpen(true)}
              className="btn-primary text-sm px-4 py-2"
            >
              + New Lead
            </button>
          </div>
        </header>

        {/* Modals */}
        <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        <NewLeadModal isOpen={newLeadOpen} onClose={() => setNewLeadOpen(false)} />

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>

      {/* Onboarding Checklist */}
      <OnboardingChecklist forceOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />

      {/* Help Button */}
      <HelpButton />

      {/* Force password change modal */}
      {mustChangePassword && (
        <ForcePasswordChange onComplete={() => setMustChangePassword(false)} />
      )}

      {/* Account lockout screen - blocks non-agency users when org is locked/suspended */}
      {currentUser?.organization?.account_status && currentUser.organization.account_status !== 'active' && !currentUser.is_agency_user && (
        <AccountLockoutScreen reason={currentUser.organization.account_lock_reason} />
      )}
    </div>
  )
}
