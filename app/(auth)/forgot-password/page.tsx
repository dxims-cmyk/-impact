'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-studio/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-studio" />
          </div>
          <h1 className="text-2xl font-bold text-ivory mb-2">Check your email</h1>
          <p className="text-ivory/70 mb-6">
            We sent a password reset link to <strong className="text-ivory">{email}</strong>.
            Click the link to reset your password.
          </p>
          <Link
            href="/login"
            className="text-camel hover:text-camel/80 font-medium transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-impact rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Zap className="w-8 h-8 text-ivory" />
          </div>
          <h1 className="text-2xl font-bold text-ivory">Reset your password</h1>
          <p className="text-ivory/60 mt-2">Enter your email and we'll send you a reset link</p>
        </div>

        {/* Form */}
        <div className="bg-navy-light rounded-2xl border border-ivory/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-impact/10 border border-impact/30 rounded-lg text-sm text-impact">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ivory/80 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ivory/40" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-navy border border-ivory/20 text-ivory placeholder:text-ivory/40 focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent transition-all"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="spinner" />
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-ivory/50 mt-6">
          <Link href="/login" className="text-camel hover:text-camel/80 font-medium transition-colors inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
