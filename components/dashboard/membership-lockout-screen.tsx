'use client'

import { useState } from 'react'
import { Pause, Ban, XCircle, LogOut, MessageCircle, CreditCard, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { MembershipStatus } from '@/types/database'

interface MembershipLockoutScreenProps {
  status: MembershipStatus
  paymentMethod?: string | null
}

const statusConfig: Record<string, { icon: typeof Pause; title: string; message: string; color: string }> = {
  paused: {
    icon: Pause,
    title: 'Membership Paused',
    message: 'Your membership has been temporarily paused. Contact AM:PM Media to resume your access.',
    color: 'from-amber-500 to-amber-600',
  },
  suspended: {
    icon: Ban,
    title: 'Membership Suspended',
    message: 'Your membership has been suspended. Please contact AM:PM Media to resolve this and restore access.',
    color: 'from-red-600 to-red-700',
  },
  cancelled: {
    icon: XCircle,
    title: 'Membership Cancelled',
    message: 'Your membership has been cancelled. Contact AM:PM Media to reactivate your account.',
    color: 'from-gray-600 to-gray-700',
  },
}

export function MembershipLockoutScreen({ status, paymentMethod }: MembershipLockoutScreenProps): JSX.Element {
  const supabase = createClient()
  const router = useRouter()
  const [billingLoading, setBillingLoading] = useState(false)

  const config = statusConfig[status] || statusConfig.suspended
  const Icon = config.icon

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
        toast.error(data.error || 'Unable to open billing portal')
        return
      }
      window.location.href = data.url
    } catch {
      toast.error('Unable to open billing portal')
    } finally {
      setBillingLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/95 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className={`bg-gradient-to-r ${config.color} p-8 text-white text-center`}>
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">{config.title}</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-sm text-navy/80">{config.message}</p>
          </div>

          <div className="space-y-3">
            <a
              href="https://wa.me/447386207524?text=Hi%2C%20I%20need%20help%20with%20my%20Impact%20membership"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-semibold hover:bg-[#20BD5A] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Contact AM:PM Media
            </a>

            {paymentMethod === 'stripe_recurring' && (
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
