'use client'

import {
  Zap,
  Brain,
  MessageSquare,
  CalendarCheck,
  Settings,
  BarChart3,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Spotlight } from '@/components/ui/spotlight'
import { Reveal } from '@/components/marketing/reveal'

const features = [
  {
    icon: Zap,
    title: '5-Second Alerts',
    desc: 'WhatsApp, SMS, or email. The moment a lead comes in, you know about it.',
    accent: 'from-amber-500/10 to-orange-500/10',
  },
  {
    icon: Brain,
    title: 'AI Lead Scoring',
    desc: 'Powered by Claude. Every lead scored and qualified automatically.',
    accent: 'from-violet-500/10 to-purple-500/10',
  },
  {
    icon: MessageSquare,
    title: 'Unified Inbox',
    desc: 'WhatsApp, SMS, email, Instagram DM, Messenger. One conversation view.',
    accent: 'from-blue-500/10 to-cyan-500/10',
  },
  {
    icon: CalendarCheck,
    title: 'Calendar Sync',
    desc: 'Cal.com, Calendly, Google Calendar. Leads book directly into your diary.',
    accent: 'from-emerald-500/10 to-green-500/10',
  },
  {
    icon: Settings,
    title: 'Automations',
    desc: 'Follow-up sequences that run themselves. Never forget a lead again.',
    accent: 'from-slate-500/10 to-gray-500/10',
  },
  {
    icon: BarChart3,
    title: 'ROI Tracking',
    desc: 'Know exactly which ads, campaigns, and channels bring paying customers.',
    accent: 'from-rose-500/10 to-pink-500/10',
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
}

export function FeaturesSection(): React.JSX.Element {
  return (
    <section id="features" className="py-20 sm:py-28 bg-gray-50/80 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-center text-sm font-medium text-[#E8642C] uppercase tracking-widest mb-4">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-[#0B1220] mb-6 leading-tight">
            Everything you need to{' '}
            <span className="text-[#E8642C]">convert leads</span>
          </h2>
          <p className="text-center text-gray-600 text-lg max-w-2xl mx-auto mb-16">
            One platform. No duct-taping five different tools together.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={cardVariants}
            >
              <Spotlight className="rounded-2xl h-full">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 hover:border-gray-200 transition-all duration-300 h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.accent} flex items-center justify-center mb-5`}>
                    <feature.icon className="w-5 h-5 text-[#0B1220]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#0B1220] mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              </Spotlight>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
