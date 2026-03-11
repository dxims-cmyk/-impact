'use client'

import { useState, useEffect } from 'react'
import { Puzzle, Plus, X, Loader2 } from 'lucide-react'
import { ADDONS, type AddonKey, isIncludedInPlan } from '@/lib/addons'
import { toast } from 'sonner'

interface ActiveAddon {
  id: string
  addon_key: AddonKey
  status: string
  granted_by: string | null
  stripe_subscription_id: string | null
}

export function AdminAddons({ orgId, orgPlan }: { orgId: string; orgPlan: string }): React.JSX.Element {
  const [addons, setAddons] = useState<ActiveAddon[]>([])
  const [loading, setLoading] = useState(true)
  const [granting, setGranting] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)

  const fetchAddons = async (): Promise<void> => {
    try {
      const res = await fetch(`/api/addons?orgId=${orgId}`)
      if (res.ok) setAddons(await res.json())
    } catch { /* silent */ } finally { setLoading(false) }
  }

  useEffect(() => { fetchAddons() }, [orgId])

  const handleGrant = async (key: AddonKey): Promise<void> => {
    setGranting(key)
    try {
      const res = await fetch('/api/admin/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId, addonKey: key }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(`Granted ${ADDONS[key].label}`)
      fetchAddons()
    } catch { toast.error('Failed to grant addon') } finally { setGranting(null) }
  }

  const handleRevoke = async (key: AddonKey): Promise<void> => {
    setRevoking(key)
    try {
      const res = await fetch('/api/admin/addons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId, addonKey: key }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(`Revoked ${ADDONS[key].label}`)
      fetchAddons()
    } catch { toast.error('Failed to revoke addon') } finally { setRevoking(null) }
  }

  if (loading) return <div className="text-xs text-gray-400">Loading addons...</div>

  const addonKeys: AddonKey[] = ['ai_receptionist', 'outbound_leads']

  return (
    <div className="mt-2 space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1">
        <Puzzle className="w-3 h-3" /> Add-ons
      </p>
      <div className="flex flex-wrap gap-1.5">
        {addonKeys.map(key => {
          const included = isIncludedInPlan(orgPlan, key)
          const active = addons.find(a => a.addon_key === key && a.status === 'active')

          if (included) {
            return (
              <span key={key} className="text-[10px] px-2 py-0.5 rounded-full bg-studio/10 text-studio font-medium">
                {ADDONS[key].label} (included)
              </span>
            )
          }

          if (active) {
            return (
              <button
                key={key}
                onClick={() => handleRevoke(key)}
                disabled={revoking === key}
                className="text-[10px] px-2 py-0.5 rounded-full bg-camel/10 text-camel font-medium hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-1 disabled:opacity-50"
                title="Click to revoke"
              >
                {revoking === key ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <X className="w-2.5 h-2.5" />}
                {ADDONS[key].label}
                {active.granted_by ? ' (manual)' : ' (Stripe)'}
              </button>
            )
          }

          return (
            <button
              key={key}
              onClick={() => handleGrant(key)}
              disabled={granting === key}
              className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-studio hover:text-studio transition-colors flex items-center gap-1 disabled:opacity-50"
              title={`Grant ${ADDONS[key].label}`}
            >
              {granting === key ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Plus className="w-2.5 h-2.5" />}
              {ADDONS[key].label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
