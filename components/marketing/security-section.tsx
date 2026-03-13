'use client'

import { Shield, Lock, Database, CreditCard, Key } from 'lucide-react'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

const items = [
  { icon: Lock, text: 'AES-256-GCM encryption for all stored credentials' },
  { icon: Database, text: 'Row-level security on every database table' },
  { icon: CreditCard, text: 'Stripe-secured payment processing' },
  { icon: Key, text: 'Meta official OAuth integration' },
  { icon: Shield, text: 'No hardcoded secrets. Environment-variable only.' },
]

export function SecuritySection(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'

  return (
    <section className={`py-20 sm:py-24 transition-colors duration-700 ${
      dark ? 'bg-[#0A0A0A]' : 'bg-[#FAFAF8]'
    }`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className={`rounded-xl border p-6 sm:p-8 transition-colors duration-700 ${
            dark ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-200 bg-white shadow-sm'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <Shield className={`w-5 h-5 ${dark ? 'text-zinc-400' : 'text-gray-500'}`} />
              <h2 className={`font-display text-xl font-bold transition-colors duration-700 ${
                dark ? 'text-white' : 'text-[#0B1220]'
              }`}>
                Your data is locked down.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <item.icon className={`w-4 h-4 mt-0.5 shrink-0 ${
                    dark ? 'text-zinc-500' : 'text-gray-400'
                  }`} />
                  <span className={`text-sm leading-relaxed transition-colors duration-700 ${
                    dark ? 'text-zinc-400' : 'text-gray-600'
                  }`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
