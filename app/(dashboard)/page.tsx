import { Suspense } from 'react'
import { KPICards } from '@/components/dashboard/kpi-cards'
import { Pipeline } from '@/components/dashboard/pipeline'
import { LeadFeed } from '@/components/dashboard/lead-feed'
import { AIInsights } from '@/components/dashboard/ai-insights'
import { QuickActions } from '@/components/dashboard/quick-actions'

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="h-48 bg-gray-200 rounded-xl" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-96 bg-gray-200 rounded-xl" />
        <div className="h-96 bg-gray-200 rounded-xl" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back. Here's what's happening with your leads.</p>
        </div>
        <QuickActions />
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        {/* KPI Cards */}
        <KPICards 
          metrics={{
            leads: 47,
            leadsChange: 12,
            leadsTrend: 'up',
            cpl: 24.50,
            cplChange: -8,
            cplTrend: 'down',
            booked: 12,
            bookedChange: 25,
            bookedTrend: 'up',
            roas: 3.2,
            roasChange: 15,
            roasTrend: 'up',
          }}
        />

        {/* Pipeline */}
        <Pipeline 
          stages={[
            { id: 'new', name: 'New', count: 23, color: '#6366f1' },
            { id: 'qualified', name: 'Qualified', count: 12, color: '#8b5cf6' },
            { id: 'contacted', name: 'Contacted', count: 8, color: '#a855f7' },
            { id: 'booked', name: 'Booked', count: 4, color: '#22c55e' },
            { id: 'won', name: 'Won', count: 2, color: '#10b981' },
            { id: 'lost', name: 'Lost', count: 3, color: '#ef4444' },
          ]}
        />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Leads</h2>
              <a href="/dashboard/leads" className="text-sm text-brand-600 hover:text-brand-700">
                View all →
              </a>
            </div>
            <LeadFeed />
          </div>

          {/* AI Insights */}
          <div className="card p-6">
            <AIInsights />
          </div>
        </div>
      </Suspense>
    </div>
  )
}
