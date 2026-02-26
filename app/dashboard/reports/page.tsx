'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  Download,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  DollarSign,
  BarChart3,
  PieChart,
  Clock,
  Mail,
  Sparkles,
  Loader2,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useReports, useLatestReport, useGenerateReport } from '@/lib/hooks'
import { FeatureGate } from '@/components/ui/FeatureGate'
import { toast } from 'sonner'
import { formatRelativeTime } from '@/lib/utils'
import { Report } from '@/types/database'

// Type for metrics stored in reports
interface ReportMetrics {
  leads?: { value: number; change: number; trend: 'up' | 'down' }
  qualified?: { value: number; change: number; trend: 'up' | 'down' }
  booked?: { value: number; change: number; trend: 'up' | 'down' }
  won?: { value: number; change: number; trend: 'up' | 'down' }
  revenue?: { value: number; change: number; trend: 'up' | 'down' }
  cpl?: { value: number; change: number; trend: 'up' | 'down' }
  conversionRate?: { value: number; change: number; trend: 'up' | 'down' }
  avgDealSize?: { value: number; change: number; trend: 'up' | 'down' }
  sourceBreakdown?: Array<{
    source: string
    leads: number
    percentage: number
    cpl: number
    color: string
  }>
  campaignPerformance?: Array<{
    name: string
    platform: string
    leads: number
    spend: number
    cpl: number
    roas: number
  }>
}

// Type for AI insights
interface AIInsight {
  type: 'positive' | 'warning' | 'opportunity' | 'action'
  title: string
  description: string
}

// Loading skeleton components
function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-gray-200" />
        <div className="w-12 h-4 bg-gray-200 rounded" />
      </div>
      <div className="w-16 h-7 bg-gray-200 rounded mb-1" />
      <div className="w-20 h-4 bg-gray-200 rounded" />
    </div>
  )
}

function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="py-3">
        <div className="w-32 h-4 bg-gray-200 rounded mb-1" />
        <div className="w-16 h-3 bg-gray-200 rounded" />
      </td>
      <td className="py-3 text-right"><div className="w-8 h-4 bg-gray-200 rounded ml-auto" /></td>
      <td className="py-3 text-right"><div className="w-16 h-4 bg-gray-200 rounded ml-auto" /></td>
      <td className="py-3 text-right"><div className="w-12 h-4 bg-gray-200 rounded ml-auto" /></td>
      <td className="py-3 text-right"><div className="w-10 h-4 bg-gray-200 rounded ml-auto" /></td>
    </tr>
  )
}

function ReportRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gray-200" />
        <div>
          <div className="w-48 h-5 bg-gray-200 rounded mb-2" />
          <div className="w-32 h-4 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gray-200" />
        <div className="w-8 h-8 rounded-lg bg-gray-200" />
      </div>
    </div>
  )
}

// Default values for when no data exists
const defaultStats = {
  leads: { value: 0, change: 0, trend: 'up' as const },
  qualified: { value: 0, change: 0, trend: 'up' as const },
  booked: { value: 0, change: 0, trend: 'up' as const },
  won: { value: 0, change: 0, trend: 'up' as const },
  revenue: { value: 0, change: 0, trend: 'up' as const },
  cpl: { value: 0, change: 0, trend: 'down' as const },
  conversionRate: { value: 0, change: 0, trend: 'up' as const },
  avgDealSize: { value: 0, change: 0, trend: 'up' as const },
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('7d')
  const [reportType, setReportType] = useState<'all' | 'weekly' | 'monthly' | 'custom'>('all')
  const [isGenerating, setIsGenerating] = useState(false)

  // Fetch reports list
  const { data: reportsData, isLoading: reportsLoading } = useReports({
    type: reportType === 'all' ? undefined : reportType,
    limit: 10,
  })

  // Fetch latest report for current stats
  const { data: latestReport, isLoading: latestLoading } = useLatestReport()

  // Mutations
  const generateReport = useGenerateReport()

  // Parse metrics from latest report
  const currentStats = useMemo(() => {
    if (!latestReport?.metrics) return defaultStats
    const metrics = latestReport.metrics as ReportMetrics
    return {
      leads: metrics.leads || defaultStats.leads,
      qualified: metrics.qualified || defaultStats.qualified,
      booked: metrics.booked || defaultStats.booked,
      won: metrics.won || defaultStats.won,
      revenue: metrics.revenue || defaultStats.revenue,
      cpl: metrics.cpl || defaultStats.cpl,
      conversionRate: metrics.conversionRate || defaultStats.conversionRate,
      avgDealSize: metrics.avgDealSize || defaultStats.avgDealSize,
    }
  }, [latestReport])

  // Source breakdown from metrics
  const sourceBreakdown = useMemo(() => {
    if (!latestReport?.metrics) return []
    const metrics = latestReport.metrics as ReportMetrics
    return metrics.sourceBreakdown || []
  }, [latestReport])

  // Campaign performance from metrics
  const campaignPerformance = useMemo(() => {
    if (!latestReport?.metrics) return []
    const metrics = latestReport.metrics as ReportMetrics
    return metrics.campaignPerformance || []
  }, [latestReport])

  // AI insights from report
  const aiInsights = useMemo((): AIInsight[] => {
    if (!latestReport) return []
    const insights: AIInsight[] = []

    // Parse AI recommendations into insights
    if (latestReport.ai_recommendations) {
      latestReport.ai_recommendations.forEach((rec, i) => {
        insights.push({
          type: i === 0 ? 'positive' : i === 1 ? 'warning' : i === 2 ? 'opportunity' : 'action',
          title: rec.split(':')[0] || 'Insight',
          description: rec.split(':').slice(1).join(':').trim() || rec,
        })
      })
    }

    return insights.slice(0, 4)
  }, [latestReport])

  // Fetch real chart data from API
  const { data: chartData, isLoading: chartsLoading, error: chartsError } = useQuery({
    queryKey: ['report-charts'],
    queryFn: async () => {
      const res = await fetch('/api/reports/stats')
      if (!res.ok) throw new Error('Failed to fetch chart data')
      return res.json()
    },
    retry: 1,
  })

  const leadsOverTimeData = chartData?.dailyLeads || []
  const scoreDistributionData = chartData?.scoreDistribution || []

  const formatCurrency = (num: number) => {
    return '£' + num.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-GB')
  }

  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'positive': return 'border-studio/20 bg-studio/5'
      case 'warning': return 'border-camel/30 bg-camel/5'
      case 'opportunity': return 'border-vision/20 bg-vision/5'
      case 'action': return 'border-impact/20 bg-impact/5'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return 'text-studio'
      case 'warning': return 'text-camel'
      case 'opportunity': return 'text-vision'
      case 'action': return 'text-impact'
      default: return 'text-gray-500'
    }
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    try {
      const now = new Date()
      let periodStart: Date
      let periodEnd = now
      let type: 'weekly' | 'monthly' | 'custom' = 'weekly'

      if (dateRange === '7d') {
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        type = 'weekly'
      } else if (dateRange === '30d') {
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        type = 'monthly'
      } else {
        periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        type = 'custom'
      }

      await generateReport.mutateAsync({
        type,
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
      })
      toast.success('Report generated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSendReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/send`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send')
      }
      toast.success('Report emailed to your inbox')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send report')
    }
  }

  const getReportName = (report: Report) => {
    const startDate = new Date(report.period_start).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
    const endDate = new Date(report.period_end).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })

    if (report.report_type === 'weekly') {
      return `Weekly Report (${startDate} - ${endDate})`
    } else if (report.report_type === 'monthly') {
      return `Monthly Summary - ${new Date(report.period_end).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`
    }
    return `Custom Report (${startDate} - ${endDate})`
  }

  const isLoading = reportsLoading || latestLoading

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Reports</h1>
          <p className="text-navy/60">Performance analytics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-navy bg-white focus:outline-none focus:ring-2 focus:ring-impact cursor-pointer"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="btn-primary flex items-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-impact/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-impact" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${currentStats.leads.trend === 'up' ? 'text-studio' : 'text-impact'}`}>
                  {currentStats.leads.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {currentStats.leads.change}%
                </div>
              </div>
              <p className="text-2xl font-bold text-navy mb-1">{formatNumber(currentStats.leads.value)}</p>
              <p className="text-sm text-navy/50">Total Leads</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-studio/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-studio" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${currentStats.conversionRate.trend === 'up' ? 'text-studio' : 'text-impact'}`}>
                  {currentStats.conversionRate.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {currentStats.conversionRate.change}%
                </div>
              </div>
              <p className="text-2xl font-bold text-navy mb-1">{currentStats.conversionRate.value}%</p>
              <p className="text-sm text-navy/50">Conversion Rate</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-camel/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-camel" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${currentStats.cpl.trend === 'down' ? 'text-studio' : 'text-impact'}`}>
                  {currentStats.cpl.trend === 'down' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  {Math.abs(currentStats.cpl.change)}%
                </div>
              </div>
              <p className="text-2xl font-bold text-navy mb-1">{formatCurrency(currentStats.cpl.value)}</p>
              <p className="text-sm text-navy/50">Avg Cost per Lead</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-vision/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-vision" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${currentStats.revenue.trend === 'up' ? 'text-studio' : 'text-impact'}`}>
                  {currentStats.revenue.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {currentStats.revenue.change}%
                </div>
              </div>
              <p className="text-2xl font-bold text-navy mb-1">{formatCurrency(currentStats.revenue.value)}</p>
              <p className="text-sm text-navy/50">Revenue Generated</p>
            </div>
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Over Time - Line Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-navy">Leads Over Time</h2>
            <span className="text-xs font-medium text-navy/40 bg-navy/5 px-2.5 py-1 rounded-lg">Last 30 days</span>
          </div>
          {chartsLoading ? (
            <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
          ) : chartsError ? (
            <div className="h-64 flex items-center justify-center text-navy/50">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Unable to load chart data</p>
                <p className="text-xs mt-1">Please try refreshing the page</p>
              </div>
            </div>
          ) : leadsOverTimeData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-navy/50">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No lead data available yet</p>
              </div>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leadsOverTimeData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                    }}
                    labelStyle={{ fontWeight: 600, color: '#1e293b' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    stroke="#6E0F1A"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#6E0F1A', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Lead Score Distribution - Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-navy">Lead Score Distribution</h2>
            <span className="text-xs font-medium text-navy/40 bg-navy/5 px-2.5 py-1 rounded-lg">All leads</span>
          </div>
          {chartsLoading ? (
            <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
          ) : chartsError ? (
            <div className="h-64 flex items-center justify-center text-navy/50">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Unable to load chart data</p>
                <p className="text-xs mt-1">Please try refreshing the page</p>
              </div>
            </div>
          ) : scoreDistributionData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-navy/50">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No score data available yet</p>
              </div>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistributionData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="bucket"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                    }}
                    labelFormatter={(label) => `Score: ${label}`}
                    formatter={(value: number) => [value, 'Leads']}
                  />
                  <Bar
                    dataKey="count"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={64}
                  >
                    {scoreDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* Legend */}
          {scoreDistributionData.length > 0 && (
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
              {scoreDistributionData.map((entry) => (
                <div key={entry.bucket} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.fill }} />
                  <span className="text-xs text-navy/60 font-medium">{entry.bucket}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Sources */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-navy">Lead Sources</h2>
            <PieChart className="w-5 h-5 text-navy/30" />
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-3 h-3 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-20 h-4 bg-gray-200 rounded" />
                      <div className="w-8 h-4 bg-gray-200 rounded" />
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : sourceBreakdown.length === 0 ? (
            <div className="text-center py-8 text-navy/50">
              <PieChart className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No source data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sourceBreakdown.map((source) => (
                <div key={source.source} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: source.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-navy">{source.source}</span>
                      <span className="text-sm font-semibold text-navy">{source.leads}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${source.percentage}%`, backgroundColor: source.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Campaign Performance */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-navy">Top Campaigns</h2>
            <BarChart3 className="w-5 h-5 text-navy/30" />
          </div>
          {isLoading ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-3 text-xs font-semibold text-navy/50 uppercase">Campaign</th>
                    <th className="text-right pb-3 text-xs font-semibold text-navy/50 uppercase">Leads</th>
                    <th className="text-right pb-3 text-xs font-semibold text-navy/50 uppercase">Spend</th>
                    <th className="text-right pb-3 text-xs font-semibold text-navy/50 uppercase">CPL</th>
                    <th className="text-right pb-3 text-xs font-semibold text-navy/50 uppercase">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </tbody>
              </table>
            </div>
          ) : campaignPerformance.length === 0 ? (
            <div className="text-center py-8 text-navy/50">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No campaign data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-3 text-xs font-semibold text-navy/50 uppercase">Campaign</th>
                    <th className="text-right pb-3 text-xs font-semibold text-navy/50 uppercase">Leads</th>
                    <th className="text-right pb-3 text-xs font-semibold text-navy/50 uppercase">Spend</th>
                    <th className="text-right pb-3 text-xs font-semibold text-navy/50 uppercase">CPL</th>
                    <th className="text-right pb-3 text-xs font-semibold text-navy/50 uppercase">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {campaignPerformance.map((campaign) => (
                    <tr key={campaign.name} className="hover:bg-gray-50/50">
                      <td className="py-3">
                        <p className="font-medium text-navy text-sm">{campaign.name}</p>
                        <p className="text-xs text-navy/50">{campaign.platform}</p>
                      </td>
                      <td className="py-3 text-right text-sm font-medium text-navy">{campaign.leads}</td>
                      <td className="py-3 text-right text-sm text-navy/70">{formatCurrency(campaign.spend)}</td>
                      <td className="py-3 text-right text-sm text-navy/70">{formatCurrency(campaign.cpl)}</td>
                      <td className="py-3 text-right">
                        <span className={`text-sm font-bold ${campaign.roas >= 3 ? 'text-studio' : campaign.roas >= 2 ? 'text-camel' : 'text-impact'}`}>
                          {campaign.roas}x
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* AI Insights (Pro) */}
      <FeatureGate feature="reports_advanced">
      {(isLoading || aiInsights.length > 0) && (
        <div className="bg-gradient-to-br from-impact/5 to-camel/5 rounded-2xl p-6 border border-impact/10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-impact flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-ivory" />
            </div>
            <h2 className="text-lg font-semibold text-navy">AI Insights</h2>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-4 rounded-xl border border-gray-200 bg-white/50 animate-pulse">
                  <div className="w-32 h-5 bg-gray-200 rounded mb-2" />
                  <div className="w-full h-4 bg-gray-200 rounded mb-1" />
                  <div className="w-3/4 h-4 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : aiInsights.length === 0 ? (
            <div className="text-center py-4 text-navy/50">
              <p>Generate a report to see AI-powered insights</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiInsights.map((insight, i) => (
                <div key={i} className={`p-4 rounded-xl border ${getInsightStyle(insight.type)}`}>
                  <h4 className={`font-semibold mb-1 ${getInsightIcon(insight.type)}`}>{insight.title}</h4>
                  <p className="text-sm text-navy/70">{insight.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </FeatureGate>

      {/* Recent Reports */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-navy">Recent Reports</h2>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            <ReportRowSkeleton />
            <ReportRowSkeleton />
            <ReportRowSkeleton />
          </div>
        ) : !reportsData?.reports || reportsData.reports.length === 0 ? (
          <div className="text-center py-8 text-navy/50">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No reports generated yet</p>
            <button
              onClick={handleGenerateReport}
              className="mt-4 text-sm font-medium text-impact hover:text-impact-light"
            >
              Generate your first report
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reportsData.reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-impact/20 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-navy/60" />
                  </div>
                  <div>
                    <p className="font-medium text-navy group-hover:text-impact transition-colors">
                      {getReportName(report)}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-navy/50">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(report.created_at)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium capitalize">
                        {report.report_type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSendReport(report.id)
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                    title="Send via email"
                  >
                    <Mail className="w-4 h-4 text-navy/60" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
