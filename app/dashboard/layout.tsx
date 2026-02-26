'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/use-user'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  BarChart3,
  FileText,
  FormInput,
  Settings,
  Plug,
  LogOut,
  Zap,
  Search,
  Bell,
  Phone,
  Shield,
  HelpCircle,
  Menu,
  X,
  Images,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { SearchModal } from '@/components/dashboard/search-modal'
import { NewLeadModal } from '@/components/dashboard/new-lead-modal'
import { NotificationsDropdown } from '@/components/dashboard/notifications-dropdown'
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist'
import { HelpButton } from '@/components/help/HelpButton'
import { ForcePasswordChange } from '@/components/auth/ForcePasswordChange'
import { usePlan } from '@/lib/hooks/use-plan'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/dashboard/leads', icon: Users },
  { name: 'Conversations', href: '/dashboard/conversations', icon: MessageSquare },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Calls', href: '/dashboard/calls', icon: Phone },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: BarChart3 },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Gallery', href: '/dashboard/gallery', icon: Images },
  { name: 'Automations', href: '/dashboard/automations', icon: Zap },
  { name: 'Integrations', href: '/dashboard/integrations', icon: Plug },
  { name: 'Forms', href: '/dashboard/settings/forms', icon: FormInput },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [newLeadOpen, setNewLeadOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const supabase = createClient()
  
  // Get real user data
  const { data: user, isLoading: userLoading } = useUser()
  
  // Derive display values from real data
  const userName = user?.full_name || user?.email?.split('@')[0] || 'User'
  const userEmail = user?.email || ''
  const userInitials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'
  const orgName = user?.organization?.name || 'No Organization'
  const orgInitials = orgName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'NO'
  const { isPro } = usePlan()

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
    const handler = () => setShowOnboarding(true)
    window.addEventListener('onboarding-reopen', handler)
    return () => window.removeEventListener('onboarding-reopen', handler)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      // Cmd/Ctrl + N for new lead
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        setNewLeadOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex bg-[#FAF8F5]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-navy text-ivory flex flex-col fixed inset-y-0 left-0 z-40 transition-transform duration-300 lg:translate-x-0 lg:z-20 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-ivory/10">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <img src="/ampm-logo.png" alt="AM:PM" className="w-9 h-9 rounded-lg object-cover" />
            <span className="font-bold text-lg tracking-tight">
              : Impact{' '}
              <span className={isPro ? 'bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent' : 'text-ivory/50'}>
                {isPro ? 'Pro' : 'Core'}
              </span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-ivory/10 lg:hidden"
          >
            <X className="w-5 h-5 text-ivory/70" />
          </button>
        </div>

        {/* Organization */}
        <div className="px-4 py-4 border-b border-ivory/10">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-9 h-9 bg-impact rounded-lg flex items-center justify-center text-sm font-semibold text-ivory">
              {userLoading ? '...' : orgInitials}
            </div>
            <div>
              <p className="text-sm font-semibold text-ivory">{userLoading ? 'Loading...' : orgName}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && item.href !== '/dashboard/settings' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-impact text-ivory shadow-lg"
                    : "text-ivory/70 hover:bg-ivory/5 hover:text-ivory"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}

          {/* Admin section - only visible to agency users */}
          {user?.is_agency_user && (
            <>
              <div className="pt-3 pb-1 px-4">
                <p className="text-[10px] uppercase tracking-widest text-ivory/30 font-semibold">Admin</p>
              </div>
              <Link
                href="/dashboard/admin/users"
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  pathname.startsWith('/dashboard/admin')
                    ? "bg-impact text-ivory shadow-lg"
                    : "text-ivory/70 hover:bg-ivory/5 hover:text-ivory"
                )}
              >
                <Shield className="w-5 h-5" />
                Clients
              </Link>
            </>
          )}
        </nav>

        {/* User Menu */}
        <div className="p-4 border-t border-ivory/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 bg-camel/20 rounded-lg flex items-center justify-center text-sm font-semibold text-camel">
              {userLoading ? '...' : userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ivory truncate">{userLoading ? 'Loading...' : userName}</p>
              <p className="text-xs text-ivory/50 truncate">{userLoading ? '' : userEmail}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg hover:bg-ivory/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-ivory/50 hover:text-ivory" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
          {/* Mobile hamburger + Search */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              <Menu className="w-5 h-5 text-navy" />
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-400 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1">Search leads, conversations...</span>
              <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-xs text-gray-500">
                <span className="text-xs">⌘</span>K
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

      {/* Onboarding Checklist (first visit or reopened) */}
      <OnboardingChecklist forceOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />

      {/* Help Button */}
      <HelpButton />

      {/* Force password change modal (first login) */}
      {mustChangePassword && (
        <ForcePasswordChange onComplete={() => setMustChangePassword(false)} />
      )}
    </div>
  )
}
