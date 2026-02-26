'use client'

import { usePlan } from '@/lib/hooks/use-plan'
import { useCreatives } from '@/lib/hooks/use-creatives'
import {
  Images,
  TrendingUp,
  DollarSign,
  Play,
  Image as ImageIcon,
  Lock,
  Loader2,
} from 'lucide-react'

export default function GalleryPage(): JSX.Element {
  const { isPro } = usePlan()
  const { creatives, isLoading } = useCreatives()

  // If not Pro, show upgrade prompt
  if (!isPro) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-navy mb-3">Content Gallery</h1>
          <p className="text-navy/60 mb-6">
            View all ads and content created by AM:PM for your campaigns,
            with performance rankings and recommendations.
          </p>
          <p className="text-navy/40 text-sm mb-6">
            This feature is available on :Impact Pro
          </p>
          <a
            href="mailto:dxims@mediampm.com?subject=Impact Pro Upgrade - Content Gallery"
            className="btn-primary text-sm px-6 py-2.5"
          >
            Contact AM:PM to Upgrade
          </a>
        </div>
      </div>
    )
  }

  // Calculate totals
  const totalSpend = creatives?.reduce((sum, c) => sum + (c.spend || 0), 0) || 0
  const totalRevenue = creatives?.reduce((sum, c) => sum + (c.revenue || 0), 0) || 0
  const totalLeads = creatives?.reduce((sum, c) => sum + (c.leads_count || 0), 0) || 0
  const avgRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(1) : '0'

  // Sort by ROAS (best first)
  const sortedCreatives = [...(creatives || [])].sort((a, b) => (b.roas || 0) - (a.roas || 0))

  const getRecommendationBadge = (rec: string): { color: string; label: string } => {
    const styles: Record<string, { color: string; label: string }> = {
      scale: { color: 'bg-green-100 text-green-700', label: 'Scale' },
      maintain: { color: 'bg-blue-100 text-blue-700', label: 'Maintain' },
      test_variation: { color: 'bg-yellow-100 text-yellow-700', label: 'Test Variation' },
      retire: { color: 'bg-red-100 text-red-700', label: 'Retire' },
    }
    return styles[rec] || { color: 'bg-gray-100 text-gray-700', label: rec }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-navy/30" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy">Content Gallery</h1>
        <p className="text-navy/60 text-sm mt-1">All ads and content created by AM:PM for your campaigns</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center">
              <Images className="w-5 h-5 text-navy/60" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">{creatives?.length || 0}</p>
              <p className="text-xs text-navy/50">Total Creatives</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-navy/60" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">&pound;{totalSpend.toLocaleString()}</p>
              <p className="text-xs text-navy/50">Total Spend</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-studio/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-studio" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">&pound;{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-navy/50">Total Revenue</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-camel/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-camel" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">{avgRoas}x</p>
              <p className="text-xs text-navy/50">Average ROAS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Rankings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-semibold text-navy">Performance Rankings</h2>
          <p className="text-sm text-navy/50 mt-0.5">Creatives ranked by ROAS (best to worst)</p>
        </div>
        <div className="p-6">
          {sortedCreatives.length === 0 ? (
            <p className="text-navy/50 text-center py-8">
              No creatives yet. AM:PM will add content here as they create ads for your campaigns.
            </p>
          ) : (
            <div className="space-y-3">
              {sortedCreatives.map((creative, index) => (
                <div
                  key={creative.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-colors"
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Thumbnail */}
                  <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    {creative.thumbnail_url ? (
                      <img src={creative.thumbnail_url} alt={creative.name} className="object-cover w-full h-full" />
                    ) : creative.type === 'video' ? (
                      <Play className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-navy truncate">{creative.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-navy/5 text-navy/60 capitalize">{creative.platform}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-navy/5 text-navy/60 capitalize">{creative.type}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden lg:grid grid-cols-5 gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-navy/40 text-xs">Spend</p>
                      <p className="font-medium text-navy">&pound;{creative.spend}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-navy/40 text-xs">Leads</p>
                      <p className="font-medium text-navy">{creative.leads_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-navy/40 text-xs">Revenue</p>
                      <p className="font-medium text-navy">&pound;{creative.revenue}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-navy/40 text-xs">ROAS</p>
                      <p className={`font-bold ${
                        creative.roas >= 3 ? 'text-studio' :
                        creative.roas >= 1 ? 'text-camel' :
                        'text-impact'
                      }`}>
                        {creative.roas}x
                      </p>
                    </div>
                    <div className="text-center">
                      {creative.recommendation && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRecommendationBadge(creative.recommendation).color}`}>
                          {getRecommendationBadge(creative.recommendation).label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
