'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

export function CtaSection(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const timeDisplay = mins > 0
    ? `${mins}m ${secs.toString().padStart(2, '0')}s`
    : `${secs}s`

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Live timer - creates urgency through reality */}
        <FadeIn>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono mb-8 transition-colors duration-500 ${
            dark ? 'bg-zinc-900 border border-zinc-800 text-zinc-400' : 'bg-gray-100 border border-gray-200 text-gray-500'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            You&apos;ve been on this page for {timeDisplay}
          </div>
        </FadeIn>

        <FadeIn delay={0.05}>
          <h2 className={`font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 leading-tight transition-colors duration-500 ${
            dark ? 'text-white' : 'text-[#0B1220]'
          }`}>
            Your next lead is coming.
            <br />
            <span className="text-[#E8642C]">Will you be ready?</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p className={`text-lg max-w-lg mx-auto mb-10 transition-colors duration-500 ${
            dark ? 'text-zinc-400' : 'text-gray-600'
          }`}>
            In the time you&apos;ve spent here, {Math.max(1, Math.floor(seconds / 8))} leads went cold
            somewhere. Don&apos;t let the next one be yours.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="inline-block"
          >
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-lg bg-[#E8642C] text-white font-semibold text-base hover:bg-[#d55a25] shadow-lg shadow-[#E8642C]/20 hover:shadow-xl hover:shadow-[#E8642C]/30"
              style={{ transitionTimingFunction: 'var(--ease-out-spring)' }}
            >
              Book a Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
          <p className={`mt-6 text-sm transition-colors duration-500 ${dark ? 'text-zinc-600' : 'text-gray-400'}`}>
            15 minutes. No pressure. See it live.
          </p>
        </FadeIn>
      </div>
    </section>
  )
}
