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
    <section className="py-24 sm:py-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <h2 className={`font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 leading-tight transition-colors duration-500 ${
            dark ? 'text-white' : 'text-[#0B1220]'
          }`}>
            Your competitors are already
            <br />
            <span className="text-[#6E0F1A]">responding faster.</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.05}>
          <p className={`text-lg max-w-lg mx-auto mb-12 transition-colors duration-500 ${
            dark ? 'text-zinc-400' : 'text-gray-600'
          }`}>
            Get early access to Impact. Hands-on setup. Priority support. Limited spots.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="inline-block"
            >
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-lg bg-[#6E0F1A] text-white font-semibold text-base hover:bg-[#8B1422] shadow-lg shadow-[#6E0F1A]/20 hover:shadow-xl hover:shadow-[#6E0F1A]/30"
                style={{ transitionTimingFunction: 'var(--ease-out-spring)' }}
              >
                Get Early Access
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <a
              href="mailto:hello@driveimpact.io"
              className={`text-sm font-medium transition-colors duration-300 ${
                dark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-[#0B1220]'
              }`}
            >
              hello@driveimpact.io
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
