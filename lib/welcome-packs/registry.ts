import type { WelcomePack } from './types'
import { aaResinSteps } from './aa-resin-steps'

const packs: Record<string, WelcomePack> = {
  'aa-resin-steps': aaResinSteps,
}

export function getWelcomePack(slug: string): WelcomePack | null {
  return packs[slug] ?? null
}

export function getAllSlugs(): string[] {
  return Object.keys(packs)
}
