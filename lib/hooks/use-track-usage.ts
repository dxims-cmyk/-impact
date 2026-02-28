'use client'

import { useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

const PAGE_METRICS: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/dashboard/leads': 'leads',
  '/dashboard/conversations': 'conversations',
  '/dashboard/calendar': 'calendar',
  '/dashboard/campaigns': 'campaigns',
  '/dashboard/reports': 'reports',
  '/dashboard/automations': 'automations',
  '/dashboard/settings': 'settings',
  '/dashboard/gallery': 'gallery',
  '/dashboard/calls': 'calls',
}

export function useTrackUsage() {
  const pathname = usePathname()

  useEffect(() => {
    const page = Object.entries(PAGE_METRICS).find(([path]) =>
      pathname === path || pathname?.startsWith(path + '/')
    )?.[1]

    if (page) {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'page_view', page })
      }).catch(() => {})
    }
  }, [pathname])

  const trackAction = useCallback((action: string, metadata?: Record<string, unknown>) => {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'action', action, metadata })
    }).catch(() => {})
  }, [])

  return { trackAction }
}
