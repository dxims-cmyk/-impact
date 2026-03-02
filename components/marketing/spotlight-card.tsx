'use client'

import { Spotlight } from '@/components/ui/spotlight'

export function SpotlightCard({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <Spotlight className="rounded-2xl group">
      {children}
    </Spotlight>
  )
}
