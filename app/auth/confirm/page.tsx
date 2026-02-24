'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function AuthConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Supabase client auto-detects tokens in the URL hash/query
    // and exchanges them for a session
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard')
      } else if (event === 'TOKEN_REFRESHED') {
        router.push('/dashboard')
      }
    })

    // Fallback: if already signed in, redirect
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard')
      }
    })

    // Timeout fallback
    const timeout = setTimeout(() => {
      router.push('/login?error=auth_timeout')
    }, 10000)

    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-impact animate-spin mx-auto mb-4" />
        <p className="text-ivory/70">Signing you in...</p>
      </div>
    </div>
  )
}
