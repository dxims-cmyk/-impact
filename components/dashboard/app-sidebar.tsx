'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/use-user'
import { usePlan, PLAN_LEVELS, type PlanType } from '@/lib/hooks/use-plan'
import { useHasAddon } from '@/lib/hooks/use-addons'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
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
  Phone,
  Shield,
  HelpCircle,
  Images,
  Star,
  Lock,
  Eye,
  X,
  ChevronDown,
  AlertTriangle,
  Target,
} from 'lucide-react'
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  useSidebar,
} from '@/components/ui/sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdminContext, type ViewingOrg } from '@/lib/contexts/admin-context'

const SIDEBAR_STORAGE_KEY = 'impact-sidebar-open'

type AddonKeyType = 'ai_receptionist' | 'outbound_leads'
interface NavItem { name: string; href: string; icon: typeof LayoutDashboard; minPlan?: PlanType; addonKey?: AddonKeyType }

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/dashboard/leads', icon: Users },
  { name: 'Outbound', href: '/dashboard/outbound-leads', icon: Target, minPlan: 'pro', addonKey: 'outbound_leads' },
  { name: 'Conversations', href: '/dashboard/conversations', icon: MessageSquare },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Calls', href: '/dashboard/calls', icon: Phone, minPlan: 'growth', addonKey: 'ai_receptionist' },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: BarChart3 },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Gallery', href: '/dashboard/gallery', icon: Images, minPlan: 'pro' },
  { name: 'Automations', href: '/dashboard/automations', icon: Zap, minPlan: 'growth' },
  { name: 'Integrations', href: '/dashboard/integrations', icon: Plug },
  { name: 'Reputation', href: '/dashboard/settings/reputation', icon: Star, minPlan: 'pro' },
  { name: 'Forms', href: '/dashboard/settings/forms', icon: FormInput },
]

const bottomNavigation = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
]

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  if (href === '/dashboard/settings') return pathname === '/dashboard/settings'
  return pathname.startsWith(href)
}

interface ClientOrg {
  id: string
  name: string
  plan: PlanType
  account_status: string
}

function useAlertCount(enabled: boolean) {
  return useQuery<number>({
    queryKey: ['admin-alert-count'],
    queryFn: async () => {
      const res = await fetch('/api/admin/alerts')
      if (!res.ok) return 0
      const data = await res.json()
      return data.counts?.critical || 0
    },
    enabled,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  })
}

function useAdminClients(enabled: boolean) {
  return useQuery<ClientOrg[]>({
    queryKey: ['admin-clients-list'],
    queryFn: async () => {
      const res = await fetch('/api/admin/clients')
      if (!res.ok) throw new Error('Failed to fetch clients')
      const data = await res.json()
      return data.map((org: any) => ({
        id: org.id,
        name: org.name,
        plan: org.plan || 'core',
        account_status: org.account_status || 'active',
      }))
    },
    enabled,
    staleTime: 2 * 60 * 1000,
  })
}

function ClientSwitcher({ open: sidebarOpen }: { open: boolean }): React.JSX.Element | null {
  const { data: user } = useUser()
  const { viewingOrg, setViewingOrg, clearViewingOrg, isViewingClient } = useAdminContext()
  const { data: clients } = useAdminClients(user?.is_agency_user === true)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  if (!user?.is_agency_user) return null

  const handleSelect = (client: ClientOrg): void => {
    setViewingOrg({ id: client.id, name: client.name, plan: client.plan })
    setDropdownOpen(false)
  }

  // Compact view when sidebar is collapsed
  if (!sidebarOpen) {
    return (
      <div className="flex justify-center py-1">
        {isViewingClient ? (
          <button
            onClick={clearViewingOrg}
            className="w-8 h-8 bg-impact/80 rounded-lg flex items-center justify-center"
            title={`Viewing: ${viewingOrg?.name} — click to exit`}
          >
            <Eye className="w-4 h-4 text-ivory" />
          </button>
        ) : (
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-8 h-8 bg-ivory/10 rounded-lg flex items-center justify-center hover:bg-ivory/20 transition-colors"
            title="View as Client"
          >
            <Eye className="w-4 h-4 text-ivory/70" />
          </button>
        )}
      </div>
    )
  }

  // Currently viewing a client — show exit bar
  if (isViewingClient && viewingOrg) {
    return (
      <div className="mx-2 mb-2 p-2 rounded-lg bg-impact/20 border border-impact/30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Eye className="w-4 h-4 text-impact flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-ivory/60">Viewing as</p>
              <p className="text-sm font-semibold text-ivory truncate">{viewingOrg.name}</p>
            </div>
          </div>
          <button
            onClick={clearViewingOrg}
            className="p-1 rounded hover:bg-ivory/10 transition-colors flex-shrink-0"
            title="Exit client view"
          >
            <X className="w-4 h-4 text-ivory/60" />
          </button>
        </div>
      </div>
    )
  }

  // Dropdown selector
  return (
    <div className="mx-2 mb-2 relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-ivory/5 hover:bg-ivory/10 transition-colors text-sm text-ivory/70"
      >
        <span className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          View as Client
        </span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', dropdownOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1 bg-navy border border-ivory/15 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
          >
            {!clients?.length ? (
              <p className="px-3 py-2 text-xs text-ivory/40">No clients found</p>
            ) : (
              clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleSelect(client)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-ivory/80 hover:bg-ivory/10 transition-colors text-left"
                >
                  <span className="truncate">{client.name}</span>
                  <span className={cn(
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ml-2',
                    client.plan === 'pro'
                      ? 'bg-gradient-to-r from-orange-400/20 to-red-500/20 text-orange-400'
                      : client.plan === 'growth'
                        ? 'bg-studio/20 text-studio'
                        : 'bg-ivory/10 text-ivory/40'
                  )}>
                    {client.plan === 'pro' ? 'Pro' : client.plan === 'growth' ? 'Growth' : 'Core'}
                  </span>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SidebarContent(): React.JSX.Element {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { data: user, isLoading: userLoading } = useUser()
  const { plan: currentPlan, planLevel } = usePlan()
  const hasAIReceptionist = useHasAddon('ai_receptionist')
  const hasOutboundLeads = useHasAddon('outbound_leads')
  const addonAccess: Record<string, boolean> = { ai_receptionist: hasAIReceptionist, outbound_leads: hasOutboundLeads }
  const { open, setOpen } = useSidebar()
  const { viewingOrg, isViewingClient } = useAdminContext()
  const { data: alertCount } = useAlertCount(user?.is_agency_user === true && !isViewingClient)

  const userName = user?.full_name || user?.email?.split('@')[0] || 'User'
  const userEmail = user?.email || ''
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

  // Show viewed org name when viewing a client, otherwise admin's own org
  const displayOrgName = isViewingClient && viewingOrg ? viewingOrg.name : (user?.organization?.name || 'No Organization')
  const orgInitials = displayOrgName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'NO'

  // Use viewed client's plan when viewing, otherwise own
  const displayPlan: PlanType = isViewingClient && viewingOrg ? viewingOrg.plan : currentPlan
  const displayPlanLevel = PLAN_LEVELS[displayPlan] || 1

  const handleSignOut = async (): Promise<void> => {
    queryClient.clear()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const closeMobile = useCallback((): void => {
    if (window.innerWidth < 1024) {
      setOpen(false)
    }
  }, [setOpen])

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link
        href="/dashboard"
        className={cn(
          'flex items-center py-2 mb-2',
          open ? 'justify-start gap-3 px-2' : 'justify-center'
        )}
        onClick={closeMobile}
      >
        <img
          src="/ampm-logo.png"
          alt="AM:PM"
          className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
        />
        <motion.div
          animate={{
            display: open ? 'flex' : 'none',
            opacity: open ? 1 : 0,
          }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-1 whitespace-pre"
        >
          <span className="font-bold text-base tracking-tight text-ivory">
            : Impact
          </span>
          <span
            className={cn(
              'text-xs font-semibold',
              displayPlan === 'pro'
                ? 'bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent'
                : displayPlan === 'growth'
                  ? 'text-studio'
                  : 'text-ivory/50'
            )}
          >
            {displayPlan === 'pro' ? 'Pro' : displayPlan === 'growth' ? 'Growth' : 'Core'}
          </span>
        </motion.div>
      </Link>

      {/* Organization */}
      <div className={cn('py-3 border-b border-ivory/10 mb-3', isViewingClient && 'border-impact/30')}>
        <div className={cn(
          'flex items-center',
          open ? 'justify-start gap-2 px-2' : 'justify-center'
        )}>
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold text-ivory flex-shrink-0',
            isViewingClient ? 'bg-impact/60' : 'bg-impact'
          )}>
            {userLoading ? '..' : orgInitials}
          </div>
          <motion.span
            animate={{
              display: open ? 'block' : 'none',
              opacity: open ? 1 : 0,
            }}
            transition={{ duration: 0.15 }}
            className="text-sm font-semibold text-ivory truncate whitespace-pre"
          >
            {userLoading ? 'Loading...' : displayOrgName}
          </motion.span>
        </div>
      </div>

      {/* Client Switcher (admin only) */}
      <ClientSwitcher open={open} />

      {/* Main Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navigation.map((item) => {
          const active = isActiveRoute(pathname, item.href)
          const isAgency = user?.is_agency_user === true
          // Unlocked if: agency user, OR tier is high enough, OR addon is purchased
          const tierUnlocked = item.minPlan ? displayPlanLevel >= PLAN_LEVELS[item.minPlan] : true
          const addonUnlocked = item.addonKey ? addonAccess[item.addonKey] : false
          const locked = isAgency ? false : (!tierUnlocked && !addonUnlocked)

          // Locked items: addon-purchasable → addons page, otherwise → upgrade page
          const linkHref = locked
            ? (item.addonKey
              ? `/dashboard/addons?highlight=${item.addonKey}`
              : `/dashboard/upgrade?feature=${encodeURIComponent(item.name)}&plan=${item.minPlan}`)
            : item.href

          return (
            <SidebarLink
              key={item.href}
              link={{
                label: item.name,
                href: linkHref,
                icon: (
                  <item.icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0',
                      active ? 'text-ivory' : 'text-ivory/70'
                    )}
                  />
                ),
              }}
              active={active}
              onClick={closeMobile}
              className={cn(
                active
                  ? 'text-ivory font-medium'
                  : locked
                    ? 'text-ivory/40'
                    : 'text-ivory/70 hover:text-ivory'
              )}
              badge={
                locked ? (
                  <Lock className="w-3.5 h-3.5 text-ivory/40" />
                ) : undefined
              }
            />
          )
        })}

        {/* Admin section — hidden when viewing a client */}
        {user?.is_agency_user && !isViewingClient && (
          <>
            <div className={cn('pt-3 pb-1', open ? 'px-3' : 'px-0')}>
              <motion.p
                animate={{
                  display: open ? 'block' : 'none',
                  opacity: open ? 1 : 0,
                }}
                className="text-[10px] uppercase tracking-widest text-ivory/30 font-semibold"
              >
                Admin
              </motion.p>
              {!open && (
                <div className="border-t border-ivory/10 mx-auto w-6" />
              )}
            </div>
            <SidebarLink
              link={{
                label: 'Clients',
                href: '/dashboard/admin/users',
                icon: (
                  <Shield
                    className={cn(
                      'w-5 h-5 flex-shrink-0',
                      pathname === '/dashboard/admin/users'
                        ? 'text-ivory'
                        : 'text-ivory/70'
                    )}
                  />
                ),
              }}
              active={pathname === '/dashboard/admin/users'}
              onClick={closeMobile}
              className={
                pathname === '/dashboard/admin/users'
                  ? 'text-ivory font-medium'
                  : 'text-ivory/70 hover:text-ivory'
              }
            />
            <SidebarLink
              link={{
                label: 'Alerts',
                href: '/dashboard/admin/alerts',
                icon: (
                  <AlertTriangle
                    className={cn(
                      'w-5 h-5 flex-shrink-0',
                      pathname === '/dashboard/admin/alerts'
                        ? 'text-ivory'
                        : 'text-ivory/70'
                    )}
                  />
                ),
              }}
              active={pathname === '/dashboard/admin/alerts'}
              onClick={closeMobile}
              className={
                pathname === '/dashboard/admin/alerts'
                  ? 'text-ivory font-medium'
                  : 'text-ivory/70 hover:text-ivory'
              }
              badge={
                alertCount && alertCount > 0 ? (
                  <span className="text-[10px] font-bold bg-red-500 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center min-w-[18px] px-1">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                ) : undefined
              }
            />
            <SidebarLink
              link={{
                label: 'Analytics',
                href: '/dashboard/admin/analytics',
                icon: (
                  <BarChart3
                    className={cn(
                      'w-5 h-5 flex-shrink-0',
                      pathname === '/dashboard/admin/analytics'
                        ? 'text-ivory'
                        : 'text-ivory/70'
                    )}
                  />
                ),
              }}
              active={pathname === '/dashboard/admin/analytics'}
              onClick={closeMobile}
              className={
                pathname === '/dashboard/admin/analytics'
                  ? 'text-ivory font-medium'
                  : 'text-ivory/70 hover:text-ivory'
              }
            />
          </>
        )}
      </nav>

      {/* Bottom Navigation — hide Settings when viewing client */}
      <div className="pt-2 mt-2 border-t border-ivory/10 space-y-0.5">
        {bottomNavigation
          .filter((item) => {
            // Hide Settings when viewing a client (no destructive access)
            if (isViewingClient && item.href === '/dashboard/settings') return false
            return true
          })
          .map((item) => {
            const active = isActiveRoute(pathname, item.href)
            return (
              <SidebarLink
                key={item.href}
                link={{
                  label: item.name,
                  href: item.href,
                  icon: (
                    <item.icon
                      className={cn(
                        'w-5 h-5 flex-shrink-0',
                        active ? 'text-ivory' : 'text-ivory/70'
                      )}
                    />
                  ),
                }}
                active={active}
                onClick={closeMobile}
                className={
                  active
                    ? 'text-ivory font-medium'
                    : 'text-ivory/70 hover:text-ivory'
                }
              />
            )
          })}
      </div>

      {/* User Menu */}
      <div className="pt-3 mt-2 border-t border-ivory/10">
        <div className={cn(
          'flex items-center py-1',
          open ? 'gap-2 px-2' : 'justify-center'
        )}>
          <div className="w-8 h-8 bg-camel/20 rounded-lg flex items-center justify-center text-xs font-semibold text-camel flex-shrink-0">
            {userLoading ? '..' : userInitials}
          </div>
          <motion.div
            animate={{
              display: open ? 'block' : 'none',
              opacity: open ? 1 : 0,
            }}
            transition={{ duration: 0.15 }}
            className="flex-1 min-w-0"
          >
            <p className="text-sm font-semibold text-ivory truncate">
              {userLoading ? 'Loading...' : userName}
            </p>
            <p className="text-xs text-ivory/50 truncate">{userEmail}</p>
          </motion.div>
          <motion.button
            animate={{
              display: open ? 'flex' : 'none',
              opacity: open ? 1 : 0,
            }}
            onClick={handleSignOut}
            className="p-1.5 rounded-lg hover:bg-ivory/10 transition-colors flex-shrink-0"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-ivory/50 hover:text-ivory" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export function AppSidebar(): React.JSX.Element {
  const [open, setOpen] = useState(false)

  // Persist sidebar state in localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored === 'true') {
      setOpen(true)
    }
  }, [])

  const handleSetOpen = useCallback(
    (value: React.SetStateAction<boolean>) => {
      setOpen((prev) => {
        const next = typeof value === 'function' ? value(prev) : value
        // Only persist explicit toggle, not hover state on desktop
        // We'll persist on mobile toggle instead
        return next
      })
    },
    []
  )

  return (
    <Sidebar open={open} setOpen={handleSetOpen}>
      <SidebarBody className="bg-navy text-ivory border-r border-ivory/10">
        <SidebarContent />
      </SidebarBody>
    </Sidebar>
  )
}
