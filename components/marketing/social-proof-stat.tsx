'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

export function SocialProofSection(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <section className={`py-20 sm:py-28 transition-colors duration-700 ${
      dark ? 'bg-[#0A0A0A]' : 'bg-[#FAFAF8]'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <p className={`text-sm font-medium uppercase tracking-widest mb-4 transition-colors duration-700 ${
              dark ? 'text-zinc-500' : 'text-gray-500'
            }`}>
              Built by practitioners
            </p>
            <h2 className={`font-display text-3xl sm:text-4xl font-bold mb-4 transition-colors duration-700 ${
              dark ? 'text-white' : 'text-[#0B1220]'
            }`}>
              We run ads for clients. We built Impact because we needed it.
            </h2>
            <p className={`text-lg max-w-2xl mx-auto leading-relaxed transition-colors duration-700 ${
              dark ? 'text-zinc-400' : 'text-gray-600'
            }`}>
              AM:PM Media is a creative agency that runs ads for clients. We watched leads die in inboxes.
              So we built the system we wish existed.
            </p>
          </div>
        </FadeIn>

        {/* Stats bar */}
        <div ref={ref} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { value: '5s', label: 'Response time' },
            { value: '500+', label: 'Leads managed' },
            { value: '99.9%', label: 'Uptime' },
            { value: '24/7', label: 'AI coverage' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 30 }}
              className={`text-center rounded-xl border p-5 transition-colors duration-700 ${
                dark ? 'border-zinc-800 bg-zinc-900/40' : 'border-gray-200 bg-white shadow-sm'
              }`}
            >
              <div className="font-display text-2xl sm:text-3xl font-bold text-[#6E0F1A]">
                {stat.value}
              </div>
              <p className={`text-xs mt-1 transition-colors duration-700 ${dark ? 'text-zinc-500' : 'text-gray-500'}`}>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        <FadeIn delay={0.3}>
          <div className="text-center">
            <Link
              href="https://www.mediampm.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 text-sm font-medium transition-colors spring-hover ${
                dark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-[#0B1220]'
              }`}
            >
              Learn more about AM:PM Media
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
