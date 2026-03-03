'use client'

import { useState, useRef, useEffect } from 'react'
import {
  ChevronDown,
  Play,
  Pause,
  Ban,
  XCircle,
  Calendar,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface MembershipActionsProps {
  orgId: string
  currentStatus: string
  onSuccess: () => void
}

const actions = [
  { id: 'activate', label: 'Activate', icon: Play, color: 'text-green-600' },
  { id: 'pause', label: 'Pause', icon: Pause, color: 'text-amber-600' },
  { id: 'resume', label: 'Resume', icon: Play, color: 'text-blue-600' },
  { id: 'extend', label: 'Extend', icon: Calendar, color: 'text-indigo-600' },
  { id: 'suspend', label: 'Suspend', icon: Ban, color: 'text-red-600' },
  { id: 'cancel', label: 'Cancel', icon: XCircle, color: 'text-gray-600' },
] as const

export function MembershipActions({ orgId, currentStatus, onSuccess }: MembershipActionsProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [extendDate, setExtendDate] = useState('')
  const [showExtendInput, setShowExtendInput] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowExtendInput(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter actions based on current status
  const availableActions = actions.filter(a => {
    if (currentStatus === 'preview') return a.id === 'activate'
    if (currentStatus === 'active') return ['pause', 'suspend', 'cancel', 'extend'].includes(a.id)
    if (currentStatus === 'past_due') return ['extend', 'suspend', 'cancel'].includes(a.id)
    if (currentStatus === 'paused') return ['resume', 'cancel'].includes(a.id)
    if (currentStatus === 'suspended') return ['activate', 'cancel'].includes(a.id)
    if (currentStatus === 'cancelled') return a.id === 'activate'
    return false
  })

  const handleAction = async (actionId: string): Promise<void> => {
    if (actionId === 'extend') {
      setShowExtendInput(true)
      return
    }

    if (['suspend', 'cancel'].includes(actionId)) {
      if (!confirm(`Are you sure you want to ${actionId} this membership?`)) return
    }

    setLoading(true)
    try {
      const body: Record<string, unknown> = { action: actionId }

      if (actionId === 'activate') {
        // Default to 30 days from now
        const d = new Date()
        d.setDate(d.getDate() + 30)
        body.paid_until = d.toISOString()
      }

      const res = await fetch(`/api/admin/organizations/${orgId}/membership`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Action failed')
      }

      toast.success(`Membership ${actionId}d successfully`)
      onSuccess()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  const handleExtend = async (): Promise<void> => {
    if (!extendDate) {
      toast.error('Please select a date')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/membership`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'extend', paid_until: extendDate }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Extend failed')
      }

      toast.success('Membership extended')
      onSuccess()
      setOpen(false)
      setShowExtendInput(false)
      setExtendDate('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Extend failed')
    } finally {
      setLoading(false)
    }
  }

  if (availableActions.length === 0) return <></>

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="text-xs px-2.5 py-0.5 rounded-full font-medium border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-1"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
        Membership
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-30 min-w-[180px]">
          {showExtendInput ? (
            <div className="p-3 space-y-2">
              <label className="block text-xs font-medium text-navy/70">Extend until:</label>
              <input
                type="date"
                value={extendDate}
                onChange={(e) => setExtendDate(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowExtendInput(false); setExtendDate('') }}
                  className="flex-1 text-xs py-1 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExtend}
                  disabled={loading}
                  className="flex-1 text-xs py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Extending...' : 'Extend'}
                </button>
              </div>
            </div>
          ) : (
            availableActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left"
                >
                  <Icon className={`w-3.5 h-3.5 ${action.color}`} />
                  <span className="text-navy">{action.label}</span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
