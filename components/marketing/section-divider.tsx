'use client'

import { useMarketingTheme } from '@/components/marketing/theme-provider'

type DividerVariant = 'wave' | 'slant' | 'curve'

/**
 * Organic SVG divider between landing page sections.
 * Flipped = the shape points upward (place at top of section).
 */
export function SectionDivider({
  variant = 'wave',
  flip = false,
  fromDark = false,
  toDark = false,
}: {
  variant?: DividerVariant
  flip?: boolean
  fromDark?: boolean
  toDark?: boolean
}): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'

  // Determine fill color based on which section we're transitioning into
  const fill = toDark
    ? dark ? '#0A0A0A' : '#FAFAF8'
    : fromDark
      ? dark ? '#0A0A0A' : '#FAFAF8'
      : dark ? '#0A0A0A' : '#FAFAF8'

  const paths: Record<DividerVariant, string> = {
    wave: 'M0,32 C320,96 640,0 960,48 C1280,96 1440,16 1440,16 L1440,0 L0,0 Z',
    slant: 'M0,48 L1440,0 L1440,0 L0,0 Z',
    curve: 'M0,64 Q720,0 1440,64 L1440,0 L0,0 Z',
  }

  return (
    <div
      className={`w-full overflow-hidden leading-none ${flip ? 'rotate-180' : ''}`}
      style={{ marginTop: '-1px', marginBottom: '-1px' }}
    >
      <svg
        viewBox="0 0 1440 64"
        preserveAspectRatio="none"
        className="w-full h-8 sm:h-12 block"
        aria-hidden="true"
      >
        <path d={paths[variant]} fill={fill} className="transition-colors duration-700" />
      </svg>
    </div>
  )
}
