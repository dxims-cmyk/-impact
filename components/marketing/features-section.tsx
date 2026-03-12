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
    title: 'Get alerted before your competitor checks their email.',
    desc: 'WhatsApp notification within 5 seconds of a lead coming in. Name, number, source, and AI score included.',
    span: 'lg:col-span-2',
  },
  {
    icon: Brain,
    title: 'Know which leads are worth calling first.',
    desc: 'AI reads every enquiry and scores it 1 to 10. Hot leads go to the top. No more guessing.',
    span: '',
  },
  {
    icon: Inbox,
    title: 'Every message, one place.',
    desc: 'WhatsApp, SMS, email, Instagram DM, and Messenger. One timeline per lead. No app switching.',
    span: '',
  },
  {
    icon: CalendarCheck,
    title: 'Leads book themselves in.',
    desc: 'Cal.com integration lets leads pick a time from your calendar directly. No back and forth.',
    span: '',
  },
  {
    icon: Settings,
    title: 'Set it and forget it.',
    desc: 'Automated follow-up sequences, triggers, and rules. Keep leads warm without lifting a finger.',
    span: '',
  },
  {
    icon: BarChart3,
    title: 'See what is working. Cut what is not.',
    desc: 'Track which ads, audiences, and creatives bring actual revenue. Not just clicks.',
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
            What changes when you turn Impact on.
          </h2>
          <p className={`text-center text-lg max-w-xl mx-auto mb-16 transition-colors duration-700 ${
            dark ? 'text-zinc-500' : 'text-gray-500'
          }`}>
            Six tools replaced by one platform. Every feature earns its place.
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
            Plus: AI Receptionist (Growth), Outbound Lead Generation (Pro), and more.
          </p>
        </FadeIn>
      </div>
    </section>
  )
}
