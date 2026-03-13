'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'
import { FluidBackground } from '@/components/marketing/fluid-background'

const spring = { type: 'spring' as const, stiffness: 400, damping: 17 }

/* ───────── Phone Frame ───────── */
function PhoneHero({ dark }: { dark: boolean }): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <div ref={ref} className="relative">
      {/* Glow */}
      <div className={`absolute inset-0 scale-125 rounded-full blur-[100px] transition-colors duration-500 ${
        dark ? 'bg-[#6E0F1A]/[0.08]' : 'bg-[#6E0F1A]/[0.10]'
      }`} />

      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 8 }}
        animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
        style={{ perspective: '800px' }}
      >
        <div className={`relative rounded-[2.8rem] border-[5px] shadow-2xl ${
          dark
            ? 'border-zinc-800 bg-black shadow-black/60'
            : 'border-gray-900 bg-black shadow-gray-400/50'
        }`}>
          {/* Dynamic Island */}
          <div className="absolute top-[6px] left-1/2 -translate-x-1/2 z-10 w-[72px] h-[22px] bg-black rounded-full" />

          {/* Screenshot */}
          <div className="rounded-[2.3rem] overflow-hidden">
            <Image
              src="/screenshots/whatsapp-notifications-cropped.png"
              alt="Real WhatsApp notifications showing new lead alerts from Impact"
              width={1320}
              height={2868}
              className="w-full h-auto block"
              priority
            />
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-[5px] left-1/2 -translate-x-1/2 z-10 w-[80px] h-[3px] bg-white/30 rounded-full" />
        </div>
      </motion.div>
    </div>
  )
}

/* ───────── Entrance animations ───────── */
const entrance = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}
const entranceChild = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
}

/* ───────── Main Hero Section ───────── */
export function HeroSection(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'

  return (
    <section className="relative pt-28 sm:pt-36 lg:pt-44 pb-12 sm:pb-20 overflow-hidden">
      <FluidBackground />
      <div className="absolute inset-0 -z-10">
        <div className={`absolute inset-0 transition-opacity duration-500 ${
          dark ? 'opacity-100' : 'opacity-20'
        }`} style={{
          backgroundImage: `radial-gradient(circle, ${dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Golden ratio grid: ~61.8% copy / ~38.2% phone */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 lg:gap-16 items-center">
          {/* Left: Copy — golden ratio dominant side */}
          <motion.div
            variants={entrance}
            initial="hidden"
            animate="show"
            className="text-center lg:text-left"
          >
            <motion.div variants={entranceChild}>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8 transition-colors duration-500 ${
                dark ? 'bg-zinc-800/80 text-zinc-300' : 'bg-gray-100 text-gray-600'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#6E0F1A] animate-pulse" />
                Early access. Limited spots.
              </div>
            </motion.div>

            <motion.div variants={entranceChild}>
              <h1 className={`font-display text-4xl sm:text-5xl lg:text-[3.25rem] xl:text-[3.75rem] font-extrabold leading-[1.08] tracking-tight transition-colors duration-500 ${
                dark ? 'text-white' : 'text-[#0B1220]'
              }`}>
                Your leads go cold
                <br />
                in 5 minutes.
                <br />
                <span className="text-[#6E0F1A]">Impact responds in 5 seconds.</span>
              </h1>
            </motion.div>

            <motion.div variants={entranceChild}>
              <p className={`mt-6 text-base sm:text-lg leading-relaxed max-w-md mx-auto lg:mx-0 transition-colors duration-500 ${
                dark ? 'text-zinc-400' : 'text-gray-600'
              }`}>
                AI lead management for service businesses running Meta Ads.
                Every lead captured, scored, and sent to your WhatsApp before your competitor checks their email.
              </p>
            </motion.div>

            {/* Stats strip */}
            <motion.div variants={entranceChild}>
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-8">
                {[
                  { value: '5s', label: 'WhatsApp alert' },
                  { value: '1-10', label: 'AI lead score' },
                  { value: '5', label: 'Channels, one inbox' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left">
                    <div className={`text-2xl sm:text-3xl font-bold text-[#6E0F1A] ${dark ? 'neon-glow' : ''}`}>{stat.value}</div>
                    <div className={`text-[11px] sm:text-xs transition-colors duration-500 ${
                      dark ? 'text-zinc-500' : 'text-gray-500'
                    }`}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Dual CTA */}
            <motion.div variants={entranceChild}>
              <div className="mt-10 flex items-center justify-center lg:justify-start gap-4">
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                >
                  <Link
                    href="/demo"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-[#6E0F1A] text-white font-semibold text-sm hover:bg-[#8B1422] shadow-lg shadow-[#6E0F1A]/20 hover:shadow-xl hover:shadow-[#6E0F1A]/30"
                    style={{ transitionTimingFunction: 'var(--ease-out-spring)' }}
                  >
                    Get Early Access
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
                <a
                  href="#how-it-works"
                  className={`inline-flex items-center gap-1.5 px-4 py-4 text-sm font-medium transition-colors duration-300 ${
                    dark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-[#0B1220]'
                  }`}
                >
                  See How It Works
                  <ChevronDown className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Phone — golden ratio minor side, height-constrained */}
          <FadeIn delay={0.15}>
            <div className="flex justify-center lg:justify-end">
              <div className="w-[240px] sm:w-[260px] lg:w-[280px]">
                <PhoneHero dark={dark} />
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Dashboard screenshot */}
        <FadeIn delay={0.3}>
          <div className="mt-24 sm:mt-32">
            <div className={`relative rounded-2xl border overflow-hidden shadow-2xl transition-colors duration-500 ${
              dark ? 'border-zinc-800 shadow-black/40' : 'border-gray-200 shadow-gray-300/40'
            }`}>
              {/* Browser chrome */}
              <div className={`flex items-center gap-2 px-4 py-2.5 border-b transition-colors duration-500 ${
                dark ? 'border-zinc-800 bg-zinc-900' : 'border-gray-100 bg-gray-50/80'
              }`}>
                <div className={`w-2.5 h-2.5 rounded-full ${dark ? 'bg-red-500/60' : 'bg-red-400'}`} />
                <div className={`w-2.5 h-2.5 rounded-full ${dark ? 'bg-yellow-500/60' : 'bg-yellow-400'}`} />
                <div className={`w-2.5 h-2.5 rounded-full ${dark ? 'bg-green-500/60' : 'bg-green-400'}`} />
                <div className={`ml-3 h-5 flex-1 max-w-xs rounded-md flex items-center px-2.5 transition-colors duration-500 ${
                  dark ? 'bg-zinc-800' : 'bg-gray-100'
                }`}>
                  <span className={`text-[9px] font-medium ${dark ? 'text-zinc-500' : 'text-gray-400'}`}>driveimpact.io/dashboard</span>
                </div>
              </div>
              <Image
                src="/screenshots/dashboard-main.png"
                alt="Impact dashboard showing lead pipeline, KPIs, AI insights, and recent leads"
                width={1400}
                height={900}
                className="w-full h-auto"
                priority
              />
              {/* Glow */}
              <div className={`absolute -inset-px -z-10 rounded-2xl blur-xl transition-colors duration-500 ${
                dark ? 'bg-gradient-to-b from-[#6E0F1A]/10 to-transparent' : 'bg-gradient-to-b from-[#6E0F1A]/5 to-transparent'
              }`} />
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
