'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useMarketingTheme } from '@/components/marketing/theme-provider'
import { MobileNav } from '@/components/marketing/mobile-nav'

export function MarketingHeader(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'
  const [hidden, setHidden] = useState(false)
  const [atTop, setAtTop] = useState(true)

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY
    setAtTop(currentY < 20)

    // Only hide/show after scrolling past hero area
    if (currentY < 100) {
      setHidden(false)
      return
    }

    // Compare with last position stored in ref-like closure
    const lastY = (handleScroll as { lastY?: number }).lastY ?? 0
    if (currentY > lastY + 5) {
      setHidden(true) // scrolling down
    } else if (currentY < lastY - 5) {
      setHidden(false) // scrolling up
    }
    ;(handleScroll as { lastY?: number }).lastY = currentY
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500 ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      } ${
        atTop
          ? dark
            ? 'bg-transparent border-transparent'
            : 'bg-transparent border-transparent'
          : dark
            ? 'bg-[#0A0A0A]/90 backdrop-blur-xl border-zinc-900'
            : 'bg-white/90 backdrop-blur-xl border-gray-200'
      }`}
      style={{ transitionTimingFunction: 'var(--ease-out-spring)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/ampm-logo.png"
              alt="AM:PM"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className={`font-semibold text-lg tracking-tight font-display transition-colors duration-500 ${
              dark ? 'text-white' : 'text-[#0B1220]'
            }`}>
              <span className="text-[#6E0F1A]">:</span>Impact
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {[
              { href: '#how-it-works', label: 'How It Works' },
              { href: '#features', label: 'Features' },
              { href: '#pricing', label: 'Pricing' },
              { href: '#faq', label: 'FAQ' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors duration-300 ${
                  dark
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-gray-500 hover:text-[#0B1220]'
                }`}
                style={{ transitionTimingFunction: 'var(--ease-out-spring)' }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={`hidden sm:inline-flex items-center text-sm font-semibold px-4 py-2 rounded-full border transition-all duration-300 ${
                dark
                  ? 'border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white bg-zinc-900/50'
                  : 'border-gray-300 text-[#0B1220] hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/demo"
              className="hidden sm:inline-flex items-center px-5 py-2.5 rounded-lg bg-[#6E0F1A] text-white text-sm font-semibold spring-hover hover:bg-[#8B1422] hover:shadow-lg hover:shadow-[#6E0F1A]/20"
              style={{ transitionTimingFunction: 'var(--ease-bounce)' }}
            >
              Get Early Access
            </Link>
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  )
}
