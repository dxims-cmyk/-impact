// lib/hooks/use-plan.ts
import { useOrganization } from './use-organization'

const PRO_FEATURES = [
  'content_gallery',
  'ad_analysis',
  'reports_advanced',
  'strategy_calls',
  'priority_support',
  'reputation_management',
]

export function usePlan(): {
  plan: string
  isPro: boolean
  isCore: boolean
  hasFeature: (feature: string) => boolean
  planName: string
  planPrice: number
} {
  const { data: organization } = useOrganization()

  const plan = organization?.plan || 'core'
  const isPro = plan === 'pro'
  const isCore = plan === 'core'

  const hasFeature = (feature: string): boolean => {
    if (PRO_FEATURES.includes(feature)) {
      return isPro
    }
    return true
  }

  return {
    plan,
    isPro,
    isCore,
    hasFeature,
    planName: isPro ? ':Impact Pro' : ':Impact Core',
    planPrice: isPro ? 2500 : 1500,
  }
}
