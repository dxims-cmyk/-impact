'use client'

import { UtensilsCrossed, HeartPulse, Building2 } from 'lucide-react'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

const industries = [
  {
    icon: UtensilsCrossed,
    title: 'Restaurants & Hospitality',
    description: 'Booking enquiries from Meta ads answered instantly. No more lost Friday night covers.',
  },
  {
    icon: HeartPulse,
    title: 'Clinics & Healthcare',
    description: 'Patient enquiries scored and routed. Your receptionist focuses on the waiting room, not the inbox.',
  },
  {
    icon: Building2,
    title: 'Property & Estate Agents',
    description: 'Vendor leads followed up in seconds, not days. Beat every other agent to the phone.',
  },
]

export function WhoItsFor(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <h2 className={`font-display text-3xl sm:text-4xl font-bold text-center mb-14 transition-colors duration-700 ${
            dark ? 'text-white' : 'text-[#0B1220]'
          }`}>
            Built for businesses that live and die by leads
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {industries.map((item, i) => (
            <FadeIn key={item.title} delay={i * 0.1}>
              <div className={`group rounded-xl border p-7 hover:-translate-y-1 transition-all duration-300 ${
                dark
                  ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                  : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm hover:shadow-md'
              }`}>
                <div className="w-11 h-11 flex items-center justify-center mb-5">
                  <item.icon className={`w-5 h-5 transition-colors group-hover:text-[#6E0F1A] ${
                    dark ? 'text-zinc-400' : 'text-gray-500'
                  }`} />
                </div>
                <h3 className={`font-display text-lg font-semibold mb-2 transition-colors duration-700 ${
                  dark ? 'text-white' : 'text-[#0B1220]'
                }`}>
                  {item.title}
                </h3>
                <p className={`text-sm leading-relaxed mb-4 transition-colors duration-700 ${
                  dark ? 'text-zinc-400' : 'text-gray-600'
                }`}>
                  {item.description}
                </p>
                <span className="text-sm text-[#6E0F1A] font-medium">Learn more &rarr;</span>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
