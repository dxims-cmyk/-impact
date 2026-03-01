import Link from 'next/link'
import {
  Zap,
  Brain,
  MessageSquare,
  CalendarCheck,
  Settings,
  BarChart3,
  ArrowRight,
  Clock,
  Trophy,
  AlertTriangle,
  Star,
  Check,
  Smartphone,
  Mail,
  Target,
  Sparkles,
} from 'lucide-react'
import { Reveal } from '@/components/marketing/reveal'
import { FaqItem } from '@/components/marketing/faq-item'

/* ================================================================== */
/*  LANDING PAGE (Server Component for SEO)                            */
/* ================================================================== */
export default function LandingPage() {
  return (
    <>
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section className="relative pt-28 sm:pt-36 lg:pt-44 pb-20 sm:pb-28 overflow-hidden">
        {/* Subtle background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#E8642C]/[0.04] rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#0B1220]/[0.03] rounded-full blur-[100px] -translate-x-1/3 translate-y-1/4" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8642C]/10 text-[#E8642C] text-xs font-medium mb-6 sm:mb-8">
                <Sparkles className="w-3.5 h-3.5" />
                Lead management that actually works
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-extrabold text-[#0B1220] leading-[1.1] tracking-tight mb-6">
                Stop Losing the Leads{' '}
                <span className="text-[#E8642C]">You Paid For</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10">
                WhatsApp alerts in 5 seconds. AI lead scoring. One inbox for everything.
                Turn your ad spend into booked appointments.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#E8642C] text-white font-semibold text-base hover:bg-[#d55a25] transition-all shadow-lg shadow-[#E8642C]/20 hover:shadow-xl hover:shadow-[#E8642C]/25 hover:-translate-y-0.5"
                >
                  Book a Demo
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-gray-200 text-[#0B1220] font-medium text-base hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  See How It Works
                </a>
              </div>
            </Reveal>
          </div>

          {/* Dashboard preview placeholder */}
          <Reveal delay={350}>
            <div className="mt-16 sm:mt-20 max-w-5xl mx-auto">
              <div className="relative rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white shadow-2xl shadow-gray-200/60 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="relative p-6 sm:p-10">
                  {/* Mock dashboard elements */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <div className="ml-4 h-5 w-48 rounded bg-gray-200" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {['New Leads', 'Contacted', 'Booked', 'Won'].map((label) => (
                      <div key={label} className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                        <div className="text-xs text-gray-400 mb-1">{label}</div>
                        <div className="text-2xl font-bold text-[#0B1220]">
                          {label === 'New Leads' ? '24' : label === 'Contacted' ? '18' : label === 'Booked' ? '12' : '8'}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-[#E8642C]/10" />
                          <div className="h-3 w-24 rounded bg-gray-100" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 w-full rounded bg-gray-100" />
                          <div className="h-2 w-3/4 rounded bg-gray-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  PAIN POINTS                                                 */}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: Clock,
                stat: '47 hours',
                label: 'Average response time to a new lead',
                desc: 'By the time you follow up, they\'ve already moved on.',
              },
              {
                icon: Trophy,
                stat: '78%',
                label: 'Of customers buy from whoever responds first',
                desc: 'Speed isn\'t a nice-to-have. It\'s the entire game.',
              },
              {
                icon: AlertTriangle,
                stat: 'Thousands',
                label: 'Spent on ads with leads slipping through',
                desc: 'You\'re paying to generate demand, then losing it in your inbox.',
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="text-center sm:text-left">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#E8642C]/15 mb-5">
                    <item.icon className="w-6 h-6 text-[#E8642C]" />
                  </div>
                  <div className="text-4xl sm:text-5xl font-extrabold text-white mb-2">{item.stat}</div>
                  <div className="text-base font-semibold text-gray-300 mb-2">{item.label}</div>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  HOW IT WORKS                                                */}
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
                <div className="relative group">
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 hover:border-[#E8642C]/20 hover:shadow-lg hover:shadow-[#E8642C]/5 transition-all duration-300">
                    <div className="text-xs font-bold text-[#E8642C]/40 mb-4">{item.step}</div>
                    <div className="w-11 h-11 rounded-xl bg-[#E8642C]/10 flex items-center justify-center mb-5 group-hover:bg-[#E8642C]/15 transition-colors">
                      <item.icon className="w-5 h-5 text-[#E8642C]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#0B1220] mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURES                                                    */}
      {/* ============================================================ */}
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
            {[
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
            ].map((feature, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 hover:shadow-lg hover:border-gray-200 transition-all duration-300 h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.accent} flex items-center justify-center mb-5`}>
                    <feature.icon className="w-5 h-5 text-[#0B1220]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#0B1220] mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SOCIAL PROOF                                                */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Key stat */}
          <Reveal>
            <div className="text-center mb-16 sm:mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium mb-6">
                <BarChart3 className="w-3.5 h-3.5" />
                Real results
              </div>
              <div className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[#0B1220] mb-3">
                5<span className="text-[#E8642C]">s</span>
              </div>
              <p className="text-lg sm:text-xl text-gray-600 max-w-lg mx-auto">
                average speed to lead — from enquiry to WhatsApp alert on your phone
              </p>
            </div>
          </Reveal>

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
      {/*  PRICING                                                     */}
      {/* ============================================================ */}
      <section id="pricing" className="py-20 sm:py-28 bg-gray-50/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-center text-sm font-medium text-[#E8642C] uppercase tracking-widest mb-4">
              Pricing
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-[#0B1220] mb-6 leading-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-center text-gray-600 text-lg max-w-xl mx-auto mb-16">
              One plan. Everything included. No hidden fees.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="max-w-lg mx-auto">
              <div className="relative rounded-2xl border-2 border-[#E8642C]/20 bg-white p-8 sm:p-10 shadow-xl shadow-[#E8642C]/5">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex px-4 py-1 rounded-full bg-[#E8642C] text-white text-xs font-semibold">
                    Most Popular
                  </span>
                </div>

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-[#0B1220] mb-2">
                    <span className="text-[#E8642C]">:</span>Impact Core
                  </h3>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-5xl sm:text-6xl font-extrabold text-[#0B1220]">&pound;1,500</span>
                    <span className="text-gray-500 text-base">/month</span>
                  </div>
                  <p className="text-gray-600 text-sm">Everything you need to capture and convert leads</p>
                </div>

                <ul className="space-y-3.5 mb-10">
                  {[
                    'Instant WhatsApp alerts',
                    'AI lead scoring & qualification',
                    'Unified inbox (5 channels)',
                    'Calendar sync & booking',
                    'Follow-up automations',
                    'Reports & analytics',
                    'Meta & Google Ads integration',
                    'Dedicated onboarding',
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#E8642C] shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/demo"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-[#E8642C] text-white font-semibold hover:bg-[#d55a25] transition-all shadow-lg shadow-[#E8642C]/20"
                >
                  Book a Demo
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <p className="text-center text-xs text-gray-500 mt-5">
                  Monthly. Cancel anytime. No setup fees.
                </p>
              </div>

              <p className="text-center text-sm text-gray-500 mt-6">
                Need done-for-you ads + content?{' '}
                <Link href="/demo" className="text-[#E8642C] font-medium hover:underline">
                  Ask about :Impact Pro
                </Link>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FAQ                                                         */}
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
      {/*  FINAL CTA                                                   */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-28 bg-[#0B1220] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Ready to Stop{' '}
              <span className="text-[#E8642C]">Losing Leads</span>?
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto mb-10">
              Book a 15-minute demo. See exactly how :Impact works for your business.
              No pressure, no pitch decks.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full bg-[#E8642C] text-white font-semibold text-base hover:bg-[#d55a25] transition-all shadow-lg shadow-[#E8642C]/25 hover:shadow-xl hover:-translate-y-0.5"
              >
                Book Your Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="mailto:hello@mediampm.com"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/20 text-white font-medium text-base hover:bg-white/5 transition-all"
              >
                <Mail className="w-4 h-4" />
                Get in Touch
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
