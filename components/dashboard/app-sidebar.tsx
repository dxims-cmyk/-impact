'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/use-user'
import { usePlan } from '@/lib/hooks/use-plan'
import { useQueryClient } from '@tanstack/react-query'
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
} from 'lucide-react'
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  useSidebar,
} from '@/components/ui/sidebar'
import { motion } from 'framer-motion'

const SIDEBAR_STORAGE_KEY = 'impact-sidebar-open'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/dashboard/leads', icon: Users },
  { name: 'Conversations', href: '/dashboard/conversations', icon: MessageSquare },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Calls', href: '/dashboard/calls', icon: Phone, proOnly: true },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: BarChart3 },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Gallery', href: '/dashboard/gallery', icon: Images, proOnly: true },
  { name: 'Automations', href: '/dashboard/automations', icon: Zap },
  { name: 'Integrations', href: '/dashboard/integrations', icon: Plug },
  { name: 'Reputation', href: '/dashboard/settings/reputation', icon: Star },
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

function SidebarContent(): React.JSX.Element {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { data: user, isLoading: userLoading } = useUser()
  const { isPro } = usePlan()
  const { open, setOpen } = useSidebar()

  const userName = user?.full_name || user?.email?.split('@')[0] || 'User'
  const userEmail = user?.email || ''
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'
  const orgName = user?.organization?.name || 'No Organization'
  const orgInitials = orgName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'NO'

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
            className={
              isPro
                ? 'bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent text-xs font-semibold'
                : 'text-ivory/50 text-xs font-semibold'
            }
          >
            {isPro ? 'Pro' : 'Core'}
          </span>
        </motion.div>
      </Link>

      {/* Organization */}
      <div className="py-3 border-b border-ivory/10 mb-3">
        <div className={cn(
          'flex items-center',
          open ? 'justify-start gap-2 px-2' : 'justify-center'
        )}>
          <div className="w-8 h-8 bg-impact rounded-lg flex items-center justify-center text-xs font-semibold text-ivory flex-shrink-0">
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
            {userLoading ? 'Loading...' : orgName}
          </motion.span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navigation.map((item) => {
          const active = isActiveRoute(pathname, item.href)
          const locked = item.proOnly && !isPro

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
              disabled={locked}
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

        {/* Admin section */}
        {user?.is_agency_user && (
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
                      pathname.startsWith('/dashboard/admin')
                        ? 'text-ivory'
                        : 'text-ivory/70'
                    )}
                  />
                ),
              }}
              active={pathname.startsWith('/dashboard/admin')}
              onClick={closeMobile}
              className={
                pathname.startsWith('/dashboard/admin')
                  ? 'text-ivory font-medium'
                  : 'text-ivory/70 hover:text-ivory'
              }
            />
          </>
        )}
      </nav>

      {/* Bottom Navigation */}
      <div className="pt-2 mt-2 border-t border-ivory/10 space-y-0.5">
        {bottomNavigation.map((item) => {
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
