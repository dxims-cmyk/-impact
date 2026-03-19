'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { User, Zap, MessageSquare, Brain, Inbox, CalendarCheck, BarChart3, Handshake } from 'lucide-react'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

const youItems = [
  { icon: Handshake, text: 'Close deals' },
  { icon: MessageSquare, text: 'Talk to customers' },
  { icon: User, text: 'Run your business' },
]

const impactItems = [
  { icon: Zap, text: 'Captures every lead from your ads' },
  { icon: Brain, text: 'Scores them by likelihood to buy' },
  { icon: MessageSquare, text: 'Alerts you on WhatsApp in 5 seconds' },
  { icon: Inbox, text: 'Puts every message in one inbox' },
  { icon: CalendarCheck, text: 'Lets leads book straight into your calendar' },
  { icon: BarChart3, text: 'Shows which ads bring revenue' },
]

export function ResponsibilitySplit(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className={`py-24 sm:py-32 transition-colors duration-700 ${
      dark ? 'bg-[#0A0A0A]' : 'bg-[#FAFAF8]'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className={`font-display text-3xl sm:text-4xl font-bold mb-4 transition-colors duration-700 ${
              dark ? 'text-white' : 'text-[#0B1220]'
            }`}>
              You close deals. Impact handles everything else.
            </h2>
          </div>
        </FadeIn>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* You */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`rounded-2xl border p-6 sm:p-8 transition-colors duration-700 ${
              dark ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-200 bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3 mb-6">
              <User className={`w-5 h-5 ${dark ? 'text-zinc-400' : 'text-gray-500'}`} />
              <h3 className={`font-display text-xl font-bold transition-colors duration-700 ${
                dark ? 'text-white' : 'text-[#0B1220]'
              }`}>
                You
              </h3>
            </div>
            <div className="space-y-4">
              {youItems.map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -12 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.1 + i * 0.06, type: 'spring', stiffness: 300, damping: 30 }}
                  className="flex items-start gap-3"
                >
                  <item.icon className={`w-4 h-4 mt-0.5 shrink-0 transition-colors duration-700 ${
                    dark ? 'text-zinc-500' : 'text-gray-400'
                  }`} />
                  <span className={`text-sm leading-relaxed font-medium transition-colors duration-700 ${
                    dark ? 'text-zinc-300' : 'text-gray-700'
                  }`}>
                    {item.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Impact */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
            className={`rounded-2xl border-2 p-6 sm:p-8 transition-colors duration-700 ${
              dark ? 'border-[#6E0F1A]/30 bg-[#6E0F1A]/[0.03]' : 'border-[#6E0F1A]/20 bg-[#6E0F1A]/[0.02]'
            }`}
          >
            <div className="flex items-center gap-2 mb-6">
              <img src="/ampm-logo.png" alt="AM:PM" className="w-8 h-8 rounded-lg object-cover" />
              <h3 className={`font-display text-lg font-bold transition-colors duration-700 ${
                dark ? 'text-white' : 'text-[#0B1220]'
              }`}>
                <span className="text-[#6E0F1A]">:</span>Impact
              </h3>
            </div>
            <div className="space-y-4">
              {impactItems.map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: 12 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.06, type: 'spring', stiffness: 300, damping: 30 }}
                  className="flex items-start gap-3"
                >
                  <item.icon className="w-4 h-4 mt-0.5 shrink-0 text-[#6E0F1A]" />
                  <span className={`text-sm leading-relaxed font-medium transition-colors duration-700 ${
                    dark ? 'text-zinc-200' : 'text-gray-800'
                  }`}>
                    {item.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
