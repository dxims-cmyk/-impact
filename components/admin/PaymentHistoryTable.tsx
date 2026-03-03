'use client'

import { useState, useEffect } from 'react'
import { Receipt, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  currency: string
  payment_method: string
  period_start: string
  period_end: string
  reference: string | null
  notes: string | null
  recorded_by: string | null
  created_at: string
}

interface PaymentHistoryTableProps {
  orgId: string
}

const methodLabels: Record<string, string> = {
  stripe_recurring: 'Stripe',
  card_manual: 'Card',
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
}

export function PaymentHistoryTable({ orgId }: PaymentHistoryTableProps): JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (expanded && !loaded) {
      setLoading(true)
      fetch(`/api/admin/organizations/${orgId}/payments`)
        .then(res => res.json())
        .then(data => {
          setPayments(data || [])
          setLoaded(true)
        })
        .catch(() => setPayments([]))
        .finally(() => setLoading(false))
    }
  }, [expanded, loaded, orgId])

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-medium text-navy/50 hover:text-navy/70 transition-colors"
      >
        <Receipt className="w-3.5 h-3.5" />
        Payment History
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-2">
          {loading ? (
            <div className="flex items-center gap-2 py-3 text-xs text-navy/40">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading payments...
            </div>
          ) : payments.length === 0 ? (
            <p className="text-xs text-navy/40 py-2">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-navy/40 border-b border-gray-100">
                    <th className="text-left py-1.5 pr-3 font-medium">Date</th>
                    <th className="text-left py-1.5 pr-3 font-medium">Amount</th>
                    <th className="text-left py-1.5 pr-3 font-medium">Method</th>
                    <th className="text-left py-1.5 pr-3 font-medium">Period</th>
                    <th className="text-left py-1.5 font-medium">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="py-1.5 pr-3 text-navy/70">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-1.5 pr-3 text-navy font-medium">
                        {p.currency === 'GBP' ? '£' : p.currency === 'USD' ? '$' : '€'}
                        {p.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-1.5 pr-3 text-navy/60">
                        {methodLabels[p.payment_method] || p.payment_method}
                      </td>
                      <td className="py-1.5 pr-3 text-navy/60 whitespace-nowrap">
                        {new Date(p.period_start).toLocaleDateString()} – {new Date(p.period_end).toLocaleDateString()}
                      </td>
                      <td className="py-1.5 text-navy/50">
                        {p.reference || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
