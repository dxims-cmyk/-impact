'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  Users,
  PoundSterling,
  CalendarCheck,
  Target,
  ArrowRight,
  Sparkles,
  Building2,
  Mail,
  Clock,
  RefreshCw,
} from 'lucide-react'
import { useDashboardMetrics, useLeads } from '@/lib/hooks'
import { useRealtime } from '@/lib/hooks/use-realtime'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { Lead } from '@/types/database'

// KPI Card Component
function KPICard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  invertTrend = false,
  loading = false
}: {
  label: string
  value: string | number
  change: number
  trend: 'up' | 'down' | 'neutral'
  icon: React.ElementType
  invertTrend?: boolean
  loading?: boolean
}) {
  const isPositive = invertTrend ? trend === 'down' : trend === 'up'

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-impact/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-impact" />
        </div>
        {loading ? (
          <div className="w-16 h-5 bg-gray-200 animate-pulse rounded" />
        ) : (
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-studio' : change === 0 ? 'text-gray-400' : 'text-impact'}`}>
            {change !== 0 && (isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />)}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      {loading ? (
        <div className="w-24 h-8 bg-gray-200 animate-pulse rounded mb-1" />
      ) : (
        <p className="text-3xl font-bold text-navy mb-1">{value}</p>
      )}
      <p className="text-sm text-navy/50">{label}</p>
    </div>
  )
}

// Pipeline Stage Component
function PipelineStage({ name, count, color, loading = false }: { name: string; count: number; color: string; loading?: boolean }) {
  return (
    <div className="flex-1 group cursor-pointer">
      <div
        className="h-2 rounded-full mb-3 transition-all group-hover:h-3"
        style={{ backgroundColor: loading ? '#e5e7eb' : color }}
      />
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-navy">{name}</span>
        {loading ? (
          <div className="w-6 h-4 bg-gray-200 animate-pulse rounded" />
        ) : (
          <span className="text-sm font-bold text-navy">{count}</span>
        )}
      </div>
    </div>
  )
}

// Lead Card Component
function LeadCard({
  lead,
  loading = false
}: {
  lead?: Lead
  loading?: boolean
}) {
  if (loading || !lead) {
    return (
      <div className="p-4 rounded-xl border border-gray-100 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-200" />
          <div className="flex-1">
            <div className="w-32 h-5 bg-gray-200 rounded mb-2" />
            <div className="w-48 h-4 bg-gray-200 rounded mb-2" />
            <div className="w-64 h-4 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  const tempColors = {
    hot: 'bg-impact/10 text-impact',
    warm: 'bg-camel/20 text-chocolate',
    cold: 'bg-vision/10 text-vision',
  }

  const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <Link href={`/dashboard/leads/${lead.id}`}>
      <div className="p-4 rounded-xl border border-gray-100 hover:border-impact/20 hover:shadow-sm transition-all cursor-pointer group">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center text-sm font-semibold text-navy">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-navy group-hover:text-impact transition-colors">{name}</h4>
              {lead.temperature && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tempColors[lead.temperature]}`}>
                  {lead.temperature}
                </span>
              )}
              {lead.score && <span className="text-xs font-medium text-navy/50">{lead.score}/10</span>}
            </div>
            <div className="flex items-center gap-3 text-sm text-navy/60 mb-2">
              {lead.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {lead.company}
                </span>
              )}
              {lead.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {lead.email}
                </span>
              )}
            </div>
            {lead.ai_summary && (
              <p className="text-sm text-navy/70 flex items-start gap-1.5">
                <Sparkles className="w-4 h-4 text-impact flex-shrink-0 mt-0.5" />
                {lead.ai_summary}
              </p>
            )}
          </div>
          <span className="text-xs text-navy/40 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(lead.created_at)}
          </span>
        </div>
      </div>
    </Link>
  )
}

// AI Insights Component
function AIInsights() {
  const [insights, setInsights] = useState<{
    analysis: string
    alerts: string[]
    recommendations: { text: string; priority: string }[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/insights')
      .then(res => res.json())
      .then(data => {
        setInsights(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-impact/5 to-camel/5 rounded-2xl p-6 border border-impact/10 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gray-200" />
          <div className="w-24 h-5 bg-gray-200 rounded" />
        </div>
        <div className="w-full h-16 bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="w-full h-4 bg-gray-200 rounded" />
          <div className="w-full h-4 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-impact/5 to-camel/5 rounded-2xl p-6 border border-impact/10">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-impact flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-ivory" />
        </div>
        <h3 className="font-semibold text-navy">AI Insights</h3>
      </div>
      <p className="text-navy/80 mb-4">
        {insights?.analysis || 'No insights available yet.'}
      </p>
      {insights?.recommendations && insights.recommendations.length > 0 && (
        <div className="space-y-2">
          {insights.recommendations.slice(0, 3).map((rec, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <ArrowRight className={`w-4 h-4 mt-0.5 flex-shrink-0 ${rec.priority === 'high' ? 'text-impact' : 'text-navy/40'}`} />
              <span className="text-navy/70">{rec.text}</span>
            </div>
          ))}
        </div>
      )}
      {insights?.alerts && insights.alerts.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-impact/10 border border-impact/20">
          <p className="text-sm font-medium text-impact">{insights.alerts[0]}</p>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading, isFetching, refetch } = useDashboardMetrics()
  const { isConnected, subscribeToLeads } = useRealtime()

  // Subscribe to all lead changes — invalidates dashboard-metrics and leads queries
  useEffect(() => {
    const unsubscribe = subscribeToLeads((lead) => {
      // Show toast for hot leads
      if (lead.temperature === 'hot') {
        toast.success(`Hot lead: ${lead.first_name} ${lead.last_name}`, {
          description: lead.ai_summary || 'New high-intent lead detected!',
        })
      }
    })
    return unsubscribe
  }, [subscribeToLeads])

  const stageColors: Record<string, string> = {
    new: '#6E0F1A',
    qualified: '#8B1422',
    contacted: '#D4A574',
    booked: '#2D4A3E',
    won: '#2D4A3E',
    lost: '#4A3728',
  }

  const totalLeads = metrics?.pipeline?.reduce((sum, s) => sum + s.count, 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
          <p className="text-navy/60">Welcome back. Here's what's happening with your leads.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 text-sm font-medium ${isConnected ? 'text-emerald-600' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
            {isConnected ? 'Live' : 'Disconnected'}
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-navy/60 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Leads"
          value={metrics?.leads || 0}
          change={metrics?.leadsChange || 0}
          trend={metrics?.leadsChange && metrics.leadsChange > 0 ? 'up' : metrics?.leadsChange && metrics.leadsChange < 0 ? 'down' : 'neutral'}
          icon={Users}
          loading={metricsLoading}
        />
        <KPICard
          label="Cost per Lead"
          value={`£${(metrics?.cpl || 0).toFixed(2)}`}
          change={Math.abs(metrics?.cplChange || 0)}
          trend={metrics?.cplChange && metrics.cplChange < 0 ? 'down' : metrics?.cplChange && metrics.cplChange > 0 ? 'up' : 'neutral'}
          icon={PoundSterling}
          invertTrend
          loading={metricsLoading}
        />
        <KPICard
          label="Booked Calls"
          value={metrics?.booked || 0}
          change={metrics?.bookedChange || 0}
          trend={metrics?.bookedChange && metrics.bookedChange > 0 ? 'up' : metrics?.bookedChange && metrics.bookedChange < 0 ? 'down' : 'neutral'}
          icon={CalendarCheck}
          loading={metricsLoading}
        />
        <KPICard
          label="ROAS"
          value={`${(metrics?.roas || 0).toFixed(1)}x`}
          change={metrics?.roasChange || 0}
          trend={metrics?.roasChange && metrics.roasChange > 0 ? 'up' : metrics?.roasChange && metrics.roasChange < 0 ? 'down' : 'neutral'}
          icon={Target}
          loading={metricsLoading}
        />
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-navy">Pipeline</h2>
          <span className="text-sm text-navy/50">{totalLeads} total leads</span>
        </div>
        <div className="flex gap-3">
          {['new', 'qualified', 'contacted', 'booked', 'won', 'lost'].map((stage) => (
            <Link key={stage} href={`/dashboard/leads?stage=${stage}`}>
              <PipelineStage
                name={stage.charAt(0).toUpperCase() + stage.slice(1)}
                count={metrics?.pipeline?.find(s => s.stage === stage)?.count || 0}
                color={stageColors[stage]}
                loading={metricsLoading}
              />
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy">Recent Leads</h2>
            <Link href="/dashboard/leads" className="text-sm text-impact hover:text-impact-light font-medium flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {metricsLoading ? (
              <>
                <LeadCard loading />
                <LeadCard loading />
                <LeadCard loading />
              </>
            ) : metrics?.recentLeads && metrics.recentLeads.length > 0 ? (
              metrics.recentLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))
            ) : (
              <p className="text-center text-navy/50 py-8">No leads yet. Create your first lead!</p>
            )}
          </div>
        </div>

        {/* AI Insights */}
        <AIInsights />
      </div>
    </div>
  )
}
