'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  BarChart3,
  FileText,
  Settings,
  Plug,
  LogOut,
  Zap,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/dashboard/leads', icon: Users },
  { name: 'Conversations', href: '/dashboard/conversations', icon: MessageSquare },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: BarChart3 },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Automations', href: '/dashboard/automations', icon: Zap },
  { name: 'Integrations', href: '/dashboard/integrations', icon: Plug },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [orgMenuOpen, setOrgMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed inset-y-0 left-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/ampm-logo.png" alt="AM:PM" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-lg">: Impact</span>
          </Link>
        </div>

        {/* Organization Selector */}
        <div className="px-4 py-3 border-b border-gray-800">
          <button
            onClick={() => setOrgMenuOpen(!orgMenuOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-sm font-medium">
                DC
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Demo Company</p>
                <p className="text-xs text-gray-400">Launch Plan</p>
              </div>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-gray-400 transition-transform",
              orgMenuOpen && "rotate-180"
            )} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User Menu */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium">
              U
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">User Name</p>
              <p className="text-xs text-gray-400">user@example.com</p>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div>
            {/* Breadcrumb or page title can go here */}
          </div>
          <div className="flex items-center gap-4">
            <button className="btn-secondary text-sm">
              <span className="hidden sm:inline">Quick Actions</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
