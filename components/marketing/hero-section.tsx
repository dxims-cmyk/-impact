'use client'

import Link from 'next/link'
import { ArrowRight, Sun, Moon, MessageSquare, Zap } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { FadeIn } from '@/components/marketing/fade-in'
import { ContainerScrollAnimation } from '@/components/ui/container-scroll-animation'
import { useMarketingTheme } from '@/components/marketing/theme-provider'
import { FluidBackground } from '@/components/marketing/fluid-background'

type Theme = 'light' | 'dark'

const spring = { type: 'spring' as const, stiffness: 400, damping: 17 }

/* ───────── Phone Frame with Animated WhatsApp Notification ───────── */
function PhoneHero({ dark }: { dark: boolean }): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [showNotif, setShowNotif] = useState(false)
  const [showTime, setShowTime] = useState(false)

  useEffect(() => {
    if (!inView) return
    const t1 = setTimeout(() => setShowNotif(true), 800)
    const t2 = setTimeout(() => setShowTime(true), 2000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [inView])

  return (
    <div ref={ref} className="relative">
      {/* Glow behind phone */}
      <div className={`absolute inset-0 scale-110 rounded-full blur-[80px] transition-colors duration-500 ${
        dark ? 'bg-[#E8642C]/[0.06]' : 'bg-[#E8642C]/[0.08]'
      }`} />

      {/* Phone frame */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 8 }}
        animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-[220px] sm:w-[260px] rounded-[2.5rem] border-[3px] p-2 shadow-2xl ${
          dark
            ? 'border-zinc-700 bg-zinc-900 shadow-black/50'
            : 'border-gray-300 bg-gray-100 shadow-gray-300/50'
        }`}
        style={{ perspective: '800px' }}
      >
        {/* Notch */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 rounded-b-2xl z-10 ${
          dark ? 'bg-zinc-800' : 'bg-gray-200'
        }`} />

        {/* Screen */}
        <div className={`rounded-[2rem] overflow-hidden min-h-[360px] sm:min-h-[400px] flex flex-col ${
          dark ? 'bg-zinc-950' : 'bg-white'
        }`}>
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-8 pb-2">
            <span className={`text-[10px] font-semibold ${dark ? 'text-white' : 'text-[#0B1220]'}`}>9:41</span>
            <div className="flex items-center gap-1">
              <div className={`w-3 h-2 rounded-sm ${dark ? 'bg-white' : 'bg-[#0B1220]'}`} />
            </div>
          </div>

          {/* Clock area */}
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className={`text-5xl sm:text-6xl font-extralight tracking-tight mb-1 ${
              dark ? 'text-white' : 'text-[#0B1220]'
            }`}>
              9:41
            </div>
            <div className={`text-[11px] mb-8 ${dark ? 'text-zinc-500' : 'text-gray-400'}`}>
              Tuesday, 11 March
            </div>

            {/* WhatsApp notification */}
            <div className="w-full px-1">
              {showNotif ? (
                <motion.div
                  initial={{ opacity: 0, y: -15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  className={`rounded-2xl p-3 backdrop-blur-md shadow-lg ${
                    dark
                      ? 'bg-zinc-800/90 shadow-black/20'
                      : 'bg-white/90 shadow-gray-200/60 border border-gray-100/80'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold ${dark ? 'text-white' : 'text-[#0B1220]'}`}>
                          Impact Bot
                        </span>
                        <span className={`text-[9px] ${dark ? 'text-zinc-500' : 'text-gray-400'}`}>now</span>
                      </div>
                      <div className={`text-[10px] leading-[1.4] mt-0.5 ${dark ? 'text-zinc-300' : 'text-gray-600'}`}>
                        <span className="font-bold">🔥 New Hot Lead</span>
                        <br />
                        Sarah Mitchell | 07XXX XXX XXX
                        <br />
                        Source: Meta Ads
                        <br />
                        <span className="text-[#E8642C] font-bold">AI Score: 92/100</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-[100px]" /> /* placeholder for layout stability */
              )}
            </div>

            {/* Delivery time badge */}
            {showTime && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-3 py-1.5 rounded-full ${
                  dark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'
                }`}
              >
                <Zap className="w-3 h-3" />
                Delivered in 4.2 seconds
              </motion.div>
            )}
          </div>

          {/* Home indicator */}
          <div className="flex justify-center pb-2 pt-4">
            <div className={`w-28 h-1 rounded-full ${dark ? 'bg-zinc-700' : 'bg-gray-300'}`} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ───────── Living Dashboard Mockup — data animates subtly ───────── */
const kpiData = [
  { label: 'Total Leads', values: ['247', '248', '249', '250'], change: '+12%' },
  { label: 'Cost / Lead', values: ['£18.40', '£18.20', '£18.10', '£17.90'], change: '-8%' },
  { label: 'Booked Calls', values: ['34', '34', '35', '35'], change: '+23%' },
  { label: 'ROAS', values: ['4.2x', '4.2x', '4.3x', '4.3x'], change: '+15%' },
]

const stages = [
  { stage: 'New', count: 24, width: '80%', color: '#6E0F1A' },
  { stage: 'Qualified', count: 18, width: '60%', color: '#8B1422' },
  { stage: 'Contacted', count: 15, width: '50%', color: '#D4A574' },
  { stage: 'Booked', count: 12, width: '40%', color: '#2D4A3E' },
  { stage: 'Won', count: 8, width: '27%', color: '#2D4A3E' },
  { stage: 'Lost', count: 3, width: '10%', color: '#4A3728' },
]

const leads = [
  { initials: 'SM', name: 'Sarah Mitchell', temp: 'Hot' as const, score: 92, summary: 'Interested in premium plan, requested callback' },
  { initials: 'JC', name: 'James Cooper', temp: 'Warm' as const, score: 74, summary: 'Compared pricing, downloaded brochure' },
  { initials: 'EC', name: 'Emily Chen', temp: 'Hot' as const, score: 88, summary: 'Booked demo for Friday, high engagement' },
  { initials: 'MW', name: 'Marcus Williams', temp: 'Cold' as const, score: 31, summary: 'Initial enquiry via Facebook ad' },
]

const tempColors = {
  Hot: { light: 'bg-red-50 text-red-600', dark: 'bg-red-500/20 text-red-400' },
  Warm: { light: 'bg-amber-50 text-amber-600', dark: 'bg-amber-500/20 text-amber-400' },
  Cold: { light: 'bg-blue-50 text-blue-600', dark: 'bg-blue-500/20 text-blue-400' },
}

function DashboardMockup({ mockTheme }: { mockTheme: Theme }): React.JSX.Element {
  const d = mockTheme === 'dark'
  const [tick, setTick] = useState(0)

  // Cycle through KPI values every 3s
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => (t + 1) % 4), 3000)
    return () => clearInterval(interval)
  }, [])

  const kpis = kpiData.map((k) => ({ label: k.label, value: k.values[tick], change: k.change }))

  return (
    <div className={`relative rounded-2xl border overflow-hidden shadow-2xl transition-colors duration-500 full-color ${
      d ? 'border-zinc-800 bg-zinc-900 shadow-black/40' : 'border-gray-200 bg-white shadow-gray-200/60'
    }`}>
      <div className={`flex items-center gap-2 px-4 py-2.5 border-b transition-colors duration-500 ${
        d ? 'border-zinc-800 bg-zinc-900' : 'border-gray-100 bg-gray-50/80'
      }`}>
        <div className={`w-2.5 h-2.5 rounded-full ${d ? 'bg-red-500/60' : 'bg-red-400'}`} />
        <div className={`w-2.5 h-2.5 rounded-full ${d ? 'bg-yellow-500/60' : 'bg-yellow-400'}`} />
        <div className={`w-2.5 h-2.5 rounded-full ${d ? 'bg-green-500/60' : 'bg-green-400'}`} />
        <div className={`ml-3 h-5 w-52 rounded-md flex items-center px-2.5 transition-colors duration-500 ${d ? 'bg-zinc-800' : 'bg-gray-100'}`}>
          <span className={`text-[9px] font-medium ${d ? 'text-zinc-500' : 'text-gray-400'}`}>driveimpact.io/dashboard</span>
        </div>
      </div>
      <div className="flex">
        <div className="hidden sm:flex flex-col items-center w-12 bg-[#0B1220] py-4 gap-3 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#E8642C] flex items-center justify-center mb-1">
            <span className="text-[8px] font-extrabold text-white tracking-tight">IE</span>
          </div>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-white/10' : ''}`}>
              <div className={`w-3.5 h-3.5 rounded ${i === 0 ? 'bg-white/70' : 'bg-white/20'}`} />
            </div>
          ))}
        </div>
        <div className={`flex-1 p-4 sm:p-5 transition-colors duration-500 ${d ? 'bg-zinc-950' : 'bg-[#F8F9FB]'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className={`text-xs font-bold transition-colors duration-500 ${d ? 'text-white' : 'text-[#0B1220]'}`}>Dashboard</div>
              <div className={`text-[9px] transition-colors duration-500 ${d ? 'text-zinc-500' : 'text-gray-400'}`}>Welcome back, Alex</div>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#E8642C]/10 flex items-center justify-center">
              <span className="text-[7px] font-bold text-[#E8642C]">A</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className={`rounded-xl border p-3 shadow-sm transition-colors duration-500 ${d ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'}`}>
                <div className={`text-[9px] font-medium mb-1.5 transition-colors duration-500 ${d ? 'text-zinc-500' : 'text-gray-400'}`}>{kpi.label}</div>
                <motion.div
                  key={kpi.value}
                  initial={{ opacity: 0.6, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={`text-lg font-bold leading-none transition-colors duration-500 ${d ? 'text-white' : 'text-[#0B1220]'}`}
                >{kpi.value}</motion.div>
                <div className="text-[9px] font-medium mt-1 text-green-500">{kpi.change} this month</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            <div className={`sm:col-span-2 rounded-xl border p-3 shadow-sm transition-colors duration-500 ${d ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'}`}>
              <div className={`text-[10px] font-semibold mb-2.5 transition-colors duration-500 ${d ? 'text-white' : 'text-[#0B1220]'}`}>Pipeline</div>
              <div className="space-y-1.5">
                {stages.map((s) => (
                  <div key={s.stage} className="flex items-center gap-1.5">
                    <div className={`text-[8px] w-12 shrink-0 transition-colors duration-500 ${d ? 'text-zinc-500' : 'text-gray-400'}`}>{s.stage}</div>
                    <div className={`flex-1 h-3 rounded-full overflow-hidden transition-colors duration-500 ${d ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                      <div className="h-full rounded-full" style={{ width: s.width, backgroundColor: s.color }} />
                    </div>
                    <div className={`text-[8px] font-semibold w-4 text-right transition-colors duration-500 ${d ? 'text-white' : 'text-[#0B1220]'}`}>{s.count}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={`sm:col-span-3 rounded-xl border p-3 shadow-sm transition-colors duration-500 ${d ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'}`}>
              <div className={`text-[10px] font-semibold mb-2.5 transition-colors duration-500 ${d ? 'text-white' : 'text-[#0B1220]'}`}>Recent Leads</div>
              <div className="space-y-1.5">
                {leads.map((lead) => (
                  <div key={lead.name} className="flex items-center gap-2 py-0.5">
                    <div className="w-5 h-5 rounded-full bg-[#E8642C]/10 flex items-center justify-center shrink-0">
                      <span className="text-[7px] font-bold text-[#E8642C]">{lead.initials}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-semibold truncate transition-colors duration-500 ${d ? 'text-white' : 'text-[#0B1220]'}`}>{lead.name}</span>
                        <span className={`text-[7px] px-1 py-px rounded-full font-medium shrink-0 ${tempColors[lead.temp][mockTheme]}`}>{lead.temp}</span>
                        <span className={`text-[7px] shrink-0 ${d ? 'text-zinc-600' : 'text-gray-300'}`}>AI: {lead.score}%</span>
                      </div>
                      <div className={`text-[8px] truncate transition-colors duration-500 ${d ? 'text-zinc-500' : 'text-gray-400'}`}>{lead.summary}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────── Page entrance stagger ───────── */
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
  const { theme, setTheme } = useMarketingTheme()
  const dark = theme === 'dark'
  const mockTheme: Theme = dark ? 'light' : 'dark'

  return (
    <section className="relative pt-24 sm:pt-32 lg:pt-40 pb-8 sm:pb-16 overflow-hidden">
      {/* Fluid canvas background (Stripe Sessions pattern) */}
      <FluidBackground />
      <div className="absolute inset-0 -z-10">
        <div className={`absolute inset-0 transition-opacity duration-500 ${
          dark ? 'opacity-100' : 'opacity-20'
        }`} style={{
          backgroundImage: `radial-gradient(circle, ${dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Two-column hero: Copy left, Phone right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy — cinematic stagger entrance */}
          <motion.div
            variants={entrance}
            initial="hidden"
            animate="show"
            className="text-center lg:text-left"
          >
            {/* Pill badge */}
            <motion.div variants={entranceChild}>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6 transition-colors duration-500 ${
                dark ? 'bg-zinc-800/80 text-zinc-300' : 'bg-gray-100 text-gray-600'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Now live for service businesses worldwide
              </div>
            </motion.div>

            {/* Outcome headline */}
            <motion.div variants={entranceChild}>
              <h1 className={`font-display text-[2.5rem] sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold leading-[1.05] tracking-tight transition-colors duration-500 ${
                dark ? 'text-white' : 'text-[#0B1220]'
              }`}>
                Every lead.
                <br />
                <span className="text-[#E8642C]">Answered in 5 seconds.</span>
              </h1>
            </motion.div>

            <motion.div variants={entranceChild}>
              <p className={`mt-5 text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0 transition-colors duration-500 ${
                dark ? 'text-zinc-400' : 'text-gray-600'
              }`}>
                WhatsApp alerts the moment a lead comes in. AI scores them instantly.
                One inbox for WhatsApp, SMS, email, Instagram, and Messenger.
              </p>
            </motion.div>

            {/* Stats strip */}
            <motion.div variants={entranceChild}>
              <div className="mt-6 flex items-center justify-center lg:justify-start gap-6">
                {[
                  { value: '40%', label: 'Higher close rate' },
                  { value: '5s', label: 'Response time' },
                  { value: '0', label: 'Leads missed' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left">
                    <div className={`text-xl sm:text-2xl font-bold text-[#E8642C] ${dark ? 'neon-glow' : ''}`}>{stat.value}</div>
                    <div className={`text-[10px] sm:text-xs transition-colors duration-500 ${
                      dark ? 'text-zinc-500' : 'text-gray-500'
                    }`}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Dual CTAs with spring physics */}
            <motion.div variants={entranceChild}>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                >
                  <Link
                    href="/demo"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-[#E8642C] text-white font-semibold text-sm hover:bg-[#d55a25] shadow-lg shadow-[#E8642C]/20 hover:shadow-xl hover:shadow-[#E8642C]/30"
                    style={{ transitionTimingFunction: 'var(--ease-out-spring)' }}
                  >
                    Book a Demo
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
                <motion.a
                  href="#interactive-demo"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                  className={`inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg border font-medium text-sm ${
                    dark
                      ? 'border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-[#0B1220]'
                  }`}
                >
                  Try the Demo
                </motion.a>
              </div>
            </motion.div>

            {/* Theme toggle - small, subtle */}
            <motion.div variants={entranceChild}>
              <div className="mt-6 flex items-center justify-center lg:justify-start">
                <div className={`inline-flex items-center rounded-full p-0.5 transition-colors duration-500 ${
                  dark ? 'bg-zinc-900 border border-zinc-800' : 'bg-gray-100 border border-gray-200'
                }`}>
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-1 px-3 py-1 text-[10px] font-medium rounded-full transition-all duration-300 ${
                      !dark ? 'bg-white text-[#0B1220] shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Sun className="w-2.5 h-2.5" />
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-1 px-3 py-1 text-[10px] font-medium rounded-full transition-all duration-300 ${
                      dark ? 'bg-zinc-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Moon className="w-2.5 h-2.5" />
                    Dark
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Phone with WhatsApp notification */}
          <FadeIn delay={0.15}>
            <div className="flex justify-center lg:justify-end">
              <PhoneHero dark={dark} />
            </div>
          </FadeIn>
        </div>

        {/* Dashboard below with 3D scroll - shows the full product */}
        <FadeIn delay={0.3}>
          <div className="mt-20 sm:mt-28 max-w-5xl mx-auto">
            <ContainerScrollAnimation>
              <DashboardMockup mockTheme={mockTheme} />
              <div className={`absolute -inset-px -z-10 rounded-2xl blur-xl transition-colors duration-500 ${
                dark ? 'bg-gradient-to-b from-[#E8642C]/10 to-transparent' : 'bg-gradient-to-b from-[#E8642C]/5 to-transparent'
              }`} />
            </ContainerScrollAnimation>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
