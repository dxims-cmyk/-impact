// components/dashboard/kpi-cards.tsx
'use client'

import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  invertTrend?: boolean // For metrics where down is good (like CPL)
  prefix?: string
  suffix?: string
}

function KPICard({ 
  label, 
  value, 
  change, 
  trend, 
  invertTrend = false,
  prefix,
  suffix 
}: KPICardProps) {
  const isPositive = invertTrend ? trend === 'down' : trend === 'up'
  const isNegative = invertTrend ? trend === 'up' : trend === 'down'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">
        {prefix}{value}{suffix}
      </p>
      {change !== undefined && trend && (
        <div className="mt-2 flex items-center gap-1">
          {trend === 'up' && (
            <ArrowUpIcon className={cn(
              "w-4 h-4",
              isPositive ? "text-green-500" : "text-red-500"
            )} />
          )}
          {trend === 'down' && (
            <ArrowDownIcon className={cn(
              "w-4 h-4",
              isNegative ? "text-red-500" : "text-green-500"
            )} />
          )}
          <span className={cn(
            "text-sm font-medium",
            isPositive && "text-green-600",
            isNegative && "text-red-600",
            trend === 'neutral' && "text-gray-500"
          )}>
            {Math.abs(change)}%
          </span>
          <span className="text-sm text-gray-500">vs last week</span>
        </div>
      )}
    </div>
  )
}

interface KPICardsProps {
  metrics: {
    leads: number
    leadsChange: number
    leadsTrend: 'up' | 'down' | 'neutral'
    cpl: number
    cplChange: number
    cplTrend: 'up' | 'down' | 'neutral'
    booked: number
    bookedChange: number
    bookedTrend: 'up' | 'down' | 'neutral'
    roas: number
    roasChange: number
    roasTrend: 'up' | 'down' | 'neutral'
  }
}

export function KPICards({ metrics }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        label="Leads"
        value={metrics.leads}
        change={metrics.leadsChange}
        trend={metrics.leadsTrend}
      />
      <KPICard
        label="Cost per Lead"
        value={metrics.cpl.toFixed(2)}
        change={metrics.cplChange}
        trend={metrics.cplTrend}
        invertTrend
        prefix="£"
      />
      <KPICard
        label="Booked"
        value={metrics.booked}
        change={metrics.bookedChange}
        trend={metrics.bookedTrend}
      />
      <KPICard
        label="ROAS"
        value={metrics.roas.toFixed(1)}
        change={metrics.roasChange}
        trend={metrics.roasTrend}
        suffix="x"
      />
    </div>
  )
}

// Mini KPI for inline display
interface MiniKPIProps {
  label: string
  value: string | number
  trend?: 'up' | 'down'
}

export function MiniKPI({ label, value, trend }: MiniKPIProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">{label}:</span>
      <span className="font-semibold">{value}</span>
      {trend && (
        trend === 'up' 
          ? <ArrowUpIcon className="w-3 h-3 text-green-500" />
          : <ArrowDownIcon className="w-3 h-3 text-red-500" />
      )}
    </div>
  )
}
