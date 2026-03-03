'use client'

import { useState, useEffect, Suspense } from 'react'
import {
  Plug,
  Check,
  ExternalLink,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  ChevronRight,
  Loader2,
  Link2,
  Unlink,
  X,
  Copy,
  Calendar,
  Mail,
  Phone,
} from 'lucide-react'
import {
  useIntegrations,
  useIntegrationAvailability,
  useDisconnectIntegration,
  useSyncIntegration,
  useConnectIntegration,
  useSaveZapierWebhook,
  useRegisterIntegration,
  useVerifyCalcom,
  Integration,
  IntegrationAvailability,
  IntegrationProvider,
} from '@/lib/hooks/use-integrations'
import { useOrganization } from '@/lib/hooks/use-organization'
import { useUser } from '@/lib/hooks/use-user'
import { toast } from 'sonner'
import { formatRelativeTime } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

// ───────────────────────── SVG Icons ─────────────────────────

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

const SlackIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24">
    <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/>
    <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"/>
    <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"/>
    <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
  </svg>
)

const WhatsAppIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const CalComIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
)

const ZapierIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#FF4A00">
    <path d="M15.478 8.522l-2.204 2.204a5.397 5.397 0 010 2.548l2.204 2.204a8.062 8.062 0 000-6.956zm-6.956 0a8.062 8.062 0 000 6.956l2.204-2.204a5.397 5.397 0 010-2.548L8.522 8.522zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7zm0-9.5C8.134 6 5 9.134 5 13s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7z"/>
  </svg>
)

const ResendIcon = () => (
  <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
    <span className="text-white text-xs font-bold">R</span>
  </div>
)

const VapiIcon = () => (
  <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded flex items-center justify-center">
    <Phone className="w-3.5 h-3.5 text-white" />
  </div>
)

const ManyChatIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0084FF">
    <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.908 1.434 5.503 3.678 7.2V22l3.405-1.868c.907.252 1.871.389 2.917.389 5.523 0 10-4.145 10-9.248C22 6.145 17.523 2 12 2zm1.076 12.449l-2.55-2.72-4.98 2.72 5.476-5.816 2.613 2.72 4.916-2.72-5.475 5.816z"/>
  </svg>
)

const StripeIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#635BFF">
    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
  </svg>
)

const CalendlyIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#006BFF">
    <path d="M19.655 14.262c-.508.79-1.197 1.433-2.045 1.902-.85.469-1.834.71-2.914.71-.544 0-1.07-.072-1.556-.206a4.725 4.725 0 01-1.32-.602 5.738 5.738 0 01-1.146-.985c-.331-.382-.622-.811-.864-1.275a7.006 7.006 0 01-.71-1.906l2.345-.572c.126.595.34 1.13.646 1.592.305.466.705.837 1.198 1.105.491.27 1.06.404 1.707.404.65 0 1.221-.145 1.716-.43.493-.287.88-.685 1.155-1.19.276-.505.415-1.085.415-1.734a3.78 3.78 0 00-.415-1.744c-.276-.51-.664-.912-1.155-1.198-.496-.289-1.067-.431-1.716-.431-.544 0-1.047.106-1.507.32-.46.213-.86.508-1.197.884l-2.044-1.17L11.51 4h7.765v2.345h-5.176l-.675 2.758c.35-.207.735-.367 1.155-.479.42-.111.867-.17 1.337-.17 1.08 0 2.064.24 2.914.716.848.475 1.537 1.12 2.045 1.916.51.793.765 1.693.765 2.691 0 1-.255 1.89-.765 2.685-.408.635-.96 1.167-1.22 1.8z"/>
  </svg>
)

const XeroIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#13B5EA">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 13.49l-1.41 1.41L12 13.67 8.77 16.9l-1.41-1.41L10.59 12 7.36 8.77l1.41-1.41L12 10.59l3.23-3.23 1.41 1.41L13.41 12l3.23 3.49z"/>
  </svg>
)

// ───────────────────────── Types ─────────────────────────

type ConnectType = 'oauth' | 'webhook_url' | 'webhook_display' | 'pre_configured'

interface IntegrationMeta {
  name: string
  description: string
  icon: React.ComponentType
  category: 'advertising' | 'messaging' | 'notifications' | 'scheduling' | 'automation' | 'payments' | 'ai'
  provider: IntegrationProvider
  connectType: ConnectType
}

// ───────────────────────── Static Config ─────────────────────────

const integrationMeta: Record<string, IntegrationMeta> = {
  // OAuth integrations (client connects their own account)
  meta_ads: {
    name: 'Meta Ads',
    description: 'Sync campaigns, leads, and performance data from Facebook & Instagram Ads',
    icon: MetaIcon,
    category: 'advertising',
    provider: 'meta_ads',
    connectType: 'oauth',
  },
  google_ads: {
    name: 'Google Ads',
    description: 'Import campaigns and leads from Google Search, Display, and YouTube Ads',
    icon: GoogleIcon,
    category: 'advertising',
    provider: 'google_ads',
    connectType: 'oauth',
  },
  tiktok_ads: {
    name: 'TikTok Ads',
    description: 'Connect your TikTok Ads account to sync campaigns and leads',
    icon: TikTokIcon,
    category: 'advertising',
    provider: 'tiktok_ads',
    connectType: 'oauth',
  },
  slack: {
    name: 'Slack',
    description: 'Get instant lead notifications in your Slack workspace',
    icon: SlackIcon,
    category: 'notifications',
    provider: 'slack',
    connectType: 'oauth',
  },
  google_calendar: {
    name: 'Google Calendar',
    description: 'Sync appointments and bookings to Google Calendar',
    icon: GoogleIcon,
    category: 'scheduling',
    provider: 'google_calendar',
    connectType: 'oauth',
  },
  // Webhook URL (client provides their URL)
  zapier: {
    name: 'Zapier',
    description: 'Connect to 5,000+ apps — send lead data to any tool via webhook',
    icon: ZapierIcon,
    category: 'automation',
    provider: 'zapier',
    connectType: 'webhook_url',
  },
  // Webhook display (we show client the URL to paste in their tool)
  calcom: {
    name: 'Cal.com',
    description: 'Auto-create appointments from Cal.com bookings',
    icon: CalComIcon,
    category: 'scheduling',
    provider: 'calcom',
    connectType: 'webhook_display',
  },
  // Pre-configured (uses our API keys)
  whatsapp: {
    name: 'WhatsApp',
    description: 'Instant lead notifications to your phone via WhatsApp Business API',
    icon: WhatsAppIcon,
    category: 'notifications',
    provider: 'whatsapp',
    connectType: 'pre_configured',
  },
  resend: {
    name: 'Resend',
    description: 'Transactional emails — auto-response to prospects, team notifications',
    icon: ResendIcon,
    category: 'messaging',
    provider: 'resend',
    connectType: 'pre_configured',
  },
  // AI features
  vapi: {
    name: 'AI Receptionist',
    description: '24/7 AI phone answering — qualifies callers, books appointments, sends transcripts',
    icon: VapiIcon,
    category: 'ai',
    provider: 'vapi',
    connectType: 'pre_configured',
  },
  // Instagram / Messenger
  manychat: {
    name: 'ManyChat',
    description: 'Capture leads from Instagram DMs and Messenger — "Comment X to get Y" flows',
    icon: ManyChatIcon,
    category: 'messaging',
    provider: 'manychat',
    connectType: 'webhook_display',
  },
  // Payments
  stripe: {
    name: 'Stripe',
    description: 'Collect deposits and payments from leads — send payment links via WhatsApp/email',
    icon: StripeIcon,
    category: 'payments',
    provider: 'stripe',
    connectType: 'oauth',
  },
  // Scheduling alt
  calendly: {
    name: 'Calendly',
    description: 'Sync Calendly bookings to your dashboard — alternative to Cal.com',
    icon: CalendlyIcon,
    category: 'scheduling',
    provider: 'calendly',
    connectType: 'oauth',
  },
  // Invoicing
  xero: {
    name: 'Xero',
    description: 'Auto-create invoices when leads convert — UK accounting integration',
    icon: XeroIcon,
    category: 'payments',
    provider: 'xero',
    connectType: 'oauth',
  },
}

const categories = [
  { id: 'all', name: 'All' },
  { id: 'ai', name: 'AI' },
  { id: 'notifications', name: 'Notifications' },
  { id: 'messaging', name: 'Messaging' },
  { id: 'scheduling', name: 'Scheduling' },
  { id: 'payments', name: 'Payments' },
  { id: 'advertising', name: 'Advertising' },
  { id: 'automation', name: 'Automation' },
]

// ───────────────────────── Skeleton ─────────────────────────

function IntegrationCardSkeleton(): React.ReactElement {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gray-200" />
        <div>
          <div className="w-24 h-5 bg-gray-200 rounded mb-2" />
          <div className="w-16 h-3 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="w-full h-4 bg-gray-200 rounded mb-2" />
      <div className="w-3/4 h-4 bg-gray-200 rounded mb-4" />
      <div className="w-full h-10 bg-gray-200 rounded-xl" />
    </div>
  )
}

// ───────────────────────── Modals ─────────────────────────

function ZapierModal({
  isOpen,
  onClose,
  currentUrl,
}: {
  isOpen: boolean
  onClose: () => void
  currentUrl: string
}): React.ReactElement | null {
  const [url, setUrl] = useState(currentUrl)
  const saveWebhook = useSaveZapierWebhook()

  useEffect(() => { setUrl(currentUrl) }, [currentUrl])

  if (!isOpen) return null

  const handleSave = async (): Promise<void> => {
    if (!url.startsWith('https://')) {
      toast.error('Webhook URL must start with https://')
      return
    }
    try {
      await saveWebhook.mutateAsync(url)
      toast.success('Zapier webhook saved! New leads will be sent to Zapier.')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center"><ZapierIcon /></div>
            <h3 className="text-lg font-semibold text-navy">Connect Zapier</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-navy/40" /></button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-orange-50 rounded-xl text-sm text-navy/70">
            <p className="font-medium text-navy mb-1">How it works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create a Zap in Zapier with &quot;Webhooks by Zapier&quot; as the trigger</li>
              <li>Select &quot;Catch Hook&quot; as the event</li>
              <li>Copy the webhook URL Zapier gives you</li>
              <li>Paste it below and save</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Zapier Webhook URL</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-impact/30 focus:border-impact"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-navy font-medium text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveWebhook.isPending || !url}
              className="flex-1 py-2.5 rounded-xl bg-impact text-ivory font-semibold text-sm hover:bg-impact-light disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saveWebhook.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Webhook
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CalcomModal({
  isOpen,
  onClose,
  orgSlug,
}: {
  isOpen: boolean
  onClose: () => void
  orgSlug: string
}): React.ReactElement | null {
  const registerIntegration = useRegisterIntegration()
  const verifyCalcom = useVerifyCalcom()
  const [verifyError, setVerifyError] = useState<string | null>(null)

  if (!isOpen) return null

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/calcom?org_slug=${orgSlug}`
  const isVerifying = verifyCalcom.isPending || registerIntegration.isPending

  const copyUrl = (): void => {
    navigator.clipboard.writeText(webhookUrl)
    toast.success('Webhook URL copied!')
  }

  const handleVerifyAndConnect = async (): Promise<void> => {
    setVerifyError(null)
    try {
      const result = await verifyCalcom.mutateAsync()

      if (result.verified) {
        // Webhook confirmed in Cal.com — register the integration
        await registerIntegration.mutateAsync({
          provider: 'calcom',
          account_name: 'Cal.com Webhook',
          metadata: { webhook_url: webhookUrl, verified: true },
        })
        toast.success('Cal.com verified and connected!')
        onClose()
      } else if (result.reason) {
        // API unreachable — let user force-connect with warning
        setVerifyError(result.reason)
      } else {
        setVerifyError('Webhook not found in your Cal.com account. Please add the URL in Cal.com Settings → Developer → Webhooks first.')
      }
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Verification failed')
    }
  }

  const handleForceConnect = async (): Promise<void> => {
    try {
      await registerIntegration.mutateAsync({
        provider: 'calcom',
        account_name: 'Cal.com Webhook',
        metadata: { webhook_url: webhookUrl, verified: false },
      })
      toast.success('Cal.com marked as connected (unverified)')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to register')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"><CalComIcon /></div>
            <h3 className="text-lg font-semibold text-navy">Connect Cal.com</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-navy/40" /></button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-xl text-sm text-navy/70">
            <p className="font-medium text-navy mb-1">Setup instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to Cal.com &rarr; Settings &rarr; Developer &rarr; Webhooks</li>
              <li>Click &quot;New Webhook&quot;</li>
              <li>Paste the URL below</li>
              <li>Select events: <strong>BOOKING_CREATED</strong>, <strong>BOOKING_CANCELLED</strong>, <strong>BOOKING_RESCHEDULED</strong></li>
              <li>Save in Cal.com, then click &quot;Verify &amp; Connect&quot; below</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Your Webhook URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-navy/70 font-mono"
              />
              <button
                onClick={copyUrl}
                className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center gap-1 text-sm font-medium text-navy"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>

          {verifyError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800 mb-2">{verifyError}</p>
              <button
                onClick={handleForceConnect}
                disabled={registerIntegration.isPending}
                className="text-xs text-amber-700 underline hover:text-amber-900"
              >
                Connect anyway (skip verification)
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-navy font-medium text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleVerifyAndConnect}
              disabled={isVerifying}
              className="flex-1 py-2.5 rounded-xl bg-impact text-ivory font-semibold text-sm hover:bg-impact-light disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isVerifying ? 'Verifying...' : 'Verify & Connect'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ManychatModal({
  isOpen,
  onClose,
  orgSlug,
}: {
  isOpen: boolean
  onClose: () => void
  orgSlug: string
}): React.ReactElement | null {
  const registerIntegration = useRegisterIntegration()

  if (!isOpen) return null

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/manychat?org_slug=${orgSlug}`

  const copyUrl = (): void => {
    navigator.clipboard.writeText(webhookUrl)
    toast.success('Webhook URL copied!')
  }

  const handleDone = async (): Promise<void> => {
    try {
      await registerIntegration.mutateAsync({
        provider: 'manychat' as 'calcom',
        account_name: 'ManyChat Webhook',
        metadata: { webhook_url: webhookUrl },
      })
      toast.success('ManyChat connected!')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to register')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><ManyChatIcon /></div>
            <h3 className="text-lg font-semibold text-navy">Connect ManyChat</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-navy/40" /></button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-xl text-sm text-navy/70">
            <p className="font-medium text-navy mb-1">Setup instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to ManyChat &rarr; Settings &rarr; Webhooks</li>
              <li>Add a new webhook with the URL below</li>
              <li>In your flows, add an &quot;External Request&quot; action pointing to this URL</li>
              <li>Map subscriber fields: first_name, last_name, email, phone, ig_username</li>
              <li>Save in ManyChat, then click &quot;Mark as Connected&quot; below</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Your Webhook URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-navy/70 font-mono"
              />
              <button
                onClick={copyUrl}
                className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center gap-1 text-sm font-medium text-navy"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-navy font-medium text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleDone}
              disabled={registerIntegration.isPending}
              className="flex-1 py-2.5 rounded-xl bg-impact text-ivory font-semibold text-sm hover:bg-impact-light disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {registerIntegration.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Mark as Connected
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ───────────────────────── Main Page ─────────────────────────

function IntegrationsPageContent(): React.ReactElement {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null)
  const [zapierModalOpen, setZapierModalOpen] = useState(false)
  const [calcomModalOpen, setCalcomModalOpen] = useState(false)
  const [manychatModalOpen, setManychatModalOpen] = useState(false)

  const searchParams = useSearchParams()
  const { data: integrations, isLoading } = useIntegrations()
  const { data: availability } = useIntegrationAvailability()
  const { data: org } = useOrganization()
  const { data: user } = useUser()
  const connectIntegration = useConnectIntegration()
  const disconnectIntegration = useDisconnectIntegration()

  const orgSlug = user?.organization?.slug || ''
  const orgSettings = (org?.settings || {}) as Record<string, unknown>

  // Show toast for OAuth callback results
  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    if (connected) {
      toast.success(`${connected.replace('_', ' ')} connected successfully!`)
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/integrations')
    }
    if (error) {
      toast.error(`Connection failed: ${error.replace(/_/g, ' ')}`)
      window.history.replaceState({}, '', '/dashboard/integrations')
    }
  }, [searchParams])

  // Build availability map: provider -> 'available' | 'coming_soon' | 'env_configured'
  const availabilityMap: Record<string, string> = {}
  availability?.forEach(a => { availabilityMap[a.provider] = a.status })

  // Build combined integration list
  const allIntegrations = Object.entries(integrationMeta).map(([key, meta]) => {
    const dbRow = integrations?.find(i => i.provider === meta.provider)
    const isDbConnected = dbRow?.status === 'connected' || dbRow?.status === 'error'
    const platformStatus = availabilityMap[meta.provider]

    let effectiveStatus: 'connected' | 'available' | 'coming_soon' | 'active'
    if (meta.connectType === 'pre_configured') {
      effectiveStatus = 'active'
    } else if (isDbConnected) {
      effectiveStatus = 'connected'
    } else if (platformStatus === 'coming_soon') {
      effectiveStatus = 'coming_soon'
    } else {
      effectiveStatus = 'available'
    }

    return {
      ...meta,
      key,
      dbId: dbRow?.id,
      status: effectiveStatus,
      accountName: dbRow?.account_name,
      lastSync: dbRow?.last_sync_at,
      syncError: dbRow?.sync_error,
    }
  })

  const filteredIntegrations = allIntegrations.filter(i =>
    categoryFilter === 'all' || i.category === categoryFilter
  )

  const connectedCount = allIntegrations.filter(
    i => i.status === 'connected' || i.status === 'active'
  ).length

  // ─── Handlers ───

  const handleConnect = async (meta: typeof allIntegrations[number]): Promise<void> => {
    if (meta.connectType === 'webhook_url') {
      setZapierModalOpen(true)
      return
    }

    if (meta.connectType === 'webhook_display') {
      if (meta.provider === 'manychat') {
        setManychatModalOpen(true)
      } else {
        setCalcomModalOpen(true)
      }
      return
    }

    if (meta.connectType === 'oauth') {
      setConnectingProvider(meta.provider)
      try {
        await connectIntegration.mutateAsync(meta.provider)
      } catch {
        toast.error('Failed to start connection')
        setConnectingProvider(null)
      }
    }
  }

  const handleDisconnect = async (meta: typeof allIntegrations[number]): Promise<void> => {
    if (!meta.dbId) return

    try {
      await disconnectIntegration.mutateAsync(meta.dbId)

      // If Zapier, also clear webhook URL from org settings
      if (meta.provider === 'zapier') {
        await fetch('/api/settings/organization', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: { zapier_webhook_url: null, zapier_enabled: false },
          }),
        })
      }

      toast.success(`${meta.name} disconnected`)
    } catch {
      toast.error(`Failed to disconnect ${meta.name}`)
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
        <span className="text-sm text-navy/50">
          <span className="font-semibold text-navy">{connectedCount}</span> of {allIntegrations.length} active
        </span>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map(category => (
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
          Array.from({ length: 6 }).map((_, i) => <IntegrationCardSkeleton key={i} />)
        ) : (
          filteredIntegrations.map(integration => {
            const Icon = integration.icon
            const isConnected = integration.status === 'connected' || integration.status === 'active'
            const isComingSoon = integration.status === 'coming_soon'
            const isConnecting = connectingProvider === integration.provider

            return (
              <div
                key={integration.key}
                className={`bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all ${
                  isConnected ? 'border-emerald-200' : isComingSoon ? 'border-gray-100 opacity-60' : 'border-gray-100 hover:border-impact/20'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isConnected ? 'bg-emerald-50' : integration.syncError ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                      <Icon />
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy">{integration.name}</h3>
                      {/* Status pill */}
                      {isConnected ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {integration.status === 'active' ? 'Active' : 'Connected'}
                        </span>
                      ) : integration.syncError ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Error
                        </span>
                      ) : isComingSoon ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Pending Setup
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-navy/40 bg-gray-50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          Not Connected
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-navy/60 mb-1">{integration.description}</p>

                {/* Connected account info + last sync */}
                {isConnected && (
                  <p className="text-xs text-navy/40 mb-3">
                    {integration.accountName && <>{integration.accountName} &middot; </>}
                    {integration.lastSync ? (
                      <>Last synced {formatRelativeTime(integration.lastSync)}</>
                    ) : (
                      <>No sync yet</>
                    )}
                  </p>
                )}

                {/* Error */}
                {integration.syncError && (
                  <div className="mb-3 p-2 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-red-600 text-xs">{integration.syncError}</p>
                  </div>
                )}

                {/* Action */}
                <div className="mt-auto pt-2">
                  {integration.status === 'active' ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-navy/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Managed by AM:PM
                      </span>
                      <span className="text-xs text-emerald-600 font-medium px-3 py-1.5 bg-emerald-50 rounded-lg">Live</span>
                    </div>
                  ) : integration.status === 'connected' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          toast.promise(
                            fetch(`/api/integrations/${integration.dbId}/sync`, { method: 'POST' }).then(r => {
                              if (!r.ok) throw new Error('Sync failed')
                              return r.json()
                            }),
                            {
                              loading: `Testing ${integration.name}...`,
                              success: `${integration.name} is working!`,
                              error: `${integration.name} connection test failed`,
                            }
                          )
                        }}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-navy/60 text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Test
                      </button>
                      <button
                        onClick={() => handleDisconnect(integration)}
                        disabled={disconnectIntegration.isPending}
                        className="px-3 py-2 rounded-lg border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors flex items-center gap-1"
                      >
                        <Unlink className="w-3 h-3" />
                        Disconnect
                      </button>
                    </div>
                  ) : isComingSoon ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-gray-50 text-navy/30 font-semibold text-sm border border-gray-100 cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Coming Soon
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(integration)}
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

      {/* API & Webhooks Info */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-navy">Webhooks</h2>
          <p className="text-sm text-navy/50">Endpoints receiving data from your connected tools</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'Lead Form', desc: 'POST to /api/webhooks/lead-form', active: true },
            { name: 'Meta Lead Gen', desc: 'Auto-imports leads from Facebook/Instagram ads', active: true },
            { name: 'Cal.com Bookings', desc: 'Auto-creates appointments from bookings', active: true },
            { name: 'Zapier Outbound', desc: 'Sends lead data to your Zap on new lead', active: allIntegrations.some(i => i.provider === 'zapier' && i.status === 'connected') },
          ].map(wh => (
            <div key={wh.name} className="p-3 rounded-xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${wh.active ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                  <Plug className={`w-4 h-4 ${wh.active ? 'text-emerald-500' : 'text-navy/30'}`} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-navy">{wh.name}</h4>
                  <p className="text-xs text-navy/40">{wh.desc}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                wh.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-navy/30'
              }`}>
                {wh.active ? 'Active' : 'Off'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <ZapierModal
        isOpen={zapierModalOpen}
        onClose={() => setZapierModalOpen(false)}
        currentUrl={(orgSettings.zapier_webhook_url as string) || ''}
      />
      <CalcomModal
        isOpen={calcomModalOpen}
        onClose={() => setCalcomModalOpen(false)}
        orgSlug={orgSlug}
      />
      <ManychatModal
        isOpen={manychatModalOpen}
        onClose={() => setManychatModalOpen(false)}
        orgSlug={orgSlug}
      />
    </div>
  )
}

export default function IntegrationsPage(): React.ReactElement {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-navy">Integrations</h1></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <IntegrationCardSkeleton key={i} />)}
        </div>
      </div>
    }>
      <IntegrationsPageContent />
    </Suspense>
  )
}
