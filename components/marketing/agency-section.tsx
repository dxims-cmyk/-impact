'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

export function AgencySection(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'

  return (
    <section className={`py-16 sm:py-20 border-t transition-colors duration-700 ${
      dark ? 'border-zinc-900' : 'border-gray-200'
    }`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className={`rounded-2xl border p-8 sm:p-10 text-center transition-colors duration-700 ${
            dark ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-200 bg-white shadow-sm'
          }`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-4 transition-colors duration-700 ${
              dark ? 'text-zinc-500' : 'text-gray-400'
            }`}>
              For agencies
            </p>
            <h2 className={`font-display text-2xl sm:text-3xl font-bold mb-3 transition-colors duration-700 ${
              dark ? 'text-white' : 'text-[#0B1220]'
            }`}>
              Run an agency?
            </h2>
            <p className={`text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-8 transition-colors duration-700 ${
              dark ? 'text-zinc-400' : 'text-gray-600'
            }`}>
              White-label Impact under your brand. Your name, your clients, your dashboard.
              We build the tech. You take the credit.
            </p>

            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-8">
              {['Your branding', 'Your pricing', 'Fully managed'].map((item) => (
                <span key={item} className={`text-xs font-medium transition-colors duration-700 ${
                  dark ? 'text-zinc-500' : 'text-gray-400'
                }`}>
                  {item}
                </span>
              ))}
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="inline-block"
            >
              <Link
                href="/demo"
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-colors spring-hover ${
                  dark
                    ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                    : 'bg-[#0B1220] text-white hover:bg-[#0B1220]/90'
                }`}
              >
                Talk to us
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
