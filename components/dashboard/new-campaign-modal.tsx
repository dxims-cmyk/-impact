'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface NewCampaignModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NewCampaignModal({ isOpen, onClose }: NewCampaignModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    platform: 'meta' as 'meta' | 'google' | 'tiktok',
    external_id: '',
    objective: '',
    budget_daily: '',
    budget_lifetime: '',
    status: 'active',
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Campaign name is required')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          platform: form.platform,
          external_id: form.external_id || `manual-${Date.now()}`,
          objective: form.objective || null,
          budget_daily: form.budget_daily ? parseFloat(form.budget_daily) : null,
          budget_lifetime: form.budget_lifetime ? parseFloat(form.budget_lifetime) : null,
          status: form.status,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create campaign')
      }

      toast.success('Campaign created')
      setForm({ name: '', platform: 'meta', external_id: '', objective: '', budget_daily: '', budget_lifetime: '', status: 'active' })
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create campaign')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-navy">New Campaign</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-navy/60" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Campaign Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Summer Sale 2026"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
            />
          </div>

          {/* Platform */}
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Platform</label>
            <select
              value={form.platform}
              onChange={(e) => setForm(f => ({ ...f, platform: e.target.value as 'meta' | 'google' | 'tiktok' }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact cursor-pointer"
            >
              <option value="meta">Meta Ads</option>
              <option value="google">Google Ads</option>
              <option value="tiktok">TikTok Ads</option>
            </select>
          </div>

          {/* External ID */}
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Campaign ID (from platform)</label>
            <input
              type="text"
              value={form.external_id}
              onChange={(e) => setForm(f => ({ ...f, external_id: e.target.value }))}
              placeholder="Optional - auto-generated if blank"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
            />
          </div>

          {/* Objective */}
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Objective</label>
            <input
              type="text"
              value={form.objective}
              onChange={(e) => setForm(f => ({ ...f, objective: e.target.value }))}
              placeholder="e.g. Lead Generation, Conversions"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
            />
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Daily Budget (£)</label>
              <input
                type="number"
                step="0.01"
                value={form.budget_daily}
                onChange={(e) => setForm(f => ({ ...f, budget_daily: e.target.value }))}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Lifetime Budget (£)</label>
              <input
                type="number"
                step="0.01"
                value={form.budget_lifetime}
                onChange={(e) => setForm(f => ({ ...f, budget_lifetime: e.target.value }))}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-navy hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-impact text-ivory text-sm font-semibold hover:bg-impact-light transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
