'use client'

import { Lock } from 'lucide-react'
import { usePlan, PLAN_NAMES } from '@/lib/hooks/use-plan'

interface FeatureGateProps {
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps): JSX.Element {
  const { hasFeature, getMinPlanForFeature } = usePlan()

  if (hasFeature(feature)) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  const requiredPlan = getMinPlanForFeature(feature)
  const requiredPlanName = PLAN_NAMES[requiredPlan]

  return (
    <div className="relative">
      {/* Blurred content preview */}
      <div className="blur-sm pointer-events-none opacity-50 select-none">
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px] rounded-lg">
        <div className="bg-white p-6 rounded-xl shadow-xl text-center max-w-sm border">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">{requiredPlanName} Feature</h3>
          <p className="text-gray-600 text-sm mb-4">
            This feature is available on :Impact {requiredPlanName}
          </p>
          <p className="text-gray-400 text-xs mb-4">
            Contact AM:PM Media to upgrade your plan
          </p>
          <a
            href={`mailto:dxims@mediampm.com?subject=Impact ${requiredPlanName} Upgrade Inquiry`}
            className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-navy hover:bg-gray-50 transition-colors"
          >
            Contact AM:PM
          </a>
        </div>
      </div>
    </div>
  )
}
