// lib/addons.ts
// Simplified addon system — 2 purchasable addons only

export const ADDONS = {
  ai_receptionist: {
    key: 'ai_receptionist' as const,
    label: 'AI Receptionist',
    description: '24/7 AI call handling, auto-qualification, and calendar booking',
    price: 400,
    priceEnvKey: 'ADDON_PRICE_AI_RECEPTIONIST',
    availableTo: ['core'], // Only Core can purchase (Growth/Pro have it included)
  },
  outbound_leads: {
    key: 'outbound_leads' as const,
    label: 'Outbound Leads',
    description: 'Generate lead lists by industry and location using Apify',
    price: 300,
    priceEnvKey: 'ADDON_PRICE_OUTBOUND',
    availableTo: ['core', 'growth'], // Core and Growth can purchase (Pro has it included)
  },
} as const

export type AddonKey = keyof typeof ADDONS

export function canPurchaseAddon(plan: string, addonKey: AddonKey): boolean {
  const addon = ADDONS[addonKey]
  return (addon.availableTo as readonly string[]).includes(plan)
}

export function isIncludedInPlan(plan: string, addonKey: AddonKey): boolean {
  if (addonKey === 'ai_receptionist') {
    return plan === 'growth' || plan === 'pro'
  }
  if (addonKey === 'outbound_leads') {
    return plan === 'pro'
  }
  return false
}

export function getAddonPriceId(addonKey: AddonKey): string {
  const addon = ADDONS[addonKey]
  const priceId = process.env[addon.priceEnvKey]
  if (!priceId) throw new Error(`${addon.priceEnvKey} is not set`)
  return priceId
}
