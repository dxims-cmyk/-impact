'use client'

import { Building2, TrendingUp, Zap, Code2 } from 'lucide-react'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

const credentials = [
  {
    icon: Building2,
    title: 'Built by AM:PM Media',
    desc: 'A Glasgow creative agency that manages ads, content, and growth for service businesses. We built Impact because our clients needed faster lead response.',
  },
  {
    icon: TrendingUp,
    title: 'Proven results for our clients',
    desc: 'Namak Mandi: 548% revenue growth. Palais Bar: viral content strategy. Wee Drop: brand to launch in 8 weeks. Impact was born from real client needs.',
  },
  {
    icon: Zap,
    title: 'We eat our own dog food',
    desc: 'Every demo request on this page triggers a WhatsApp alert to our team in under 5 seconds. We run on Impact ourselves.',
  },
  {
    icon: Code2,
    title: 'Enterprise-grade tech stack',
    desc: 'Supabase (PostgreSQL), row-level security, AES-256 encryption, Stripe billing, Meta official OAuth. No shortcuts.',
  },
]

export function TrustSection(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'

  return (
    <section className="py-24 sm:py-32 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className={`font-display text-3xl sm:text-4xl font-bold mb-4 transition-colors duration-700 ${
              dark ? 'text-white' : 'text-[#0B1220]'
            }`}>
              Built by a team that runs on leads too.
            </h2>
            <p className={`text-lg max-w-xl mx-auto transition-colors duration-700 ${
              dark ? 'text-zinc-500' : 'text-gray-500'
            }`}>
              Currently onboarding founding clients. Limited spots available.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {credentials.map((item, i) => (
            <FadeIn key={item.title} delay={i * 0.08}>
              <div className={`rounded-xl border p-8 h-full transition-colors duration-700 ${
                dark
                  ? 'border-zinc-800 bg-zinc-900/30'
                  : 'border-gray-200 bg-white shadow-sm'
              }`}>
                <div className="w-10 h-10 flex items-center justify-center mb-4">
                  <item.icon className={`w-5 h-5 ${
                    dark ? 'text-zinc-400' : 'text-gray-500'
                  }`} />
                </div>
                <h3 className={`font-display text-base font-semibold mb-2 transition-colors duration-700 ${
                  dark ? 'text-white' : 'text-[#0B1220]'
                }`}>
                  {item.title}
                </h3>
                <p className={`text-sm leading-relaxed transition-colors duration-700 ${
                  dark ? 'text-zinc-400' : 'text-gray-600'
                }`}>
                  {item.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
