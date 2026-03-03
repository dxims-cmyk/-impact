'use client'

import { useState } from 'react'
import { Send, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  })

  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!formData.email && !formData.phone) {
      setError('Please provide an email or phone number.')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/webhooks/lead-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_slug: 'ampm-media',
          name: formData.name || undefined,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          company: formData.company || undefined,
          message: formData.message || undefined,
          source: 'driveimpact-demo',
          utm_source: 'driveimpact',
          utm_medium: 'website',
          utm_campaign: 'demo-request',
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Something went wrong. Please try again.')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0B1220] transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {submitted ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0B1220] mb-4">
              We&apos;ll be in touch
            </h1>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              Thanks for your interest. We&apos;ll reach out within 24 hours to schedule your demo.
            </p>
            <Link
              href="/"
              className="inline-flex items-center mt-8 px-6 py-3 rounded-full bg-[#0B1220] text-white text-sm font-medium hover:bg-[#132035] transition-colors"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B1220] mb-4">
                See <span className="text-[#E8642C]">:Impact</span> in Action
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-lg">
                Tell us about your business and we&apos;ll send you a personalised walkthrough within 5 minutes. No calendar. No waiting.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm mb-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#0B1220] mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8642C]/30 focus:border-[#E8642C] transition-all"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0B1220] mb-1.5">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8642C]/30 focus:border-[#E8642C] transition-all"
                    placeholder="Your Business"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#0B1220] mb-1.5">
                    Email <span className="text-gray-400 font-normal text-xs">(or phone below)</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8642C]/30 focus:border-[#E8642C] transition-all"
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0B1220] mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8642C]/30 focus:border-[#E8642C] transition-all"
                    placeholder="+44 7700 900123"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B1220] mb-1.5">
                  Tell us about your business
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8642C]/30 focus:border-[#E8642C] transition-all resize-none"
                  placeholder="What industry are you in? How many leads do you get per month? What's your biggest challenge with leads right now?"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#E8642C] text-white font-medium hover:bg-[#d55a25] transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Demo
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
