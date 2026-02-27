'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePlan } from '@/lib/hooks/use-plan'
import { useOrganization } from '@/lib/hooks/use-organization'
import { Lock, Star, Plus, Trash2, ExternalLink, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

const PLATFORMS = [
  { id: 'google', name: 'Google Business', icon: '🔍', placeholder: 'https://g.page/r/your-business/review' },
  { id: 'facebook', name: 'Facebook', icon: '📘', placeholder: 'https://facebook.com/your-page/reviews' },
  { id: 'trustpilot', name: 'Trustpilot', icon: '⭐', placeholder: 'https://trustpilot.com/evaluate/your-business' },
  { id: 'tripadvisor', name: 'TripAdvisor', icon: '🦉', placeholder: 'https://tripadvisor.com/your-business' },
  { id: 'yelp', name: 'Yelp', icon: '📍', placeholder: 'https://yelp.com/biz/your-business' },
] as const

interface ReputationSettings {
  enabled: boolean
  trigger_stage: string
  delay_hours: number
  send_via: string[]
  email_subject: string
  email_message: string
  whatsapp_message: string
  sms_message: string
  max_requests_per_lead: number
}

interface ReviewPlatform {
  id: string
  platform: string
  review_url: string
  is_active: boolean
  created_at: string
}

export default function ReputationSettingsPage(): JSX.Element {
  const { isPro } = usePlan()
  const { data: organization } = useOrganization()
  const [settings, setSettings] = useState<ReputationSettings | null>(null)
  const [platforms, setPlatforms] = useState<ReviewPlatform[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/settings/reputation')
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
      }
    } catch {
      toast.error('Failed to load reputation settings')
    }
  }, [])

  const fetchPlatforms = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/settings/reputation/platforms')
      if (res.ok) {
        const data = await res.json()
        setPlatforms(data.platforms)
      }
    } catch {
      toast.error('Failed to load review platforms')
    }
  }, [])

  useEffect(() => {
    if (organization?.id) {
      Promise.all([fetchSettings(), fetchPlatforms()]).finally(() => setLoading(false))
    }
  }, [organization?.id, fetchSettings, fetchPlatforms])

  const saveSettings = async (): Promise<void> => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings/reputation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        toast.success('Reputation settings saved')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to save settings')
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const addPlatform = async (platformId: string, reviewUrl: string): Promise<void> => {
    try {
      const res = await fetch('/api/settings/reputation/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId, review_url: reviewUrl }),
      })
      if (res.ok) {
        await fetchPlatforms()
        toast.success('Platform added')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to add platform')
      }
    } catch {
      toast.error('Failed to add platform')
    }
  }

  const removePlatform = async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/settings/reputation/platforms/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchPlatforms()
        toast.success('Platform removed')
      } else {
        toast.error('Failed to remove platform')
      }
    } catch {
      toast.error('Failed to remove platform')
    }
  }

  // Pro gate — Core users see locked screen
  if (!isPro) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-navy mb-3">Reputation Management</h1>
          <p className="text-gray-600 mb-4">
            Automatically request reviews from happy customers to boost your Google rating and SEO.
          </p>
          <ul className="text-left text-sm text-gray-600 mb-6 space-y-2">
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Auto-send review requests after successful deals</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Support for Google, Facebook, Trustpilot & more</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Track review requests and responses</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Customizable messages and timing</li>
          </ul>
          <p className="text-gray-400 text-sm mb-6">
            This feature is available on :Impact Pro
          </p>
          <a
            href="mailto:dxims@mediampm.com?subject=Impact Pro - Reputation Management"
            className="btn-primary inline-flex items-center px-6 py-2.5"
          >
            Contact AM:PM to Upgrade
          </a>
        </div>
      </div>
    )
  }

  if (loading || !settings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Reputation Management</h1>
          <p className="text-gray-500 mt-1">Loading settings...</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="bg-white rounded-2xl h-24" />
          <div className="bg-white rounded-2xl h-48" />
          <div className="bg-white rounded-2xl h-36" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-navy">Reputation Management</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-400 to-red-500 text-white">
            Pro
          </span>
        </div>
        <p className="text-gray-500 mt-1">Automatically request reviews from customers to boost your ratings</p>
      </div>

      {/* Enable/Disable */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-navy">Auto Review Requests</h2>
            <p className="text-sm text-gray-500 mt-1">Send review requests when leads reach a certain stage</p>
          </div>
          <button
            type="button"
            onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enabled ? 'bg-impact' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Review Platforms */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-navy">Review Platforms</h2>
          <p className="text-sm text-gray-500 mt-1">Add your review page links</p>
        </div>
        <div className="space-y-3">
          {platforms.map((p) => {
            const platformInfo = PLATFORMS.find(x => x.id === p.platform)
            return (
              <div key={p.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl">
                <span className="text-2xl">{platformInfo?.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy">{platformInfo?.name || p.platform}</p>
                  <p className="text-sm text-gray-400 truncate">{p.review_url}</p>
                </div>
                <button
                  onClick={() => window.open(p.review_url, '_blank')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Open review page"
                >
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => removePlatform(p.id)}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                  title="Remove platform"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            )
          })}

          {platforms.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No review platforms configured yet</p>
          )}

          <AddPlatformForm
            existingPlatforms={platforms.map(p => p.platform)}
            onAdd={addPlatform}
          />
        </div>
      </div>

      {/* Trigger Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-navy">When to Send</h2>
          <p className="text-sm text-gray-500 mt-1">Configure when review requests are sent</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Trigger Stage</label>
            <div className="relative">
              <select
                value={settings.trigger_stage}
                onChange={(e) => setSettings({ ...settings, trigger_stage: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-navy appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-impact/20 focus:border-impact"
              >
                <option value="won">Lead Marked as Won</option>
                <option value="completed">Appointment Completed</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Delay After Trigger</label>
            <div className="relative">
              <select
                value={settings.delay_hours.toString()}
                onChange={(e) => setSettings({ ...settings, delay_hours: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-navy appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-impact/20 focus:border-impact"
              >
                <option value="0">Immediately</option>
                <option value="24">24 hours</option>
                <option value="48">48 hours (recommended)</option>
                <option value="72">72 hours</option>
                <option value="168">1 week</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Send Via</label>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            {(['email', 'whatsapp', 'sms'] as const).map((channel) => (
              <label key={channel} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.send_via.includes(channel)}
                  onChange={(e) => {
                    const newChannels = e.target.checked
                      ? [...settings.send_via, channel]
                      : settings.send_via.filter(c => c !== channel)
                    if (newChannels.length > 0) {
                      setSettings({ ...settings, send_via: newChannels })
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-impact focus:ring-impact/20"
                />
                <span className="text-sm text-navy capitalize">{channel === 'whatsapp' ? 'WhatsApp' : channel === 'sms' ? 'SMS' : 'Email'}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Message Templates */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-navy">Message Templates</h2>
          <p className="text-sm text-gray-500 mt-1">
            Customize your review request messages. Use <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{'{{name}}'}</code> and <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{'{{review_link}}'}</code>
          </p>
        </div>
        <div className="space-y-5">
          {settings.send_via.includes('email') && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Subject</label>
                <input
                  type="text"
                  value={settings.email_subject}
                  onChange={(e) => setSettings({ ...settings, email_subject: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact/20 focus:border-impact"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Message</label>
                <textarea
                  value={settings.email_message}
                  onChange={(e) => setSettings({ ...settings, email_message: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact/20 focus:border-impact resize-none"
                />
              </div>
            </div>
          )}

          {settings.send_via.includes('whatsapp') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp Message</label>
              <textarea
                value={settings.whatsapp_message}
                onChange={(e) => setSettings({ ...settings, whatsapp_message: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact/20 focus:border-impact resize-none"
              />
            </div>
          )}

          {settings.send_via.includes('sms') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">SMS Message</label>
              <textarea
                value={settings.sms_message}
                onChange={(e) => setSettings({ ...settings, sms_message: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact/20 focus:border-impact resize-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="btn-primary px-8 py-2.5 text-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

function AddPlatformForm({
  existingPlatforms,
  onAdd,
}: {
  existingPlatforms: string[]
  onAdd: (platformId: string, reviewUrl: string) => Promise<void>
}): JSX.Element | null {
  const [platform, setPlatform] = useState('')
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)

  const availablePlatforms = PLATFORMS.filter(p => !existingPlatforms.includes(p.id))

  if (availablePlatforms.length === 0) return null

  const handleAdd = async (): Promise<void> => {
    if (!platform || !url) return
    setAdding(true)
    try {
      await onAdd(platform, url)
      setPlatform('')
      setUrl('')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-100">
      <div className="relative sm:w-[180px]">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-navy appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-impact/20 focus:border-impact"
        >
          <option value="">Select platform</option>
          {availablePlatforms.map((p) => (
            <option key={p.id} value={p.id}>
              {p.icon} {p.name}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      <input
        type="url"
        placeholder={PLATFORMS.find(p => p.id === platform)?.placeholder || 'Review page URL'}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact/20 focus:border-impact"
      />

      <button
        onClick={handleAdd}
        disabled={!platform || !url || adding}
        className="btn-primary px-4 py-2.5 text-sm disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" />
        <span className="sm:hidden">Add Platform</span>
      </button>
    </div>
  )
}
