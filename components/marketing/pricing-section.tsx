'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { LampEffect } from '@/components/ui/lamp-effect'
import { MovingBorder } from '@/components/ui/moving-border'

const pricingFeatures = [
  'Instant WhatsApp alerts',
  'AI lead scoring & qualification',
  'Unified inbox (5 channels)',
  'Calendar sync & booking',
  'Follow-up automations',
  'Reports & analytics',
  'Meta & Google Ads integration',
  'Dedicated onboarding',
]

export function PricingSection(): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="pricing" className="scroll-mt-20">
      <LampEffect className="py-20 sm:py-28">
        <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <p className="text-center text-sm font-medium text-[#E8642C] uppercase tracking-widest mb-4">
              Pricing
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-white mb-6 leading-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-center text-gray-400 text-lg max-w-xl mx-auto mb-16">
              One plan. Everything included. No hidden fees.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="max-w-lg mx-auto"
          >
            <MovingBorder
              containerClassName="w-full rounded-2xl"
              className="bg-white rounded-2xl"
              borderClassName="rounded-2xl"
              duration={4000}
            >
              <div className="p-8 sm:p-10">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-[#0B1220] mb-2">
                    <span className="text-[#E8642C]">:</span>Impact Core
                  </h3>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-5xl sm:text-6xl font-extrabold text-[#0B1220]">&pound;1,500</span>
                    <span className="text-gray-500 text-base">/month</span>
                  </div>
                  <p className="text-gray-600 text-sm">Everything you need to capture and convert leads</p>
                </div>

                <ul className="space-y-3.5 mb-10">
                  {pricingFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#E8642C] shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/demo"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-[#E8642C] text-white font-semibold hover:bg-[#d55a25] transition-all shadow-lg shadow-[#E8642C]/20"
                >
                  Book a Demo
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <p className="text-center text-xs text-gray-500 mt-5">
                  Monthly. Cancel anytime. No setup fees.
                </p>
              </div>
            </MovingBorder>

            <p className="text-center text-sm text-gray-400 mt-6">
              Need done-for-you ads + content?{' '}
              <Link href="/demo" className="text-[#E8642C] font-medium hover:underline">
                Ask about :Impact Pro
              </Link>
            </p>
          </motion.div>
        </div>
      </LampEffect>
    </section>
  )
}
