'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Eye,
  MousePointer,
  BarChart3,
  PauseCircle,
  PlayCircle,
  MoreHorizontal,
  ExternalLink,
  RefreshCw,
  Trash2,
  ChevronDown,
  ArrowUpDown,
  Loader2,
} from 'lucide-react'
import { useCampaigns, useCampaignMetrics, useSyncCampaigns, useDeleteCampaigns } from '@/lib/hooks'
import { toast } from 'sonner'
import { NewCampaignModal } from '@/components/dashboard/new-campaign-modal'
import type { AdCampaign } from '@/types/database'

// Platform icons as simple components
const MetaIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
)

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const TikTokIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
)

const platforms = [
  { value: 'all', label: 'All Platforms' },
  { value: 'meta', label: 'Meta Ads' },
  { value: 'google', label: 'Google Ads' },
  { value: 'tiktok', label: 'TikTok Ads' },
]

const statuses = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
]

// Skeleton for table rows
function CampaignRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-4"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-4"><div className="w-40 h-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-4"><div className="w-20 h-6 bg-gray-200 rounded-full" /></td>
      <td className="px-4 py-4"><div className="w-16 h-6 bg-gray-200 rounded-full" /></td>
      <td className="px-4 py-4"><div className="w-20 h-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-4"><div className="w-16 h-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-4"><div className="w-12 h-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-4"><div className="w-10 h-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-4"><div className="w-16 h-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-4"><div className="w-12 h-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-4"><div className="w-16 h-4 bg-gray-200 rounded" /></td>
    </tr>
  )
}

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false)

  // Fetch campaigns and metrics
  const { data: campaignsData, isLoading: campaignsLoading, refetch } = useCampaigns()
  const { data: metricsData, isLoading: metricsLoading } = useCampaignMetrics()
  const syncCampaigns = useSyncCampaigns()
  const deleteCampaigns = useDeleteCampaigns()

  const campaigns = campaignsData?.campaigns || []
  const metrics = metricsData || { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalLeads: 0 }

  const isLoading = campaignsLoading || metricsLoading

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPlatform = platformFilter === 'all' || campaign.platform === platformFilter
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
      return matchesSearch && matchesPlatform && matchesStatus
    })
  }, [campaigns, searchQuery, platformFilter, statusFilter])

  // Calculate totals from filtered campaigns
  const totals = useMemo(() => {
    return filteredCampaigns.reduce((acc, c) => ({
      spent: acc.spent + (c.spent || 0),
      impressions: acc.impressions + (c.impressions || 0),
      clicks: acc.clicks + (c.clicks || 0),
      leads: acc.leads + (c.leads || 0),
    }), { spent: 0, impressions: 0, clicks: 0, leads: 0 })
  }, [filteredCampaigns])

  const avgCpl = totals.leads > 0 ? totals.spent / totals.leads : 0
  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0

  const toggleSelectAll = () => {
    if (selectedCampaigns.length === filteredCampaigns.length) {
      setSelectedCampaigns([])
    } else {
      setSelectedCampaigns(filteredCampaigns.map(c => c.id))
    }
  }

  const toggleSelectCampaign = (id: string) => {
    if (selectedCampaigns.includes(id)) {
      setSelectedCampaigns(selectedCampaigns.filter(c => c !== id))
    } else {
      setSelectedCampaigns([...selectedCampaigns, id])
    }
  }

  const handleSync = async () => {
    try {
      await syncCampaigns.mutateAsync()
      toast.success('Campaigns synced successfully')
      refetch()
    } catch (error) {
      toast.error('Failed to sync campaigns')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete campaign "${name}"? This cannot be undone.`)) return
    try {
      await deleteCampaigns.mutateAsync([id])
      setSelectedCampaigns(prev => prev.filter(c => c !== id))
      toast.success('Campaign deleted')
    } catch {
      toast.error('Failed to delete campaign')
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedCampaigns.length} campaigns? This cannot be undone.`)) return
    try {
      await deleteCampaigns.mutateAsync(selectedCampaigns)
      setSelectedCampaigns([])
      toast.success(`${selectedCampaigns.length} campaigns deleted`)
    } catch {
      toast.error('Failed to delete campaigns')
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'meta': return MetaIcon
      case 'google': return GoogleIcon
      case 'tiktok': return TikTokIcon
      default: return MetaIcon
    }
  }

  const getPlatformStyle = (platform: string) => {
    switch (platform) {
      case 'meta': return 'bg-blue-100 text-blue-700'
      case 'google': return 'bg-red-100 text-red-700'
      case 'tiktok': return 'bg-gray-900 text-white'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'meta': return 'Meta'
      case 'google': return 'Google'
      case 'tiktok': return 'TikTok'
      default: return platform
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'bg-studio/10 text-studio'
      case 'paused': return 'bg-camel/20 text-chocolate'
      case 'completed': return 'bg-navy/10 text-navy'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return PlayCircle
      case 'paused': return PauseCircle
      default: return PlayCircle
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatCurrency = (num: number) => {
    return '£' + num.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Campaigns</h1>
          <p className="text-navy/60">Monitor and manage your advertising campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncCampaigns.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-navy hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncCampaigns.isPending ? 'animate-spin' : ''}`} />
            Sync All
          </button>
          <button
            onClick={() => setShowNewCampaignModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-impact/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-impact" />
            </div>
            {isLoading ? (
              <div className="w-12 h-4 bg-gray-200 animate-pulse rounded" />
            ) : (
              <div className="flex items-center gap-1 text-sm font-medium text-studio">
                <TrendingUp className="w-4 h-4" />
                12%
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="w-24 h-7 bg-gray-200 animate-pulse rounded mb-1" />
          ) : (
            <p className="text-2xl font-bold text-navy mb-1">{formatCurrency(metrics.totalSpend || totals.spent)}</p>
          )}
          <p className="text-sm text-navy/50">Total Spend</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-vision/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-vision" />
            </div>
            {isLoading ? (
              <div className="w-12 h-4 bg-gray-200 animate-pulse rounded" />
            ) : (
              <div className="flex items-center gap-1 text-sm font-medium text-studio">
                <TrendingUp className="w-4 h-4" />
                8%
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="w-20 h-7 bg-gray-200 animate-pulse rounded mb-1" />
          ) : (
            <p className="text-2xl font-bold text-navy mb-1">{formatNumber(metrics.totalImpressions || totals.impressions)}</p>
          )}
          <p className="text-sm text-navy/50">Impressions</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-camel/10 flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-camel" />
            </div>
            {isLoading ? (
              <div className="w-12 h-4 bg-gray-200 animate-pulse rounded" />
            ) : (
              <div className="flex items-center gap-1 text-sm font-medium text-studio">
                <TrendingUp className="w-4 h-4" />
                5%
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="w-16 h-7 bg-gray-200 animate-pulse rounded mb-1" />
          ) : (
            <p className="text-2xl font-bold text-navy mb-1">{avgCtr.toFixed(2)}%</p>
          )}
          <p className="text-sm text-navy/50">Avg CTR</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-studio/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-studio" />
            </div>
            {isLoading ? (
              <div className="w-12 h-4 bg-gray-200 animate-pulse rounded" />
            ) : (
              <div className="flex items-center gap-1 text-sm font-medium text-studio">
                <TrendingUp className="w-4 h-4" />
                18%
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="w-12 h-7 bg-gray-200 animate-pulse rounded mb-1" />
          ) : (
            <p className="text-2xl font-bold text-navy mb-1">{metrics.totalLeads || totals.leads}</p>
          )}
          <p className="text-sm text-navy/50">Total Leads</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-impact/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-impact" />
            </div>
            {isLoading ? (
              <div className="w-12 h-4 bg-gray-200 animate-pulse rounded" />
            ) : (
              <div className="flex items-center gap-1 text-sm font-medium text-impact">
                <TrendingDown className="w-4 h-4" />
                -8%
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="w-20 h-7 bg-gray-200 animate-pulse rounded mb-1" />
          ) : (
            <p className="text-2xl font-bold text-navy mb-1">{formatCurrency(avgCpl)}</p>
          )}
          <p className="text-sm text-navy/50">Avg CPL</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
            />
          </div>

          {/* Platform Filter */}
          <div className="relative">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-navy bg-white focus:outline-none focus:ring-2 focus:ring-impact cursor-pointer"
            >
              {platforms.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-navy bg-white focus:outline-none focus:ring-2 focus:ring-impact cursor-pointer"
            >
              {statuses.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

        </div>

        {/* Bulk Actions */}
        {selectedCampaigns.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
            <span className="text-sm text-navy/60">{selectedCampaigns.length} selected</span>
            <button
              onClick={handleBulkDelete}
              disabled={deleteCampaigns.isPending}
              className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              {deleteCampaigns.isPending ? 'Deleting...' : 'Delete Selected'}
            </button>
            <button
              onClick={() => setSelectedCampaigns([])}
              className="text-sm font-medium text-navy/50 hover:text-navy"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-impact focus:ring-impact"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">
                <button className="flex items-center gap-1 hover:text-navy">
                  Campaign <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">Platform</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">Spend</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">Impressions</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">CTR</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">Leads</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">CPL</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">ROAS</th>
              <th className="w-20 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <>
                <CampaignRowSkeleton />
                <CampaignRowSkeleton />
                <CampaignRowSkeleton />
                <CampaignRowSkeleton />
              </>
            ) : filteredCampaigns.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-navy/50">
                  {searchQuery || platformFilter !== 'all' || statusFilter !== 'all'
                    ? 'No campaigns match your filters'
                    : 'No campaigns yet. Connect your ad accounts to see campaigns.'}
                </td>
              </tr>
            ) : (
              filteredCampaigns.map((campaign) => {
                const PlatformIcon = getPlatformIcon(campaign.platform)
                const StatusIcon = getStatusIcon(campaign.status || 'active')
                const budgetPercent = campaign.budget ? ((campaign.spent || 0) / campaign.budget) * 100 : 0
                const ctr = campaign.impressions ? ((campaign.clicks || 0) / campaign.impressions) * 100 : 0
                const cpl = campaign.leads ? (campaign.spent || 0) / campaign.leads : 0
                const roas = campaign.spent ? ((campaign.revenue || 0) / campaign.spent) : 0

                return (
                  <tr
                    key={campaign.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCampaigns.includes(campaign.id)}
                        onChange={() => toggleSelectCampaign(campaign.id)}
                        className="w-4 h-4 rounded border-gray-300 text-impact focus:ring-impact"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-navy group-hover:text-impact transition-colors">
                          {campaign.name}
                        </p>
                        {campaign.budget && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full max-w-[100px]">
                              <div
                                className="h-full bg-impact rounded-full"
                                style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-navy/50">
                              {budgetPercent.toFixed(0)}% of {formatCurrency(campaign.budget)}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getPlatformStyle(campaign.platform)}`}>
                        <PlatformIcon />
                        {getPlatformLabel(campaign.platform)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusStyle(campaign.status || 'active')}`}>
                        <StatusIcon className="w-3 h-3" />
                        {campaign.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-medium text-navy">{formatCurrency(campaign.spent || 0)}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm text-navy/70">{formatNumber(campaign.impressions || 0)}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm text-navy/70">{ctr.toFixed(2)}%</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-medium text-navy">{campaign.leads || 0}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`text-sm font-medium ${cpl < avgCpl ? 'text-studio' : 'text-impact'}`}>
                        {formatCurrency(cpl)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`text-sm font-bold ${roas >= 3 ? 'text-studio' : roas >= 2 ? 'text-camel' : 'text-impact'}`}>
                        {roas.toFixed(1)}x
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDelete(campaign.id, campaign.name)}
                          disabled={deleteCampaigns.isPending}
                          className="p-2 rounded-lg hover:bg-red-50 text-navy/40 hover:text-red-600 transition-colors"
                          title="Delete campaign"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <p className="text-sm text-navy/50">
            {isLoading ? (
              'Loading...'
            ) : (
              <>
                Showing <span className="font-medium text-navy">{filteredCampaigns.length}</span> of{' '}
                <span className="font-medium text-navy">{campaigns.length}</span> campaigns
              </>
            )}
          </p>
          <div className="flex items-center gap-4 text-sm">
            {!isLoading && (
              <span className="text-navy/50">
                Total: <span className="font-semibold text-navy">{formatCurrency(totals.spent)}</span> spent,{' '}
                <span className="font-semibold text-navy">{totals.leads}</span> leads
              </span>
            )}
          </div>
        </div>
      </div>

      <NewCampaignModal
        isOpen={showNewCampaignModal}
        onClose={() => {
          setShowNewCampaignModal(false)
          refetch()
        }}
      />
    </div>
  )
}
