'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 2FA check - send OTP before completing login
    try {
      const otpRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const otpData = await otpRes.json()

      if (otpData.twoFactorRequired) {
        sessionStorage.setItem('pendingLoginPassword', password)
        router.push(`/verify?email=${encodeURIComponent(email)}`)
        return
      }
    } catch {
      // If OTP check fails, proceed with normal login
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(redirect)
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email')
      return
    }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setMagicLinkSent(true)
    }
    setLoading(false)
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-impact/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-impact" />
          </div>
          <h1 className="text-2xl font-bold text-ivory mb-2">Check your email</h1>
          <p className="text-ivory/70 mb-6">
            We sent a magic link to <strong className="text-ivory">{email}</strong>. Click the link to sign in.
          </p>
          <button
            onClick={() => setMagicLinkSent(false)}
            className="text-camel hover:text-camel/80 font-medium transition-colors"
          >
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4">
      <div className="max-w-md w-full">
        {/* Back to landing */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ivory/40 hover:text-ivory/70 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/ampm-logo.png" alt="AM:PM Media" className="w-14 h-14 rounded-xl mx-auto mb-4 shadow-lg object-cover" />
          <h1 className="text-2xl font-bold text-ivory">Sign in to <span className="text-impact">: Impact</span></h1>
          <p className="text-ivory/60 mt-2">Your growth marketing command center</p>
        </div>

        {/* Form */}
        <div className="bg-navy-light rounded-2xl border border-ivory/10 p-8">
          <form onSubmit={handleEmailLogin} className="space-y-5">
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ivory/80 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ivory/40" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-navy border border-ivory/20 text-ivory placeholder:text-ivory/40 focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent transition-all"
                  placeholder="••••••••"
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
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-ivory/10">
            <button
              onClick={handleMagicLink}
              disabled={loading}
              className="w-full py-3 px-6 rounded-full border-2 border-ivory/20 text-ivory font-semibold text-sm hover:border-ivory/40 hover:bg-ivory/5 transition-all duration-300"
            >
              Send magic link instead
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-3">
          <Link href="/forgot-password" className="text-sm text-ivory/50 hover:text-ivory/70 transition-colors block">
            Forgot your password?
          </Link>
          <div className="flex items-center justify-center gap-4 text-xs text-ivory/30">
            <Link href="/terms" className="hover:text-ivory/50 transition-colors">Terms of Service</Link>
            <span>&middot;</span>
            <Link href="/privacy" className="hover:text-ivory/50 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4">
      <div className="max-w-md w-full text-center">
        <img src="/ampm-logo.png" alt="AM:PM Media" className="w-14 h-14 rounded-xl mx-auto mb-4 shadow-lg object-cover animate-pulse" />
        <p className="text-ivory/60">Loading...</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  )
}
