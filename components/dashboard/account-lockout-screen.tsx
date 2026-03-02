'use client'

import { useState } from 'react'
import { Lock, LogOut, CreditCard, MessageCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AccountLockoutScreenProps {
  reason?: string | null
}

export function AccountLockoutScreen({ reason }: AccountLockoutScreenProps): JSX.Element {
  const supabase = createClient()
  const router = useRouter()
  const [billingLoading, setBillingLoading] = useState(false)

  const handleSignOut = async (): Promise<void> => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleUpdatePayment = async (): Promise<void> => {
    setBillingLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Unable to open billing portal. Please contact support.')
        return
      }
      window.location.href = data.url
    } catch {
      toast.error('Unable to open billing portal. Please contact support.')
    } finally {
      setBillingLoading(false)
    }
  }

  // Check if this is a payment-related lockout
  const isPaymentRelated = reason?.toLowerCase().includes('payment') ||
    reason?.toLowerCase().includes('subscription')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/95 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-impact to-impact-light p-8 text-ivory text-center">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Account Suspended</h2>
          <p className="text-ivory/70 text-sm mt-2">
            Your account has been temporarily suspended.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Reason */}
          <div className="p-4 bg-impact/5 border border-impact/15 rounded-xl">
            <p className="text-sm text-navy/80">
              {reason || 'Please contact the Impact team to resolve this issue and restore access to your dashboard.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {isPaymentRelated && (
              <button
                onClick={handleUpdatePayment}
                disabled={billingLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-impact text-ivory font-semibold hover:bg-impact/90 transition-colors disabled:opacity-50"
              >
                {billingLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Update Payment Method
              </button>
            )}

            <a
              href="https://wa.me/64212345678?text=Hi%2C%20my%20Impact%20account%20has%20been%20suspended.%20Can%20you%20help%3F"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-semibold hover:bg-[#20BD5A] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Contact Impact Team
            </a>

            {!isPaymentRelated && (
              <button
                onClick={handleUpdatePayment}
                disabled={billingLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-impact text-impact font-semibold hover:bg-impact/5 transition-colors disabled:opacity-50"
              >
                {billingLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Manage Billing
              </button>
            )}
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-navy/50 hover:text-navy/70 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
