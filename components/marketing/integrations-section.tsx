'use client'

import { motion } from 'framer-motion'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

const liveIntegrations = [
  { name: 'Meta Lead Ads', initial: 'M', color: '#1877F2' },
  { name: 'WhatsApp Business', initial: 'W', color: '#25D366' },
  { name: 'Instagram DM', initial: 'I', color: '#E4405F' },
  { name: 'Messenger', initial: 'F', color: '#0084FF' },
  { name: 'SMS', initial: 'S', color: '#6366F1' },
  { name: 'Email', initial: 'E', color: '#EA4335' },
  { name: 'Cal.com', initial: 'C', color: '#292929' },
  { name: 'Stripe', initial: 'S', color: '#635BFF' },
]

const comingSoon = [
  { name: 'Google Ads', initial: 'G', color: '#4285F4' },
  { name: 'TikTok Ads', initial: 'T', color: '#010101' },
]

export function IntegrationsSection(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'

  return (
    <section className={`py-20 sm:py-28 transition-colors duration-700 ${
      dark ? 'bg-[#0A0A0A]' : 'bg-[#FAFAF8]'
    }`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <h2 className={`font-display text-3xl sm:text-4xl font-bold text-center mb-4 transition-colors duration-700 ${
            dark ? 'text-white' : 'text-[#0B1220]'
          }`}>
            Plugs into your existing stack.
          </h2>
          <p className={`text-center text-lg max-w-xl mx-auto mb-14 transition-colors duration-700 ${
            dark ? 'text-zinc-500' : 'text-gray-500'
          }`}>
            Connect your ad accounts, messaging channels, calendar, and payments. All in one place.
          </p>
        </FadeIn>

        {/* Live integrations */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {liveIntegrations.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
                viewport={{ once: true }}
                className={`flex items-center gap-3 rounded-xl border p-4 transition-colors duration-500 spring-hover ${
                  dark ? 'border-zinc-800 bg-zinc-900/40' : 'border-gray-200 bg-white shadow-sm'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: item.color }}
                >
                  {item.initial}
                </div>
                <span className={`text-sm font-medium transition-colors duration-700 ${
                  dark ? 'text-zinc-300' : 'text-gray-700'
                }`}>
                  {item.name}
                </span>
              </motion.div>
            ))}
          </div>
        </FadeIn>

        {/* Coming soon */}
        <FadeIn delay={0.2}>
          <div className="flex justify-center gap-3">
            {comingSoon.map((item) => (
              <div
                key={item.name}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors duration-500 ${
                  dark ? 'border-zinc-800/50 bg-zinc-900/20' : 'border-gray-200/60 bg-gray-50'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 opacity-50"
                  style={{ backgroundColor: item.color }}
                >
                  {item.initial}
                </div>
                <span className={`text-sm font-medium transition-colors duration-700 ${
                  dark ? 'text-zinc-500' : 'text-gray-400'
                }`}>
                  {item.name}
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  dark ? 'bg-zinc-800 text-zinc-500' : 'bg-gray-200 text-gray-500'
                }`}>
                  Soon
                </span>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
