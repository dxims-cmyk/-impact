'use client'

import { useState } from 'react'
import { X, Loader2, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

interface RecordPaymentModalProps {
  orgId: string
  orgName: string
  plan: string
  onClose: () => void
  onSuccess: () => void
}

export function RecordPaymentModal({ orgId, orgName, plan, onClose, onSuccess }: RecordPaymentModalProps): JSX.Element {
  const defaultAmount = plan === 'pro' ? 2500 : 1500
  const [amount, setAmount] = useState(defaultAmount.toString())
  const [paymentMethod, setPaymentMethod] = useState<'card_manual' | 'cash' | 'bank_transfer'>('card_manual')
  const [periodStart, setPeriodStart] = useState(new Date().toISOString().split('T')[0])
  const [periodEnd, setPeriodEnd] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency: 'GBP',
          payment_method: paymentMethod,
          period_start: periodStart,
          period_end: periodEnd,
          reference: reference || undefined,
          notes: notes || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to record payment')
      }

      toast.success('Payment recorded — membership activated')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-studio to-studio-light p-6 text-ivory">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Record Payment
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-ivory/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-ivory/70 text-sm mt-1">
            Recording payment for <strong>{orgName}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-navy/80 mb-1.5">Amount (GBP)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-navy focus:outline-none focus:ring-2 focus:ring-studio/30 focus:border-studio"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-navy/80 mb-1.5">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-navy focus:outline-none focus:ring-2 focus:ring-studio/30 focus:border-studio"
            >
              <option value="card_manual">Card (manual)</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-navy/80 mb-1.5">Period Start</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-navy focus:outline-none focus:ring-2 focus:ring-studio/30 focus:border-studio"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy/80 mb-1.5">Period End</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-navy focus:outline-none focus:ring-2 focus:ring-studio/30 focus:border-studio"
                required
              />
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-navy/80 mb-1.5">Reference (optional)</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-navy focus:outline-none focus:ring-2 focus:ring-studio/30 focus:border-studio"
              placeholder="Invoice number, bank ref..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-navy/80 mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-navy focus:outline-none focus:ring-2 focus:ring-studio/30 focus:border-studio resize-none"
              rows={2}
              placeholder="e.g., Taken payment on call"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-navy/60 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg bg-studio text-ivory text-sm font-semibold hover:bg-studio/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Record Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
