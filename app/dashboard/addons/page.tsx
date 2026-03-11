'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Puzzle, Check, Zap, Loader2, X, Phone, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ADDONS, type AddonKey, isIncludedInPlan, canPurchaseAddon } from '@/lib/addons'
import { useAccountAddons, usePurchaseAddon, useCancelAddon } from '@/lib/hooks/use-addons'
import { usePlan, PLAN_NAMES } from '@/lib/hooks/use-plan'
import { useUser } from '@/lib/hooks/use-user'
import { toast } from 'sonner'

const ADDON_ICONS: Record<AddonKey, typeof Phone> = {
  ai_receptionist: Phone,
  outbound_leads: Target,
}

function AddonCard({
  addonKey,
  plan,
  isActive,
  isIncluded,
  canBuy,
  highlighted,
  onPurchase,
  onCancel,
  purchaseLoading,
  cancelLoading,
}: {
  addonKey: AddonKey
  plan: string
  isActive: boolean
  isIncluded: boolean
  canBuy: boolean
  highlighted: boolean
  onPurchase: (key: AddonKey) => void
  onCancel: (key: AddonKey) => void
  purchaseLoading: boolean
  cancelLoading: boolean
}): React.JSX.Element {
  const config = ADDONS[addonKey]
  const Icon = ADDON_ICONS[addonKey]

  return (
    <div className={cn(
      'rounded-xl border-2 p-6 transition-all',
      highlighted && !isIncluded && !isActive ? 'border-impact shadow-lg shadow-impact/10 ring-1 ring-impact/20' :
      isIncluded ? 'border-studio/30 bg-studio/5' :
      isActive ? 'border-camel/30 bg-camel/5' :
      'border-navy/10 bg-white hover:border-navy/20 hover:shadow-sm'
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            isIncluded ? 'bg-studio/10' :
            isActive ? 'bg-camel/10' :
            'bg-navy/5'
          )}>
            <Icon className={cn(
              'w-6 h-6',
              isIncluded ? 'text-studio' :
              isActive ? 'text-camel' :
              'text-navy/40'
            )} />
          </div>
          <div>
            <h3 className="font-bold text-navy text-lg">{config.label}</h3>
            <p className="text-sm text-navy/50 font-medium">
              {isIncluded ? (
                <span className="text-studio">Included in {PLAN_NAMES[plan as 'core' | 'growth' | 'pro']}</span>
              ) : (
                `£${config.price}/mo`
              )}
            </p>
          </div>
        </div>

        {isIncluded && (
          <span className="flex items-center gap-1 text-xs font-semibold text-studio bg-studio/10 px-2.5 py-1 rounded-full">
            <Check className="w-3 h-3" /> Included
          </span>
        )}
        {isActive && !isIncluded && (
          <span className="flex items-center gap-1 text-xs font-semibold text-camel bg-camel/10 px-2.5 py-1 rounded-full">
            <Zap className="w-3 h-3" /> Active
          </span>
        )}
      </div>

      <p className="text-sm text-navy/60 mb-6">{config.description}</p>

      {isIncluded ? (
        <div className="text-sm text-studio/70 font-medium py-2">
          This feature comes with your {PLAN_NAMES[plan as 'core' | 'growth' | 'pro']} plan
        </div>
      ) : isActive ? (
        <button
          onClick={() => onCancel(addonKey)}
          disabled={cancelLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          Cancel Add-on
        </button>
      ) : canBuy ? (
        <button
          onClick={() => onPurchase(addonKey)}
          disabled={purchaseLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-impact text-ivory hover:bg-impact/90 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {purchaseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Unlock for £{config.price}/mo
        </button>
      ) : (
        <div className="text-sm text-navy/40 font-medium py-2 text-center">
          Included in higher tiers — <a href="/dashboard/upgrade" className="underline hover:text-navy/60">upgrade plan</a>
        </div>
      )}
    </div>
  )
}

function AddonsContent(): React.JSX.Element {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { plan } = usePlan()
  const { data: addons, isLoading } = useAccountAddons()
  const purchase = usePurchaseAddon()
  const cancel = useCancelAddon()
  const highlighted = searchParams.get('highlight') as AddonKey | null

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      const addon = searchParams.get('addon')
      toast.success(`${addon ? addon.replace(/_/g, ' ') : 'Add-on'} activated!`)
      queryClient.invalidateQueries({ queryKey: ['addons'] })
    }
    if (searchParams.get('cancelled') === 'true') {
      toast.info('Checkout cancelled')
    }
  }, [searchParams, queryClient])

  const handlePurchase = async (key: AddonKey): Promise<void> => {
    try {
      const result = await purchase.mutateAsync(key)
      if (result.url) {
        window.location.href = result.url
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start checkout')
    }
  }

  const handleCancel = async (key: AddonKey): Promise<void> => {
    if (!confirm('Are you sure you want to cancel this add-on? Access will be revoked immediately.')) return
    try {
      await cancel.mutateAsync(key)
      toast.success('Add-on cancelled')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-navy/30" />
      </div>
    )
  }

  const addonKeys: AddonKey[] = ['ai_receptionist', 'outbound_leads']

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-navy">Add-ons</h1>
        <p className="text-navy/60 mt-1">
          Unlock premium features for your {PLAN_NAMES[plan]} plan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addonKeys.map(key => {
          const included = isIncludedInPlan(plan, key)
          const active = addons?.some(a => a.addon_key === key && a.status === 'active') ?? false
          const canBuy = canPurchaseAddon(plan, key)

          return (
            <AddonCard
              key={key}
              addonKey={key}
              plan={plan}
              isActive={active}
              isIncluded={included}
              canBuy={canBuy}
              highlighted={highlighted === key}
              onPurchase={handlePurchase}
              onCancel={handleCancel}
              purchaseLoading={purchase.isPending && purchase.variables === key}
              cancelLoading={cancel.isPending && cancel.variables === key}
            />
          )
        })}
      </div>

      <p className="text-xs text-navy/40 text-center">
        Add-ons are billed monthly and can be cancelled at any time. Contact{' '}
        <a href="mailto:hello@mediampm.com" className="underline hover:text-navy/60">hello@mediampm.com</a> for questions.
      </p>
    </div>
  )
}

export default function AddonsPage(): React.JSX.Element {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-navy/30" />
        </div>
      }>
        <AddonsContent />
      </Suspense>
    </div>
  )
}
