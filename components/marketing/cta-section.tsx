'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

export function CtaSection(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <h2 className={`font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 leading-tight transition-colors duration-500 ${
            dark ? 'text-white' : 'text-[#0B1220]'
          }`}>
            Your next lead is coming.
            <br />
            <span className="text-[#E8642C]">Will you be ready?</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.05}>
          <p className={`text-lg max-w-lg mx-auto mb-10 transition-colors duration-500 ${
            dark ? 'text-zinc-400' : 'text-gray-600'
          }`}>
            See how Impact works for your business. 15-minute demo, no pressure.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
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
        </FadeIn>
      </div>
    </section>
  )
}
