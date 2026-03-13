'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { X, Check, Clock, Smartphone, Brain, Inbox, BarChart3, CalendarCheck } from 'lucide-react'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

const withoutItems = [
  { icon: Clock, text: 'Check email every 20 minutes' },
  { icon: Smartphone, text: 'Copy lead info into a spreadsheet' },
  { icon: Brain, text: 'Guess which leads are serious' },
  { icon: Inbox, text: 'Switch between 5 different apps' },
  { icon: BarChart3, text: 'Wonder which ads actually work' },
  { icon: CalendarCheck, text: 'Play phone tag to book meetings' },
]

const withItems = [
  { icon: Smartphone, text: 'WhatsApp alert in 5 seconds' },
  { icon: Brain, text: 'AI scores every lead 1-10' },
  { icon: Inbox, text: 'One inbox, every channel' },
  { icon: CalendarCheck, text: 'Leads book themselves in' },
  { icon: BarChart3, text: 'See which ads bring revenue' },
  { icon: Clock, text: 'You close deals. We handle the rest.' },
]

export function BeforeAfter(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className={`py-20 sm:py-28 transition-colors duration-700 ${
      dark ? 'bg-[#0A0A0A]' : 'bg-[#FAFAF8]'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <h2 className={`font-display text-3xl sm:text-4xl font-bold mb-4 transition-colors duration-700 ${
              dark ? 'text-white' : 'text-[#0B1220]'
            }`}>
              You close deals. Impact handles the rest.
            </h2>
            <p className={`text-lg max-w-xl mx-auto transition-colors duration-700 ${
              dark ? 'text-zinc-500' : 'text-gray-500'
            }`}>
              Stop chasing leads. Start closing them.
            </p>
          </div>
        </FadeIn>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Without Impact */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`rounded-2xl border p-6 sm:p-8 transition-colors duration-700 ${
              dark ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-200 bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                dark ? 'bg-red-500/10' : 'bg-red-50'
              }`}>
                <X className="w-4 h-4 text-red-500" />
              </div>
              <h3 className={`font-display text-lg font-bold transition-colors duration-700 ${
                dark ? 'text-white' : 'text-[#0B1220]'
              }`}>
                Without Impact
              </h3>
            </div>
            <div className="space-y-4">
              {withoutItems.map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -12 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.1 + i * 0.06, type: 'spring', stiffness: 300, damping: 30 }}
                  className="flex items-start gap-3"
                >
                  <item.icon className={`w-4 h-4 mt-0.5 shrink-0 transition-colors duration-700 ${
                    dark ? 'text-zinc-600' : 'text-gray-400'
                  }`} />
                  <span className={`text-sm leading-relaxed transition-colors duration-700 ${
                    dark ? 'text-zinc-400 line-through decoration-zinc-700' : 'text-gray-500 line-through decoration-gray-300'
                  }`}>
                    {item.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* With Impact */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
            className={`rounded-2xl border-2 p-6 sm:p-8 transition-colors duration-700 ${
              dark ? 'border-[#6E0F1A]/30 bg-[#6E0F1A]/[0.03]' : 'border-[#6E0F1A]/20 bg-[#6E0F1A]/[0.02]'
            }`}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#6E0F1A]/10">
                <Check className="w-4 h-4 text-[#6E0F1A]" />
              </div>
              <h3 className={`font-display text-lg font-bold transition-colors duration-700 ${
                dark ? 'text-white' : 'text-[#0B1220]'
              }`}>
                With <span className="text-[#6E0F1A]">:</span>Impact
              </h3>
            </div>
            <div className="space-y-4">
              {withItems.map((item, i) => (
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
