'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

const workflowSteps = [
  {
    icon: '📘',
    label: 'Lead comes in',
    detail: 'Meta, Google, TikTok, website forms',
    color: '#1877F2',
  },
  {
    icon: '⚡',
    label: 'Impact catches it',
    detail: 'AI scores, qualifies, routes',
    color: '#E8642C',
  },
  {
    icon: '💬',
    label: 'You get alerted',
    detail: 'WhatsApp in 5 seconds',
    color: '#25D366',
  },
  {
    icon: '📅',
    label: 'They book in',
    detail: 'Cal.com / Calendly auto-booking',
    color: '#6366F1',
  },
]

const channels = [
  { name: 'WhatsApp', icon: '💬' },
  { name: 'Instagram', icon: '📸' },
  { name: 'Messenger', icon: '💭' },
  { name: 'Email', icon: '📧' },
  { name: 'SMS', icon: '📱' },
]

const platforms = [
  { name: 'Meta Ads', icon: '📘' },
  { name: 'Google Ads', icon: '🔍' },
  { name: 'Cal.com', icon: '📅' },
  { name: 'Stripe', icon: '💳' },
  { name: 'Claude AI', icon: '🧠' },
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
            One lead, one flow, no faff
          </h2>
          <p className={`text-center text-lg max-w-xl mx-auto mb-16 transition-colors duration-700 ${
            dark ? 'text-zinc-500' : 'text-gray-500'
          }`}>
            Every lead follows the same path. No matter where they come from.
          </p>
        </FadeIn>

        {/* Workflow pipeline */}
        <FadeIn delay={0.1}>
          <div className="flex flex-col sm:flex-row items-stretch gap-0 mb-16">
            {workflowSteps.map((step, i) => (
              <div key={step.label} className="flex items-center flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, type: 'spring', stiffness: 300, damping: 30 }}
                  viewport={{ once: true }}
                  className={`flex-1 rounded-xl border p-5 text-center transition-colors duration-700 ${
                    dark ? 'border-zinc-800 bg-zinc-900/40' : 'border-gray-200 bg-white shadow-sm'
                  }`}
                >
                  <div className="text-2xl mb-2">{step.icon}</div>
                  <div className={`text-sm font-semibold mb-1 transition-colors duration-700 ${
                    dark ? 'text-white' : 'text-[#0B1220]'
                  }`}>
                    {step.label}
                  </div>
                  <div className={`text-xs transition-colors duration-700 ${
                    dark ? 'text-zinc-500' : 'text-gray-500'
                  }`}>
                    {step.detail}
                  </div>
                </motion.div>
                {i < workflowSteps.length - 1 && (
                  <div className="hidden sm:flex items-center px-2">
                    <ArrowRight className={`w-4 h-4 transition-colors duration-700 ${
                      dark ? 'text-zinc-700' : 'text-gray-300'
                    }`} />
                  </div>
                )}
                {i < workflowSteps.length - 1 && (
                  <div className="flex sm:hidden justify-center py-2">
                    <ArrowRight className={`w-4 h-4 rotate-90 transition-colors duration-700 ${
                      dark ? 'text-zinc-700' : 'text-gray-300'
                    }`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Two columns: Channels + Platforms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FadeIn delay={0.2}>
            <div className={`rounded-xl border p-6 transition-colors duration-700 ${
              dark ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-200 bg-white shadow-sm'
            }`}>
              <h3 className={`font-display text-base font-semibold mb-4 transition-colors duration-700 ${
                dark ? 'text-white' : 'text-[#0B1220]'
              }`}>
                Reply on any channel
              </h3>
              <div className="flex flex-wrap gap-2">
                {channels.map((ch) => (
                  <span
                    key={ch.name}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-700 ${
                      dark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {ch.icon} {ch.name}
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.25}>
            <div className={`rounded-xl border p-6 transition-colors duration-700 ${
              dark ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-200 bg-white shadow-sm'
            }`}>
              <h3 className={`font-display text-base font-semibold mb-4 transition-colors duration-700 ${
                dark ? 'text-white' : 'text-[#0B1220]'
              }`}>
                Plugs into your stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {platforms.map((pl) => (
                  <span
                    key={pl.name}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-700 ${
                      dark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {pl.icon} {pl.name}
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
