// lib/hooks/use-plan.ts
import { useOrganization } from './use-organization'

export type PlanType = 'core' | 'growth' | 'pro'

export const PLAN_LEVELS: Record<PlanType, number> = {
  core: 1,
  growth: 2,
  pro: 3,
} as const

export const FEATURE_MIN_PLAN = {
  // Core features (available to all)
  // meta_lead_ads, lead_dashboard, whatsapp_routing, analytics — no gate needed

  // Growth+ features
  vapi_receptionist: 'growth',
  calls_page: 'growth',
  call_recordings: 'growth',
  advanced_automations: 'growth',

  // Pro only features
  outbound_leads: 'pro',
  content_gallery: 'pro',
  reputation_management: 'pro',
  content_creation: 'pro',
  ad_analysis: 'pro',
  reports_advanced: 'pro',
  strategy_calls: 'pro',
  priority_support: 'pro',
} as const

// What each tier includes (for display on upgrade page)
export const TIER_FEATURES: Record<PlanType, string[]> = {
  core: [
    'Meta Lead Ads',
    'Lead Dashboard',
    'WhatsApp Routing',
    'Analytics',
  ],
  growth: [
    'Everything in Core',
    'AI Receptionist',
  ],
  pro: [
    'Everything in Growth',
    'Gallery & Ad Creative',
    'Outbound Leads',
  ],
}

export type FeatureName = keyof typeof FEATURE_MIN_PLAN

export const PLAN_PRICES: Record<PlanType, number> = {
  core: 1500,
  growth: 2000,
  pro: 2500,
}

export const PLAN_NAMES: Record<PlanType, string> = {
  core: 'Core',
  growth: 'Growth',
  pro: 'Pro',
}

export function usePlan(): {
  plan: PlanType
  planLevel: number
  isCore: boolean
  isGrowth: boolean
  isPro: boolean
  isGrowthOrHigher: boolean
  isProOrHigher: boolean
  hasFeature: (feature: string) => boolean
  getMinPlanForFeature: (feature: string) => PlanType
  planName: string
  planPrice: number
} {
  const { data: organization } = useOrganization()

  const plan = (organization?.plan as PlanType) || 'core'
  const planLevel = PLAN_LEVELS[plan] || 1

  const isCore = plan === 'core'
  const isGrowth = plan === 'growth'
  const isPro = plan === 'pro'
  const isGrowthOrHigher = planLevel >= PLAN_LEVELS.growth
  const isProOrHigher = planLevel >= PLAN_LEVELS.pro

  const hasFeature = (feature: string): boolean => {
    const minPlan = FEATURE_MIN_PLAN[feature as FeatureName]
    if (!minPlan) return true // Not gated = available to all
    return planLevel >= PLAN_LEVELS[minPlan]
  }

  const getMinPlanForFeature = (feature: string): PlanType => {
    return (FEATURE_MIN_PLAN[feature as FeatureName] as PlanType) || 'core'
  }

  return {
    plan,
    planLevel,
    isCore,
    isGrowth,
    isPro,
    isGrowthOrHigher,
    isProOrHigher,
    hasFeature,
    getMinPlanForFeature,
    planName: PLAN_NAMES[plan],
    planPrice: PLAN_PRICES[plan],
  }
}
