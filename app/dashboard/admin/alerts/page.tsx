'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
  Clock,
  Users,
  CreditCard,
  Plug,
  Activity,
  UserPlus,
  XCircle,
  Check,
  X,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { useAdminContext } from '@/lib/contexts/admin-context'
import { formatRelativeTime } from '@/lib/utils'

interface Alert {
  id: string
  type: string
  org_id: string
  org_name: string
  message: string
  timestamp: string
  meta?: Record<string, unknown>
  nav?: {
    page: string
    description: string
  }
}

interface AlertsResponse {
  critical: Alert[]
  warnings: Alert[]
  info: Alert[]
  counts: {
    critical: number
    warnings: number
    info: number
    total: number
  }
}

const DISMISSED_KEY = 'impact-dismissed-alerts'
const SEEN_KEY = 'impact-alerts-last-seen'

function getDismissedAlerts(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as { ids: string[]; expiry: number }
    // Auto-expire dismissed alerts after 7 days
    if (Date.now() > parsed.expiry) {
      localStorage.removeItem(DISMISSED_KEY)
      return new Set()
    }
    return new Set(parsed.ids)
  } catch {
    return new Set()
  }
}

function dismissAlert(alertId: string): void {
  const current = getDismissedAlerts()
  current.add(alertId)
  localStorage.setItem(DISMISSED_KEY, JSON.stringify({
    ids: Array.from(current),
    expiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  }))
}

function undismissAlert(alertId: string): void {
  const current = getDismissedAlerts()
  current.delete(alertId)
  if (current.size === 0) {
    localStorage.removeItem(DISMISSED_KEY)
  } else {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify({
      ids: Array.from(current),
      expiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }))
  }
}

function markAlertsSeen(): void {
  localStorage.setItem(SEEN_KEY, Date.now().toString())
}

function filterDismissed(alerts: Alert[], dismissed: Set<string>): Alert[] {
  return alerts.filter(a => !dismissed.has(a.id))
}

function useAlerts() {
  return useQuery<AlertsResponse>({
    queryKey: ['admin-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/admin/alerts')
      if (!res.ok) throw new Error('Failed to fetch alerts')
      return res.json()
    },
    refetchInterval: 60 * 1000,
  })
}

const alertTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  integration_error: Plug,
  webhook_failed: AlertTriangle,
  stale_leads: Clock,
  no_activity_7d: Activity,
  payment_past_due: CreditCard,
  new_client: UserPlus,
  subscription_cancelled: XCircle,
}

function AlertCard({
  alert,
  level,
  onDismiss,
  onNavigate,
}: {
  alert: Alert
  level: 'critical' | 'warning' | 'info'
  onDismiss: (id: string) => void
  onNavigate: (alert: Alert) => void
}) {
  const Icon = alertTypeIcons[alert.type] || AlertCircle

  const levelStyles = {
    critical: {
      border: 'border-red-200',
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    warning: {
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    info: {
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
  }

  const style = levelStyles[level]

  return (
    <div className={`p-4 rounded-xl border ${style.border} ${style.bg} group transition-all hover:shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg ${style.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4.5 h-4.5 ${style.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-navy truncate">{alert.org_name}</h4>
            <span className="text-xs text-navy/40 flex-shrink-0">
              {formatRelativeTime(alert.timestamp)}
            </span>
          </div>
          <p className="text-sm text-navy/70">{alert.message}</p>
          <div className="mt-2.5 flex items-center gap-3">
            {alert.nav && (
              <button
                onClick={() => onNavigate(alert)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-impact hover:text-impact/80 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                {alert.nav.description}
              </button>
            )}
            <button
              onClick={() => onDismiss(alert.id)}
              className="inline-flex items-center gap-1 text-xs font-medium text-navy/40 hover:text-emerald-600 transition-colors"
              title="Mark as resolved"
            >
              <Check className="w-3.5 h-3.5" />
              Resolve
            </button>
          </div>
        </div>
        <button
          onClick={() => onDismiss(alert.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/5 rounded-md flex-shrink-0"
          title="Dismiss alert"
        >
          <X className="w-3.5 h-3.5 text-navy/30" />
        </button>
      </div>
    </div>
  )
}

function AlertSection({
  title,
  icon: Icon,
  alerts,
  level,
  color,
  onDismiss,
  onDismissAll,
  onNavigate,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  alerts: Alert[]
  level: 'critical' | 'warning' | 'info'
  color: string
  onDismiss: (id: string) => void
  onDismissAll: (ids: string[]) => void
  onNavigate: (alert: Alert) => void
}) {
  if (alerts.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <h2 className="text-lg font-semibold text-navy">{title}</h2>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            level === 'critical' ? 'bg-red-100 text-red-700' :
            level === 'warning' ? 'bg-amber-100 text-amber-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {alerts.length}
          </span>
        </div>
        {alerts.length > 1 && (
          <button
            onClick={() => onDismissAll(alerts.map(a => a.id))}
            className="text-xs font-medium text-navy/40 hover:text-emerald-600 transition-colors inline-flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Resolve all
          </button>
        )}
      </div>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            level={level}
            onDismiss={onDismiss}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  )
}

export default function AdminAlertsPage() {
  const { data, isLoading, refetch, isFetching } = useAlerts()
  const { setViewingOrg } = useAdminContext()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [showDismissed, setShowDismissed] = useState(false)

  // Load dismissed set on mount
  useEffect(() => {
    setDismissed(getDismissedAlerts())
  }, [])

  // Mark alerts as seen when page loads (clears sidebar badge)
  useEffect(() => {
    markAlertsSeen()
    // Update sidebar badge count
    queryClient.invalidateQueries({ queryKey: ['admin-alert-count'] })
  }, [queryClient])

  const handleDismiss = useCallback((alertId: string) => {
    dismissAlert(alertId)
    setDismissed(getDismissedAlerts())
    // Update sidebar badge count
    queryClient.invalidateQueries({ queryKey: ['admin-alert-count'] })
  }, [queryClient])

  const handleDismissAll = useCallback((alertIds: string[]) => {
    for (const id of alertIds) {
      dismissAlert(id)
    }
    setDismissed(getDismissedAlerts())
    queryClient.invalidateQueries({ queryKey: ['admin-alert-count'] })
  }, [queryClient])

  const handleUndismiss = useCallback((alertId: string) => {
    undismissAlert(alertId)
    setDismissed(getDismissedAlerts())
    queryClient.invalidateQueries({ queryKey: ['admin-alert-count'] })
  }, [queryClient])

  const handleNavigate = useCallback((alert: Alert) => {
    // Switch to "view as client" mode for the org, then navigate to the target page
    setViewingOrg({ id: alert.org_id, name: alert.org_name, plan: 'core' })
    if (alert.nav?.page) {
      router.push(alert.nav.page)
    }
  }, [setViewingOrg, router])

  // Filter out dismissed alerts
  const activeCritical = data ? filterDismissed(data.critical, dismissed) : []
  const activeWarnings = data ? filterDismissed(data.warnings, dismissed) : []
  const activeInfo = data ? filterDismissed(data.info, dismissed) : []
  const activeTotal = activeCritical.length + activeWarnings.length + activeInfo.length

  // Get dismissed alerts that still exist in the response
  const allAlerts = data ? [...data.critical, ...data.warnings, ...data.info] : []
  const dismissedAlerts = allAlerts.filter(a => dismissed.has(a.id))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">System Alerts</h1>
          <p className="text-navy/60 text-sm">Monitor client health and system issues</p>
        </div>
        <div className="flex items-center gap-2">
          {dismissedAlerts.length > 0 && (
            <button
              onClick={() => setShowDismissed(!showDismissed)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                showDismissed
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-navy/50 hover:bg-gray-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {dismissedAlerts.length} resolved
            </button>
          )}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-navy hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{activeCritical.length}</p>
                <p className="text-xs text-navy/50">Critical</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{activeWarnings.length}</p>
                <p className="text-xs text-navy/50">Warnings</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{activeInfo.length}</p>
                <p className="text-xs text-navy/50">Info</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Active Alert Sections */}
      {data && (
        <div className="space-y-6">
          <AlertSection
            title="Critical"
            icon={AlertTriangle}
            alerts={activeCritical}
            level="critical"
            color="text-red-500"
            onDismiss={handleDismiss}
            onDismissAll={handleDismissAll}
            onNavigate={handleNavigate}
          />
          <AlertSection
            title="Warnings"
            icon={AlertCircle}
            alerts={activeWarnings}
            level="warning"
            color="text-amber-500"
            onDismiss={handleDismiss}
            onDismissAll={handleDismissAll}
            onNavigate={handleNavigate}
          />
          <AlertSection
            title="Info"
            icon={Info}
            alerts={activeInfo}
            level="info"
            color="text-blue-500"
            onDismiss={handleDismiss}
            onDismissAll={handleDismissAll}
            onNavigate={handleNavigate}
          />

          {activeTotal === 0 && !showDismissed && (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-7 h-7 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold text-navy mb-2">All Clear</h2>
              <p className="text-navy/60 text-sm">
                {dismissedAlerts.length > 0
                  ? `${dismissedAlerts.length} resolved alert(s) hidden.`
                  : 'No alerts across any client accounts.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Resolved (dismissed) alerts */}
      {showDismissed && dismissedAlerts.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-navy">Resolved</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                {dismissedAlerts.length}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {dismissedAlerts.map((alert) => {
              const Icon = alertTypeIcons[alert.type] || AlertCircle
              return (
                <div
                  key={alert.id}
                  className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 opacity-60 hover:opacity-100 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4.5 h-4.5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-navy/60 truncate line-through">{alert.org_name}</h4>
                        <span className="text-xs text-navy/30 flex-shrink-0">
                          {formatRelativeTime(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-navy/40">{alert.message}</p>
                      <div className="mt-2">
                        <button
                          onClick={() => handleUndismiss(alert.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-navy/40 hover:text-amber-600 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Unresolve
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Auto-refresh indicator */}
      <p className="text-xs text-navy/30 text-center">Auto-refreshes every 60 seconds</p>
    </div>
  )
}
