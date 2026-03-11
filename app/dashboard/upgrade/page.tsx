'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Lock, Check, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePlan, PLAN_NAMES, PLAN_PRICES, PLAN_LEVELS, TIER_FEATURES, type PlanType } from '@/lib/hooks/use-plan'

function TierCard({
  tier,
  currentPlan,
  requiredTier,
}: {
  tier: PlanType
  currentPlan: PlanType
  requiredTier: PlanType | null
}): React.JSX.Element {
  const isCurrent = tier === currentPlan
  const isRequired = tier === requiredTier
  const tierLevel = PLAN_LEVELS[tier]
  const currentLevel = PLAN_LEVELS[currentPlan]
  const isUpgrade = tierLevel > currentLevel
  const features = TIER_FEATURES[tier]

  return (
    <div className={cn(
      'rounded-xl border-2 p-6 transition-all relative',
      isRequired ? 'border-impact shadow-lg shadow-impact/10 ring-1 ring-impact/20' :
      isCurrent ? 'border-studio/40 bg-studio/5' :
      'border-navy/10 bg-white'
    )}>
      {isRequired && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-impact text-ivory text-xs font-semibold rounded-full">
          Recommended
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-studio text-ivory text-xs font-semibold rounded-full">
          Current Plan
        </div>
      )}

      <div className="text-center mb-4">
        <h3 className={cn(
          'text-xl font-bold',
          tier === 'pro' ? 'bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent' :
          tier === 'growth' ? 'text-studio' :
          'text-navy'
        )}>
          {PLAN_NAMES[tier]}
        </h3>
        <p className="text-3xl font-bold text-navy mt-2">
          £{PLAN_PRICES[tier].toLocaleString()}
          <span className="text-sm font-normal text-navy/50">/mo</span>
        </p>
      </div>

      <ul className="space-y-2 mb-6">
        {features.map(feature => (
          <li key={feature} className="flex items-center gap-2 text-sm text-navy/70">
            <Check className="w-4 h-4 text-studio flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <div className="w-full text-center py-2.5 rounded-lg bg-studio/10 text-studio text-sm font-semibold">
          Your Current Plan
        </div>
      ) : isUpgrade ? (
        <a
          href="mailto:hello@mediampm.com?subject=Upgrade%20to%20Impact%20${PLAN_NAMES[tier]}"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-impact text-ivory text-sm font-semibold hover:bg-impact/90 transition-colors"
        >
          Upgrade to {PLAN_NAMES[tier]}
          <ArrowRight className="w-4 h-4" />
        </a>
      ) : (
        <div className="w-full text-center py-2.5 rounded-lg bg-navy/5 text-navy/30 text-sm font-medium">
          Included in your plan
        </div>
      )}
    </div>
  )
}

function UpgradeContent(): React.JSX.Element {
  const searchParams = useSearchParams()
  const { plan } = usePlan()
  const requiredFeature = searchParams.get('feature')
  const requiredPlan = searchParams.get('plan') as PlanType | null

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-impact/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-impact" />
        </div>
        <h1 className="text-2xl font-bold text-navy">
          {requiredFeature
            ? `${requiredFeature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} requires an upgrade`
            : 'Upgrade Your Plan'
          }
        </h1>
        <p className="text-navy/60 mt-2">
          {requiredPlan
            ? `This feature requires the ${PLAN_NAMES[requiredPlan]} plan or higher.`
            : 'Unlock more features by upgrading your plan.'
          }
          {' '}Contact AM:PM Media to upgrade.
        </p>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TierCard tier="core" currentPlan={plan} requiredTier={requiredPlan} />
        <TierCard tier="growth" currentPlan={plan} requiredTier={requiredPlan} />
        <TierCard tier="pro" currentPlan={plan} requiredTier={requiredPlan} />
      </div>

      {/* Contact CTA */}
      <div className="text-center p-6 rounded-xl bg-navy/5 border border-navy/10">
        <p className="text-sm text-navy/60 mb-3">
          Ready to upgrade? Get in touch with your account manager.
        </p>
        <a
          href="https://wa.me/447386297524?text=Hi%2C%20I%27d%20like%20to%20upgrade%20my%20Impact%20plan"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-studio text-ivory rounded-lg text-sm font-semibold hover:bg-studio/90 transition-colors"
        >
          WhatsApp AM:PM Media
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}

export default function UpgradePage(): React.JSX.Element {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-navy/30" />
        </div>
      }>
        <UpgradeContent />
      </Suspense>
    </div>
  )
}
