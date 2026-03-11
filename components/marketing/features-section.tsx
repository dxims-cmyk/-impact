'use client'

import { Zap, Brain, Inbox, CalendarCheck, Settings, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRef } from 'react'
import { useInView } from 'framer-motion'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

const features = [
  {
    icon: Zap,
    title: '5-Second WhatsApp Alerts',
    desc: 'Know about every lead before your competitor even checks their email. Instant notification with name, number, source, and intent.',
    span: 'lg:col-span-2',
  },
  {
    icon: Brain,
    title: 'AI Lead Scoring',
    desc: 'Every lead rated 1-10 so you know who to call first.',
    span: '',
  },
  {
    icon: Inbox,
    title: 'Unified Inbox',
    desc: 'WhatsApp, SMS, email, Instagram, Messenger. One timeline.',
    span: '',
  },
  {
    icon: CalendarCheck,
    title: 'Calendar & Booking',
    desc: 'Cal.com integration so leads book themselves in. No back-and-forth.',
    span: '',
  },
  {
    icon: Settings,
    title: 'Automations',
    desc: 'Rules, triggers, follow-up sequences. No code needed.',
    span: '',
  },
  {
    icon: BarChart3,
    title: 'Lead Analytics',
    desc: 'See which ads, audiences, and creatives actually bring revenue, not just clicks.',
    span: 'lg:col-span-2',
  },
]

export function FeaturesSection(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="features" className="py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <h2 className={`font-display text-3xl sm:text-4xl font-bold text-center mb-4 transition-colors duration-700 ${
            dark ? 'text-white' : 'text-[#0B1220]'
          }`}>
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className={`text-center text-lg max-w-xl mx-auto mb-16 transition-colors duration-700 ${
            dark ? 'text-zinc-500' : 'text-gray-500'
          }`}>
            One platform replaces five different tools.
          </p>
        </FadeIn>

        {/* Bento grid */}
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 30 }}
              className={`group rounded-xl border p-6 flex flex-col spring-hover ${feature.span} ${
                dark
                  ? 'border-zinc-800/60 bg-zinc-900/30 hover:border-zinc-700'
                  : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm hover:shadow-md'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors group-hover:bg-[#E8642C]/10 ${
                dark ? 'bg-zinc-800' : 'bg-gray-100'
              }`}>
                <feature.icon className={`w-5 h-5 transition-colors group-hover:text-[#E8642C] ${
                  dark ? 'text-zinc-400' : 'text-gray-500'
                }`} />
              </div>
              <h3 className={`font-display text-base font-semibold mb-2 transition-colors duration-700 ${
                dark ? 'text-white' : 'text-[#0B1220]'
              }`}>
                {feature.title}
              </h3>
              <p className={`text-sm leading-relaxed transition-colors duration-700 ${
                dark ? 'text-zinc-400' : 'text-gray-600'
              }`}>
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <FadeIn delay={0.4}>
          <p className={`text-center text-sm mt-10 transition-colors duration-700 ${
            dark ? 'text-zinc-500' : 'text-gray-500'
          }`}>
            Plus: AI Receptionist, Outbound Lead Generation, and more on Growth and Pro plans.
          </p>
        </FadeIn>
      </div>
    </section>
  )
}
