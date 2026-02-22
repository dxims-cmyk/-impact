'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap, Mail, Lock, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Check if user was created or already exists
    if (data.user?.identities?.length === 0) {
      setError('An account with this email already exists')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-studio/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-studio" />
          </div>
          <h1 className="text-2xl font-bold text-ivory mb-2">Check your email</h1>
          <p className="text-ivory/70 mb-6">
            We sent a confirmation link to <strong className="text-ivory">{email}</strong>.
            Click the link to activate your account.
          </p>
          <Link
            href="/login"
            className="text-camel hover:text-camel/80 font-medium transition-colors"
          >
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
          <h1 className="text-2xl font-bold text-ivory">Create your account</h1>
          <p className="text-ivory/60 mt-2">Start managing your leads with <span className="text-impact font-semibold">: Impact</span></p>
        </div>

        {/* Form */}
        <div className="bg-navy-light rounded-2xl border border-ivory/10 p-8">
          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="p-3 bg-impact/10 border border-impact/30 rounded-lg text-sm text-impact">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-ivory/80 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ivory/40" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-navy border border-ivory/20 text-ivory placeholder:text-ivory/40 focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent transition-all"
                  placeholder="John Smith"
                  required
                />
              </div>
            </div>

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
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-ivory/80 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ivory/40" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-navy border border-ivory/20 text-ivory placeholder:text-ivory/40 focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
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
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-ivory/50 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-camel hover:text-camel/80 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
