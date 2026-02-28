'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Shield } from 'lucide-react'

function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!email) router.push('/login')
  }, [email, router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const newCode = [...code]
      digits.forEach((digit, i) => {
        if (index + i < 6) newCode[index + i] = digit
      })
      setCode(newCode)
      inputRefs.current[Math.min(index + digits.length, 5)]?.focus()
      return
    }
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const verify = async () => {
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      toast.error('Please enter the full 6-digit code')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode })
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Invalid code')
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        return
      }
      const storedPassword = sessionStorage.getItem('pendingLoginPassword')
      if (storedPassword) {
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithPassword({ email, password: storedPassword })
        sessionStorage.removeItem('pendingLoginPassword')
        if (error) {
          toast.error('Login failed')
          router.push('/login')
          return
        }
        toast.success('Verified successfully')
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    } catch {
      toast.error('Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const resendCode = async () => {
    setResending(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (res.ok) {
        toast.success('New code sent')
        setCountdown(60)
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        toast.error('Failed to resend code')
      }
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-gray-500">We sent a verification code to<br /><span className="font-medium text-gray-900">{email}</span></p>
          </div>
          <div className="flex justify-center gap-2 mb-8">
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold"
                autoFocus={index === 0}
              />
            ))}
          </div>
          <Button onClick={verify} className="w-full mb-4" size="lg" disabled={loading || code.join('').length !== 6}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : 'Verify & Sign In'}
          </Button>
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-2">Didn&apos;t receive the code?</p>
            <Button variant="ghost" onClick={resendCode} disabled={resending || countdown > 0}>
              {countdown > 0 ? `Resend in ${countdown}s` : resending ? 'Sending...' : 'Resend code'}
            </Button>
          </div>
        </div>
        <p className="text-center text-gray-400 text-sm mt-6">
          <button onClick={() => router.push('/login')} className="hover:text-gray-600">&larr; Back to login</button>
        </p>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyForm />
    </Suspense>
  )
}
