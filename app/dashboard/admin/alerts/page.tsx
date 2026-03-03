'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
  ExternalLink,
  Clock,
  Users,
  CreditCard,
  Plug,
  Activity,
  UserPlus,
  XCircle,
  Eye,
} from 'lucide-react'
import { useAdminContext } from '@/lib/contexts/admin-context'
import { formatRelativeTime } from '@/lib/utils'

interface Alert {
  type: string
  org_id: string
  org_name: string
  message: string
  timestamp: string
  meta?: Record<string, unknown>
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

function useAlerts() {
  return useQuery<AlertsResponse>({
    queryKey: ['admin-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/admin/alerts')
      if (!res.ok) throw new Error('Failed to fetch alerts')
      return res.json()
    },
    refetchInterval: 60 * 1000, // Auto-refresh every 60s
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

function AlertCard({ alert, level }: { alert: Alert; level: 'critical' | 'warning' | 'info' }) {
  const { setViewingOrg } = useAdminContext()
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

  const handleViewClient = () => {
    setViewingOrg({ id: alert.org_id, name: alert.org_name, plan: 'core' })
  }

  return (
    <div className={`p-4 rounded-xl border ${style.border} ${style.bg}`}>
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
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleViewClient}
              className="inline-flex items-center gap-1 text-xs font-medium text-impact hover:underline"
            >
              <Eye className="w-3 h-3" />
              View Client
            </button>
          </div>
        </div>
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
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  alerts: Alert[]
  level: 'critical' | 'warning' | 'info'
  color: string
}) {
  if (alerts.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
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
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <AlertCard key={`${alert.type}-${alert.org_id}-${i}`} alert={alert} level={level} />
        ))}
      </div>
    </div>
  )
}

export default function AdminAlertsPage() {
  const { data, isLoading, refetch, isFetching } = useAlerts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">System Alerts</h1>
          <p className="text-navy/60 text-sm">Monitor client health and system issues</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-navy hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
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
                <p className="text-2xl font-bold text-navy">{data.counts.critical}</p>
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
                <p className="text-2xl font-bold text-navy">{data.counts.warnings}</p>
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
                <p className="text-2xl font-bold text-navy">{data.counts.info}</p>
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

      {/* Alert Sections */}
      {data && (
        <div className="space-y-6">
          <AlertSection
            title="Critical"
            icon={AlertTriangle}
            alerts={data.critical}
            level="critical"
            color="text-red-500"
          />
          <AlertSection
            title="Warnings"
            icon={AlertCircle}
            alerts={data.warnings}
            level="warning"
            color="text-amber-500"
          />
          <AlertSection
            title="Info"
            icon={Info}
            alerts={data.info}
            level="info"
            color="text-blue-500"
          />

          {data.counts.total === 0 && (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-7 h-7 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold text-navy mb-2">All Clear</h2>
              <p className="text-navy/60 text-sm">No alerts across any client accounts.</p>
            </div>
          )}
        </div>
      )}

      {/* Auto-refresh indicator */}
      <p className="text-xs text-navy/30 text-center">Auto-refreshes every 60 seconds</p>
    </div>
  )
}
