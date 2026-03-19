'use client'

import Image from 'next/image'
import { Building2, TrendingUp, Zap, Code2 } from 'lucide-react'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

const credentials = [
  {
    icon: Building2,
    title: 'Built by AM:PM Media',
    desc: 'A Glasgow creative agency that manages ads, content, and growth for service businesses. We built Impact because our clients needed faster lead response.',
    image: null,
  },
  {
    icon: TrendingUp,
    title: 'Proven results for our clients',
    desc: 'Namak Mandi: 548% revenue growth. Palais Bar: viral content strategy. Wee Drop: brand to launch in 8 weeks. Impact was born from real client needs.',
    image: null,
  },
  {
    icon: Zap,
    title: 'We eat our own dog food',
    desc: 'Every demo request on this page triggers a WhatsApp alert to our team in under 5 seconds. We run on Impact ourselves.',
    image: null,
  },
  {
    icon: Code2,
    title: 'Enterprise-grade tech stack',
    desc: 'Supabase (PostgreSQL), row-level security, AES-256 encryption, Stripe billing, Meta official OAuth. No shortcuts.',
    image: null,
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
          {/* Card 1: Built by AM:PM - with team photo */}
          <FadeIn delay={0}>
            <div className={`rounded-xl border overflow-hidden h-full transition-colors duration-700 ${
              dark ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-200 bg-white shadow-sm'
            }`}>
              <div className="relative h-44 overflow-hidden">
                <Image
                  src="/people/team-working.jpg"
                  alt="Team collaborating on client results"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold">
                    <Building2 className="w-3 h-3" /> AM:PM Media, Glasgow
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className={`font-display text-base font-semibold mb-2 transition-colors duration-700 ${
                  dark ? 'text-white' : 'text-[#0B1220]'
                }`}>
                  {credentials[0].title}
                </h3>
                <p className={`text-sm leading-relaxed transition-colors duration-700 ${
                  dark ? 'text-zinc-400' : 'text-gray-600'
                }`}>
                  {credentials[0].desc}
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Card 2: Proven results - with persona avatars */}
          <FadeIn delay={0.08}>
            <div className={`rounded-xl border p-8 h-full transition-colors duration-700 ${
              dark ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-200 bg-white shadow-sm'
            }`}>
              <div className="flex -space-x-2 mb-5">
                {['/people/restaurant-owner.jpg', '/people/business-owner.jpg', '/people/salon-owner.jpg'].map((src, i) => (
                  <Image
                    key={src}
                    src={src}
                    alt=""
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                    style={{ zIndex: 3 - i }}
                  />
                ))}
              </div>
              <h3 className={`font-display text-base font-semibold mb-2 transition-colors duration-700 ${
                dark ? 'text-white' : 'text-[#0B1220]'
              }`}>
                {credentials[1].title}
              </h3>
              <p className={`text-sm leading-relaxed transition-colors duration-700 ${
                dark ? 'text-zinc-400' : 'text-gray-600'
              }`}>
                {credentials[1].desc}
              </p>
            </div>
          </FadeIn>

          {/* Card 3: We eat our own dog food */}
          <FadeIn delay={0.16}>
            <div className={`rounded-xl border p-8 h-full transition-colors duration-700 ${
              dark ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-200 bg-white shadow-sm'
            }`}>
              <Zap className={`w-5 h-5 mb-4 ${dark ? 'text-zinc-400' : 'text-gray-500'}`} />
              <h3 className={`font-display text-base font-semibold mb-2 transition-colors duration-700 ${
                dark ? 'text-white' : 'text-[#0B1220]'
              }`}>
                {credentials[2].title}
              </h3>
              <p className={`text-sm leading-relaxed transition-colors duration-700 ${
                dark ? 'text-zinc-400' : 'text-gray-600'
              }`}>
                {credentials[2].desc}
              </p>
            </div>
          </FadeIn>

          {/* Card 4: Enterprise tech stack */}
          <FadeIn delay={0.24}>
            <div className={`rounded-xl border p-8 h-full transition-colors duration-700 ${
              dark ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-200 bg-white shadow-sm'
            }`}>
              <Code2 className={`w-5 h-5 mb-4 ${dark ? 'text-zinc-400' : 'text-gray-500'}`} />
              <h3 className={`font-display text-base font-semibold mb-2 transition-colors duration-700 ${
                dark ? 'text-white' : 'text-[#0B1220]'
              }`}>
                {credentials[3].title}
              </h3>
              <p className={`text-sm leading-relaxed transition-colors duration-700 ${
                dark ? 'text-zinc-400' : 'text-gray-600'
              }`}>
                {credentials[3].desc}
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
