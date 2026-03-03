'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search, ArrowLeft, Eye } from 'lucide-react'
import { SearchModal } from '@/components/dashboard/search-modal'
import { NewLeadModal } from '@/components/dashboard/new-lead-modal'
import { NotificationsDropdown } from '@/components/dashboard/notifications-dropdown'
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist'
import { HelpButton } from '@/components/help/HelpButton'
import { ForcePasswordChange } from '@/components/auth/ForcePasswordChange'
import { AccountLockoutScreen } from '@/components/dashboard/account-lockout-screen'
import { MembershipLockoutScreen } from '@/components/dashboard/membership-lockout-screen'
import { PreviewModeBanner } from '@/components/dashboard/preview-mode-banner'
import { GracePeriodBanner } from '@/components/dashboard/grace-period-banner'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { useUser } from '@/lib/hooks/use-user'
import { useMembership } from '@/lib/hooks/use-membership'
import { createClient } from '@/lib/supabase/client'
import { AdminContextProvider, useAdminContext } from '@/lib/contexts/admin-context'

function ClientViewBanner(): React.JSX.Element | null {
  const { viewingOrg, clearViewingOrg, isViewingClient } = useAdminContext()

  if (!isViewingClient || !viewingOrg) return null

  return (
    <div className="bg-impact/90 text-ivory px-4 py-2 flex items-center justify-between text-sm sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4" />
        <span>
          Viewing: <strong>{viewingOrg.name}</strong>
          <span className="ml-2 text-xs opacity-75">
            ({viewingOrg.plan === 'pro' ? 'Pro' : 'Core'})
          </span>
        </span>
      </div>
      <button
        onClick={clearViewingOrg}
        className="flex items-center gap-1 px-3 py-1 rounded bg-ivory/20 hover:bg-ivory/30 transition-colors text-xs font-medium"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to Admin
      </button>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminContextProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </AdminContextProvider>
  )
}

function DashboardLayoutInner({
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
  const { status: membershipStatus, isPreview, isPastDue, isPaused, isSuspended, isCancelled, daysUntilExpiry, paymentMethod } = useMembership()
  const isAgency = currentUser?.is_agency_user === true
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
        {/* Client View Banner */}
        <ClientViewBanner />

        {/* Preview Mode Banner */}
        {!isAgency && isPreview && <PreviewModeBanner />}

        {/* Grace Period Warning Banner */}
        {!isAgency && isPastDue && <GracePeriodBanner daysLeft={daysUntilExpiry} paymentMethod={paymentMethod} />}

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
      {currentUser?.organization?.account_status && currentUser.organization.account_status !== 'active' && !isAgency && (
        <AccountLockoutScreen reason={currentUser.organization.account_lock_reason} />
      )}

      {/* Membership lockout - blocks non-agency users when membership is paused/suspended/cancelled */}
      {!isAgency && (isPaused || isSuspended || isCancelled) && currentUser?.organization?.account_status === 'active' && (
        <MembershipLockoutScreen status={membershipStatus} paymentMethod={paymentMethod} />
      )}
    </div>
  )
}
