'use client'

import { Sparkles, TrendingUp, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatRelativeTime } from '@/lib/utils'

interface Insight {
  type: 'success' | 'warning' | 'recommendation'
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
}

interface InsightsResponse {
  insights: Insight[]
  updatedAt: string
}

function InsightCard({ insight }: { insight: Insight }) {
  const icons = {
    success: TrendingUp,
    warning: AlertTriangle,
    recommendation: Sparkles,
  }

  const colors = {
    success: 'text-green-600 bg-green-50',
    warning: 'text-amber-600 bg-amber-50',
    recommendation: 'text-brand-600 bg-brand-50',
  }

  const Icon = icons[insight.type]

  return (
    <div className="p-4 rounded-lg bg-gray-50">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colors[insight.type]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{insight.title}</h4>
          <p className="mt-1 text-sm text-gray-600">{insight.description}</p>
          {insight.action && (
            <a
              href={insight.action.href}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              {insight.action.label}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function InsightSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-gray-50 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}

export function AIInsights() {
  const { data, isLoading, isFetching, refetch } = useQuery<InsightsResponse>({
    queryKey: ['dashboard-insights'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/insights')
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch insights')
      }
      return res.json()
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <>
            <InsightSkeleton />
            <InsightSkeleton />
            <InsightSkeleton />
          </>
        ) : data?.insights && data.insights.length > 0 ? (
          data.insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))
        ) : (
          <div className="p-4 rounded-lg bg-gray-50 text-center">
            <p className="text-sm text-gray-500">No data yet. Add leads to start seeing insights.</p>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400 text-center">
        {data?.updatedAt ? `Updated ${formatRelativeTime(data.updatedAt)}` : isLoading ? 'Loading...' : 'No data'}
      </p>
    </div>
  )
}
