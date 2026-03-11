'use client'

import { useMarketingTheme } from '@/components/marketing/theme-provider'
import { FadeIn } from '@/components/marketing/fade-in'

const clients = [
  { name: 'This Could Be You', type: 'Your Industry', metric: 'Get started today' },
  { name: 'Dxims', type: 'Creative Agency', metric: '200+ leads managed' },
  { name: 'AM:PM Media', type: 'Marketing Agency', metric: 'Built it. Uses it daily.' },
  { name: 'Impact Demo', type: 'SaaS Platform', metric: '3x lead conversion' },
]

export function ClientCarousel(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'

  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <p className={`text-xs font-medium uppercase tracking-[0.2em] text-center mb-8 transition-colors duration-500 ${
            dark ? 'text-zinc-600' : 'text-gray-400'
          }`}>
            Trusted by businesses worldwide
          </p>
        </FadeIn>

        {/* Static trust bar with context - not auto-scrolling dead pattern */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {clients.map((client, i) => (
            <FadeIn key={client.name} delay={i * 0.05}>
              <div
                className={`group relative rounded-xl border px-5 py-4 text-center transition-all duration-500 spring-hover ${
                  dark
                    ? 'border-zinc-800/60 bg-zinc-900/20 hover:border-zinc-700'
                    : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm hover:shadow-md'
                }`}
              >
                <div className={`text-sm font-semibold transition-colors duration-500 ${
                  dark ? 'text-zinc-200' : 'text-[#0B1220]'
                }`}>
                  {client.name}
                </div>
                <div className={`text-[11px] mt-0.5 transition-colors duration-500 ${
                  dark ? 'text-zinc-600' : 'text-gray-400'
                }`}>
                  {client.type}
                </div>
                <div className="text-[11px] font-medium mt-2 text-[#E8642C]">
                  {client.metric}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
