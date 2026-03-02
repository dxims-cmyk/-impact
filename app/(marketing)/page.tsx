import {
  Clock,
  Trophy,
  AlertTriangle,
  Star,
  Target,
  Smartphone,
  Brain,
  CalendarCheck,
  BarChart3,
} from 'lucide-react'
import { Reveal } from '@/components/marketing/reveal'
import { FaqItem } from '@/components/marketing/faq-item'
import { HeroSection } from '@/components/marketing/hero-section'
import { FeaturesSection } from '@/components/marketing/features-section'
import { PricingSection } from '@/components/marketing/pricing-section'
import { CtaSection } from '@/components/marketing/cta-section'
import { PainPointStats } from '@/components/marketing/pain-point-stats'
import { SocialProofStat } from '@/components/marketing/social-proof-stat'
import { SpotlightCard } from '@/components/marketing/spotlight-card'

/* ================================================================== */
/*  LANDING PAGE (Server Component for SEO)                            */
/* ================================================================== */
export default function LandingPage() {
  return (
    <>
      {/* ============================================================ */}
      {/*  HERO — 3D scroll + MovingBorder CTA                        */}
      {/* ============================================================ */}
      <HeroSection />

      {/* ============================================================ */}
      {/*  PAIN POINTS — TextGenerateEffect on stats                  */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-28 bg-[#0B1220] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-center text-sm font-medium text-[#E8642C] uppercase tracking-widest mb-4">
              The problem
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-16 leading-tight">
              Your leads are going cold.<br className="hidden sm:block" /> Here&apos;s why.
            </h2>
          </Reveal>

          <PainPointStats />
        </div>
      </section>

      {/* ============================================================ */}
      {/*  HOW IT WORKS — Spotlight hover on cards                    */}
      {/* ============================================================ */}
      <section id="how-it-works" className="py-20 sm:py-28 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-center text-sm font-medium text-[#E8642C] uppercase tracking-widest mb-4">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-[#0B1220] mb-6 leading-tight">
              From ad click to booked call{' '}
              <span className="text-[#E8642C]">in minutes</span>
            </h2>
            <p className="text-center text-gray-600 text-lg max-w-2xl mx-auto mb-16">
              Four steps. Fully automated. No leads fall through the cracks.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                step: '01',
                icon: Target,
                title: 'Lead comes in',
                desc: 'From Meta, Google, TikTok, your website, or any form. We capture everything.',
              },
              {
                step: '02',
                icon: Smartphone,
                title: 'Instant WhatsApp alert',
                desc: '5 seconds. You get their name, number, source, and what they\'re looking for.',
              },
              {
                step: '03',
                icon: Brain,
                title: 'AI scores the lead',
                desc: 'Know who\'s serious before you pick up the phone. Prioritise the hot ones.',
              },
              {
                step: '04',
                icon: CalendarCheck,
                title: 'Close more deals',
                desc: 'Unified inbox, follow-up automations, and ROI tracking. All in one place.',
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 100}>
                <SpotlightCard>
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 hover:border-[#E8642C]/20 hover:shadow-lg hover:shadow-[#E8642C]/5 transition-all duration-300">
                    <div className="text-xs font-bold text-[#E8642C]/40 mb-4">{item.step}</div>
                    <div className="w-11 h-11 rounded-xl bg-[#E8642C]/10 flex items-center justify-center mb-5 group-hover:bg-[#E8642C]/15 transition-colors">
                      <item.icon className="w-5 h-5 text-[#E8642C]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#0B1220] mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURES — Spotlight hover glow + staggered whileInView    */}
      {/* ============================================================ */}
      <FeaturesSection />

      {/* ============================================================ */}
      {/*  SOCIAL PROOF — TextGenerateEffect on "5s"                  */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SocialProofStat />

          {/* Testimonials */}
          <Reveal>
            <p className="text-center text-sm font-medium text-[#E8642C] uppercase tracking-widest mb-10">
              What our clients say
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: 'We used to lose half our leads before even seeing them. Now I get a WhatsApp within seconds of someone enquiring. Game changer.',
                name: 'Restaurant Owner',
                role: 'Hospitality',
              },
              {
                quote: 'The AI scoring saves me hours. I know exactly who to call first and who\'s just browsing. My close rate is up 40%.',
                name: 'Estate Agent',
                role: 'Property',
              },
              {
                quote: 'Having everything in one inbox — WhatsApp, Instagram, email — means nothing falls through the cracks anymore.',
                name: 'Clinic Director',
                role: 'Healthcare',
              },
            ].map((testimonial, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-[#E8642C] text-[#E8642C]" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-6 flex-1">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div>
                    <div className="text-sm font-semibold text-[#0B1220]">{testimonial.name}</div>
                    <div className="text-xs text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  PRICING — LampEffect + MovingBorder card                   */}
      {/* ============================================================ */}
      <PricingSection />

      {/* ============================================================ */}
      {/*  FAQ — No change                                            */}
      {/* ============================================================ */}
      <section id="faq" className="py-20 sm:py-28 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-center text-sm font-medium text-[#E8642C] uppercase tracking-widest mb-4">
              FAQ
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-[#0B1220] mb-12">
              Questions? Answered.
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-100 px-6 sm:px-8">
              <FaqItem
                question="How fast are the lead alerts?"
                answer="5 seconds. When a lead fills out a form or comes through an ad, you get a WhatsApp message with their name, number, and what they're looking for. By the time you read it, you can already be calling them."
              />
              <FaqItem
                question="What ad platforms do you integrate with?"
                answer="Meta (Facebook & Instagram), Google Ads, and TikTok. Plus any web form, landing page, or third-party tool that can send a webhook. If it generates leads, we can capture them."
              />
              <FaqItem
                question="Is there a contract?"
                answer="No. It's month-to-month, cancel anytime. We keep clients because the platform works, not because of a contract."
              />
              <FaqItem
                question="How long does it take to set up?"
                answer="You'll be live within 48 hours. We handle the integrations, connect your ad accounts, set up your WhatsApp alerts, and make sure everything is working before we hand it over."
              />
              <FaqItem
                question="What if I need help with ads and content too?"
                answer="That's what :Impact Pro is for. It includes everything in Core plus done-for-you ad management, content creation, and strategy calls. Ask us on your demo call."
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FINAL CTA — MovingBorder on button                         */}
      {/* ============================================================ */}
      <CtaSection />
    </>
  )
}
