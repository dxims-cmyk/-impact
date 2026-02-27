'use client'

import { useState } from 'react'
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  Globe,
  MapPin,
  Tag,
  Sparkles,
  Loader2,
  Send,
} from 'lucide-react'

interface NewLeadModalProps {
  isOpen: boolean
  onClose: () => void
}

const sources = [
  'Meta Ads',
  'Google Ads',
  'TikTok Ads',
  'Organic',
  'Referral',
  'ManyChat',
  'Website Form',
  'Manual Entry',
]

const stages = [
  { value: 'new', label: 'New' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'booked', label: 'Booked' },
]

export function NewLeadModal({ isOpen, onClose }: NewLeadModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    website: '',
    location: '',
    source: 'Manual Entry',
    stage: 'new',
    notes: '',
    autoQualify: true,
    sendWelcome: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          company: formData.company || undefined,
          job_title: formData.jobTitle || undefined,
          website: formData.website || undefined,
          stage: formData.stage || 'new',
          notes: formData.notes || undefined,
          source: formData.source,
          send_welcome: formData.sendWelcome,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create lead')
      }

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        jobTitle: '',
        website: '',
        location: '',
        source: 'Manual Entry',
        stage: 'new',
        notes: '',
        autoQualify: true,
        sendWelcome: false,
      })

      onClose()
    } catch (err) {
      console.error('Failed to create lead:', err)
      setError(err instanceof Error ? err.message : 'Failed to create lead')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-full max-w-2xl max-h-[90vh] overflow-auto mx-auto px-4 sm:px-0">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-navy">Add New Lead</h2>
              <p className="text-sm text-navy/50">Enter the lead's information</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  First Name <span className="text-impact">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                    placeholder="John"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Last Name <span className="text-impact">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                  placeholder="Smith"
                />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Email <span className="text-impact">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                    placeholder="john@company.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                    placeholder="+44 7700 900123"
                  />
                </div>
              </div>
            </div>

            {/* Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Company
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                    placeholder="Acme Inc"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Job Title
                </label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                  placeholder="Marketing Manager"
                />
              </div>
            </div>

            {/* Source & Stage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Source
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                >
                  {sources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Stage
                </label>
                <select
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                >
                  {stages.map(stage => (
                    <option key={stage.value} value={stage.value}>{stage.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent resize-none"
                placeholder="Any additional notes about this lead..."
              />
            </div>

            {/* AI Qualify Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-impact/5 border border-impact/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-impact flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-ivory" />
                </div>
                <div>
                  <p className="font-medium text-navy">AI Auto-Qualify</p>
                  <p className="text-sm text-navy/50">Automatically score and tag this lead</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, autoQualify: !formData.autoQualify })}
                className={`w-12 h-7 rounded-full transition-colors ${
                  formData.autoQualify ? 'bg-impact' : 'bg-gray-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  formData.autoQualify ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Send Welcome Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-navy/5 border border-navy/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
                  <Send className="w-5 h-5 text-ivory" />
                </div>
                <div>
                  <p className="font-medium text-navy">Send Welcome Email</p>
                  <p className="text-sm text-navy/50">Auto-contact the lead with an intro email</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, sendWelcome: !formData.sendWelcome })}
                className={`w-12 h-7 rounded-full transition-colors ${
                  formData.sendWelcome ? 'bg-impact' : 'bg-gray-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  formData.sendWelcome ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
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
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Lead'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
