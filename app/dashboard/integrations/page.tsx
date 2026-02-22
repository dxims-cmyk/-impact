'use client'

import { useState } from 'react'
import {
  Plug,
  Plus,
  Check,
  X,
  ExternalLink,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  MoreHorizontal,
  Link2,
  Unlink,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { useIntegrations, useDisconnectIntegration, useSyncIntegration, useConnectIntegration, Integration } from '@/lib/hooks'
import { toast } from 'sonner'
import { formatRelativeTime } from '@/lib/utils'

// Platform icons
const MetaIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
)

const GoogleIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const TikTokIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
)

const TwilioIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#F22F46">
    <path d="M12 0C5.381 0 0 5.381 0 12s5.381 12 12 12 12-5.381 12-12S18.619 0 12 0zm0 20.4c-4.639 0-8.4-3.761-8.4-8.4S7.361 3.6 12 3.6s8.4 3.761 8.4 8.4-3.761 8.4-8.4 8.4zm3.6-8.4a3.6 3.6 0 11-7.2 0 3.6 3.6 0 017.2 0z"/>
  </svg>
)

const ResendIcon = () => (
  <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
    <span className="text-white text-xs font-bold">R</span>
  </div>
)

const ManyChatIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0084FF">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 2.17.7 4.19 1.89 5.83L2 22l4.17-1.89C7.81 21.3 9.83 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.9 0-3.67-.55-5.17-1.49l-.36-.22-3.76.99.99-3.76-.22-.36C2.55 13.67 2 11.9 2 10c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
  </svg>
)

const SlackIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24">
    <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/>
    <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"/>
    <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"/>
    <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
  </svg>
)

const CalendlyIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#006BFF">
    <path d="M19.655 14.262c.281-.281.562-.563.562-.844 0-.281-.281-.563-.562-.844l-2.25-2.25c-.282-.281-.563-.562-.844-.562-.282 0-.563.281-.844.562l-3.656 3.656-1.969-1.968c-.281-.282-.562-.563-.844-.563-.281 0-.562.281-.843.563l-2.25 2.25c-.282.28-.563.562-.563.843 0 .282.281.563.563.844l4.781 4.781c.281.282.563.563.844.563.281 0 .562-.281.843-.563l7.032-7.031zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
  </svg>
)

// Static integration metadata (for integrations not yet connected)
const integrationMeta: Record<string, {
  name: string
  description: string
  icon: React.ComponentType
  category: 'advertising' | 'messaging' | 'notifications' | 'scheduling'
  provider: Integration['provider']
}> = {
  meta_ads: {
    name: 'Meta Ads',
    description: 'Sync campaigns, leads, and performance data from Facebook & Instagram Ads',
    icon: MetaIcon,
    category: 'advertising',
    provider: 'meta_ads',
  },
  google_ads: {
    name: 'Google Ads',
    description: 'Import campaigns and leads from Google Search, Display, and YouTube Ads',
    icon: GoogleIcon,
    category: 'advertising',
    provider: 'google_ads',
  },
  tiktok_ads: {
    name: 'TikTok Ads',
    description: 'Connect your TikTok Ads account to sync campaigns and leads',
    icon: TikTokIcon,
    category: 'advertising',
    provider: 'tiktok_ads',
  },
  twilio: {
    name: 'Twilio',
    description: 'SMS and WhatsApp messaging for lead communication',
    icon: TwilioIcon,
    category: 'messaging',
    provider: 'twilio',
  },
  resend: {
    name: 'Resend',
    description: 'Transactional and marketing emails',
    icon: ResendIcon,
    category: 'messaging',
    provider: 'resend',
  },
  slack: {
    name: 'Slack',
    description: 'Get instant notifications for hot leads and important events',
    icon: SlackIcon,
    category: 'notifications',
    provider: 'slack',
  },
  calendly: {
    name: 'Calendly',
    description: 'Sync appointments and booking data',
    icon: CalendlyIcon,
    category: 'scheduling',
    provider: 'calendly',
  },
}

const categories = [
  { id: 'all', name: 'All' },
  { id: 'advertising', name: 'Advertising' },
  { id: 'messaging', name: 'Messaging' },
  { id: 'notifications', name: 'Notifications' },
  { id: 'scheduling', name: 'Scheduling' },
]

// Loading skeleton
function IntegrationCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-200" />
          <div>
            <div className="w-24 h-5 bg-gray-200 rounded mb-2" />
            <div className="w-16 h-3 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
      <div className="w-full h-4 bg-gray-200 rounded mb-2" />
      <div className="w-3/4 h-4 bg-gray-200 rounded mb-4" />
      <div className="w-full h-10 bg-gray-200 rounded-xl" />
    </div>
  )
}

export default function IntegrationsPage() {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)

  // Fetch integrations
  const { data: integrations, isLoading } = useIntegrations()

  // Mutations
  const disconnectIntegration = useDisconnectIntegration()
  const syncIntegration = useSyncIntegration()
  const connectIntegration = useConnectIntegration()

  // Build combined list of all integrations (connected + available)
  const allIntegrations = Object.entries(integrationMeta).map(([key, meta]) => {
    const connected = integrations?.find(i => i.provider === meta.provider)
    return {
      ...meta,
      id: connected?.id || key,
      status: connected?.status || 'disconnected',
      lastSync: connected?.last_sync_at,
      accountName: connected?.account_name,
      accountId: connected?.account_id,
      syncError: connected?.sync_error,
      metadata: connected?.metadata,
    }
  })

  const filteredIntegrations = allIntegrations.filter(integration => {
    return categoryFilter === 'all' || integration.category === categoryFilter
  })

  const connectedCount = allIntegrations.filter(i => i.status === 'connected').length

  const handleConnect = async (provider: Integration['provider']) => {
    // Only ad platforms support OAuth
    if (!['meta_ads', 'google_ads', 'tiktok_ads'].includes(provider)) {
      toast.error('This integration requires manual configuration in settings')
      return
    }

    setConnectingProvider(provider)
    try {
      const url = await connectIntegration.mutateAsync(provider as 'meta_ads' | 'google_ads' | 'tiktok_ads')
      // Redirect to OAuth URL
      window.location.href = url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to connect integration')
      setConnectingProvider(null)
    }
  }

  const handleDisconnect = async (id: string) => {
    setDisconnectingId(id)
    try {
      await disconnectIntegration.mutateAsync(id)
      toast.success('Integration disconnected')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect integration')
    } finally {
      setDisconnectingId(null)
    }
  }

  const handleSync = async (id: string) => {
    setSyncingId(id)
    try {
      await syncIntegration.mutateAsync(id)
      toast.success('Sync completed successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sync integration')
    } finally {
      setSyncingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Integrations</h1>
          <p className="text-navy/60">Connect your tools and automate your workflow</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-navy/50">
            <span className="font-semibold text-navy">{connectedCount}</span> of {allIntegrations.length} connected
          </span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setCategoryFilter(category.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              categoryFilter === category.id
                ? 'bg-impact text-ivory'
                : 'bg-white border border-gray-200 text-navy hover:bg-gray-50'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <IntegrationCardSkeleton />
            <IntegrationCardSkeleton />
            <IntegrationCardSkeleton />
            <IntegrationCardSkeleton />
            <IntegrationCardSkeleton />
            <IntegrationCardSkeleton />
          </>
        ) : (
          filteredIntegrations.map((integration) => {
            const Icon = integration.icon
            const isConnected = integration.status === 'connected'
            const hasError = integration.status === 'error'
            const isSyncing = syncingId === integration.id
            const isConnecting = connectingProvider === integration.provider
            const isDisconnecting = disconnectingId === integration.id

            return (
              <div
                key={integration.id}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-impact/20 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
                      <Icon />
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy">{integration.name}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                        isConnected ? 'text-studio' : hasError ? 'text-impact' : 'text-navy/40'
                      }`}>
                        {isConnected ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Connected
                          </>
                        ) : hasError ? (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Error
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Not connected
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-navy/60 mb-4">{integration.description}</p>

                {isConnected && integration.accountName && (
                  <div className="mb-4 p-3 rounded-xl bg-gray-50 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-navy/60">Account</span>
                      <span className="font-medium text-navy">{integration.accountName}</span>
                    </div>
                  </div>
                )}

                {hasError && integration.syncError && (
                  <div className="mb-4 p-3 rounded-xl bg-impact/5 border border-impact/20 text-sm">
                    <p className="text-impact text-xs">{integration.syncError}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  {isConnected || hasError ? (
                    <>
                      <span className="text-xs text-navy/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {integration.lastSync ? `Last sync: ${formatRelativeTime(integration.lastSync)}` : 'Never synced'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSync(integration.id)}
                          disabled={isSyncing}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                          title="Sync Now"
                        >
                          {isSyncing ? (
                            <Loader2 className="w-4 h-4 text-navy/60 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 text-navy/60" />
                          )}
                        </button>
                        <button className="p-2 rounded-lg opacity-50 cursor-not-allowed" title="Coming Soon" disabled>
                          <Settings className="w-4 h-4 text-navy/60" />
                        </button>
                        <button
                          onClick={() => handleDisconnect(integration.id)}
                          disabled={isDisconnecting}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                          title="Disconnect"
                        >
                          {isDisconnecting ? (
                            <Loader2 className="w-4 h-4 text-navy/60 animate-spin" />
                          ) : (
                            <Unlink className="w-4 h-4 text-navy/60" />
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(integration.provider)}
                      disabled={isConnecting}
                      className="w-full py-2.5 rounded-xl bg-impact text-ivory font-semibold text-sm hover:bg-impact-light transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isConnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Link2 className="w-4 h-4" />
                      )}
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* API & Webhooks Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-navy">API & Webhooks</h2>
            <p className="text-sm text-navy/50">Connect custom integrations</p>
          </div>
          <button className="text-sm font-medium text-navy/30 cursor-not-allowed flex items-center gap-1" title="Coming Soon" disabled>
            View Documentation <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-gray-100 opacity-50 cursor-not-allowed" title="Coming Soon">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-navy/60" />
                </div>
                <div>
                  <h4 className="font-medium text-navy">API Keys</h4>
                  <p className="text-sm text-navy/50">Manage your API credentials</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-navy/30" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-gray-100 opacity-50 cursor-not-allowed" title="Coming Soon">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center">
                  <Plug className="w-5 h-5 text-navy/60" />
                </div>
                <div>
                  <h4 className="font-medium text-navy">Webhooks</h4>
                  <p className="text-sm text-navy/50">Configure incoming webhooks</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-navy/30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
