'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Sparkles, Crown } from 'lucide-react'
import { motion } from 'framer-motion'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

const tiers = [
  {
    name: 'Core',
    price: '1,500',
    tagline: 'Capture and convert every lead.',
    features: [
      '5-second WhatsApp alerts',
      'AI lead scoring (1 to 10, hot/warm/cold)',
      'Unified inbox (WhatsApp, SMS, email, Instagram, Messenger)',
      'Calendar booking via Cal.com',
      'Automations builder (triggers, rules, sequences)',
      'Lead analytics and campaign tracking',
    ],
    highlight: false,
    tier: 'core' as const,
  },
  {
    name: 'Growth',
    price: '2,000',
    tagline: 'Everything in Core, plus AI call handling.',
    badge: 'Most Popular',
    features: [
      'Everything in Core',
      'AI Receptionist: answers calls 24/7, qualifies leads, books appointments',
      'Call recordings and transcripts',
      'Advanced automations (delays, conditions, webhooks)',
      'Priority support',
    ],
    highlight: true,
    tier: 'growth' as const,
  },
  {
    name: 'Pro',
    price: '2,500',
    tagline: 'The full growth engine.',
    features: [
      'Everything in Growth',
      'Outbound lead generation: find new prospects via Google Places data',
      'Content gallery: upload business photos and videos for ad creatives',
      'Reputation management: track and respond to Google/Facebook reviews',
      'Dedicated account manager',
      'Strategy calls',
    ],
    highlight: false,
    tier: 'pro' as const,
  },
]

export function PricingSection(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <section id="pricing" className="py-24 sm:py-32 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className={`font-display text-3xl sm:text-4xl font-bold mb-4 transition-colors duration-700 ${
              dark ? 'text-white' : 'text-[#0B1220]'
            }`}>
              Simple pricing. Serious results.
            </h2>
            <p className={`text-lg max-w-lg mx-auto transition-colors duration-700 ${
              dark ? 'text-zinc-500' : 'text-gray-500'
            }`}>
              No setup fees. No lock-in. Cancel anytime.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <FadeIn key={tier.name} delay={i * 0.08}>
              <motion.div
                onHoverStart={() => setHovered(i)}
                onHoverEnd={() => setHovered(null)}
                className={`relative rounded-2xl p-8 flex flex-col h-full transition-all duration-300 overflow-hidden ${
                  tier.tier === 'pro'
                    ? dark
                      ? 'border-2 border-[#6E0F1A]/40 bg-gradient-to-b from-[#6E0F1A]/10 via-zinc-900/80 to-zinc-900/60'
                      : 'border-2 border-[#6E0F1A]/30 bg-gradient-to-b from-[#6E0F1A]/[0.04] via-white to-white shadow-lg'
                    : tier.highlight
                      ? 'border-2 border-[#6E0F1A]' + (dark ? ' bg-zinc-900/60' : ' bg-white shadow-lg shadow-[#6E0F1A]/5')
                      : dark
                        ? 'border border-zinc-800 bg-zinc-900/30'
                        : 'border border-gray-200 bg-white shadow-sm'
                } ${hovered === i ? (dark ? 'border-zinc-600' : 'border-gray-400 shadow-md') : ''}`}
              >
                {/* Pro premium background pattern */}
                {tier.tier === 'pro' && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[#6E0F1A]/[0.06] blur-3xl" />
                    <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-[#6E0F1A]/[0.04] blur-3xl" />
                  </div>
                )}

                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#6E0F1A] text-white text-xs font-semibold">
                      <Sparkles className="w-3 h-3" />
                      {tier.badge}
                    </span>
                  </div>
                )}

                {/* Header with Impact logo */}
                <div className="relative mb-6">
                  <div className="flex items-center gap-2.5 mb-1">
                    <img src="/ampm-logo.png" alt="" className="w-6 h-6 rounded-md object-cover" />
                    <h3 className={`font-display text-lg font-bold transition-colors duration-700 ${
                      dark ? 'text-white' : 'text-[#0B1220]'
                    }`}>
                      <span className="text-[#6E0F1A]">:</span>Impact {tier.name}
                      {tier.tier === 'pro' && <Crown className="w-4 h-4 inline-block ml-1.5 text-[#6E0F1A] -mt-0.5" />}
                    </h3>
                  </div>
                  <p className={`text-sm transition-colors duration-700 ${dark ? 'text-zinc-500' : 'text-gray-500'}`}>
                    {tier.tagline}
                  </p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`font-display text-4xl font-extrabold transition-colors duration-700 ${
                    tier.tier === 'pro' ? 'text-[#6E0F1A]' : dark ? 'text-white' : 'text-[#0B1220]'
                  }`}>
                    &pound;{tier.price}
                  </span>
                  <span className={`text-sm transition-colors duration-700 ${dark ? 'text-zinc-500' : 'text-gray-500'}`}>
                    /mo
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${
                        tier.highlight || tier.tier === 'pro' ? 'text-[#6E0F1A]' : dark ? 'text-zinc-500' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm transition-colors duration-700 ${dark ? 'text-zinc-300' : 'text-gray-700'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/demo"
                  className={`relative flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm transition-all spring-hover ${
                    tier.tier === 'pro'
                      ? 'bg-[#6E0F1A] text-white hover:bg-[#8B1422] shadow-lg shadow-[#6E0F1A]/20'
                      : tier.highlight
                        ? 'bg-[#6E0F1A] text-white hover:bg-[#8B1422]'
                        : dark
                          ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                          : 'bg-[#0B1220] text-white hover:bg-[#0B1220]/90'
                  }`}
                >
                  Get Early Access
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.3}>
          <p className={`text-center text-sm mt-10 transition-colors duration-700 ${
            dark ? 'text-zinc-500' : 'text-gray-500'
          }`}>
            Need a single feature? Add AI Receptionist (&pound;400/mo) or Outbound Leads (&pound;300/mo) to any plan.
          </p>
        </FadeIn>
      </div>
    </section>
  )
}
