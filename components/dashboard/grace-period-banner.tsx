'use client'

import { AlertTriangle, MessageCircle, CreditCard, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface GracePeriodBannerProps {
  daysLeft: number | null
  paymentMethod: string | null
}

export function GracePeriodBanner({ daysLeft, paymentMethod }: GracePeriodBannerProps): JSX.Element {
  const [billingLoading, setBillingLoading] = useState(false)

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

  const daysText = daysLeft !== null && daysLeft > 0
    ? `You have ${daysLeft} day${daysLeft === 1 ? '' : 's'} before your account is locked.`
    : 'Your account may be locked soon.'

  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-red-800">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>
          <strong>Payment Overdue</strong> — {daysText}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <a
          href="https://wa.me/447386207524?text=Hi%2C%20I%20need%20help%20with%20my%20Impact%20membership%20payment"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#25D366] text-white text-xs font-semibold hover:bg-[#20BD5A] transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Contact
        </a>
        {paymentMethod === 'stripe_recurring' && (
          <button
            onClick={handleUpdatePayment}
            disabled={billingLoading}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {billingLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CreditCard className="w-3.5 h-3.5" />
            )}
            Update Payment
          </button>
        )}
      </div>
    </div>
  )
}
