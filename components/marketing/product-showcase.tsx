'use client'

import Image from 'next/image'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plug, Zap, Target } from 'lucide-react'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

const steps = [
  {
    id: 'connect',
    icon: Plug,
    label: 'Connect',
    title: 'Link your ad accounts. We handle the rest.',
    description: 'Connect your Meta Ads in one click. We set up your lead capture, configure your inbox channels, and get you live within 48 hours.',
    screenshot: '/screenshots/integrations.png',
    alt: 'Integrations page showing Meta Ads, WhatsApp, Cal.com, and more connected',
  },
  {
    id: 'alert',
    icon: Zap,
    label: 'Alert',
    title: 'Every lead scored by AI. Sent to your phone in 5 seconds.',
    description: 'When a lead comes in, AI reads it, scores it 1 to 10, and classifies it as hot, warm, or cold. You get a WhatsApp message with the lead details before your competitor even knows they enquired.',
    screenshot: '/screenshots/lead-detail.png',
    alt: 'Lead detail view showing AI score, qualification summary, and contact info',
  },
  {
    id: 'close',
    icon: Target,
    label: 'Close',
    title: 'Pick up the phone. Close the deal.',
    description: 'Speed wins. You get the lead alert, you call them. That\'s how deals close — a real conversation within seconds. With the AI Receptionist add-on, a voice AI can call the lead in 30 seconds, vet them, then transfer them live to your phone or book a meeting on your behalf.',
    screenshot: '/screenshots/dashboard-main.png',
    alt: 'Impact dashboard with pipeline stages, KPIs, recent leads, and campaign analytics',
  },
]

export function ProductShowcase(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'
  const [activeStep, setActiveStep] = useState(0)
  const step = steps[activeStep]

  return (
    <section id="how-it-works" className={`py-20 sm:py-28 transition-colors duration-700 ${
      dark ? 'bg-[#0A0A0A]' : 'bg-[#FAFAF8]'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <p className={`text-sm font-medium uppercase tracking-widest mb-4 transition-colors duration-700 ${
              dark ? 'text-zinc-500' : 'text-gray-500'
            }`}>
              How it works
            </p>
            <h2 className={`font-display text-3xl sm:text-4xl font-bold transition-colors duration-700 ${
              dark ? 'text-white' : 'text-[#0B1220]'
            }`}>
              Three steps. Zero leads lost.
            </h2>
          </div>
        </FadeIn>

        {/* Step tabs */}
        <FadeIn delay={0.1}>
          <div className="flex justify-center mb-10">
            <div className={`inline-flex rounded-xl p-1 transition-colors duration-500 ${
              dark ? 'bg-zinc-900 border border-zinc-800' : 'bg-gray-100 border border-gray-200'
            }`}>
              {steps.map((s, i) => {
                const Icon = s.icon
                const active = i === activeStep
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveStep(i)}
                    className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      active
                        ? dark
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'bg-white text-[#0B1220] shadow-sm'
                        : dark
                          ? 'text-zinc-500 hover:text-zinc-300'
                          : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-[#6E0F1A]' : ''}`} />
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </FadeIn>

        {/* Content area */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
          {/* Left: Copy */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step number */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#6E0F1A]/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#6E0F1A]">{activeStep + 1}</span>
                  </div>
                  <div className={`text-xs font-medium uppercase tracking-wider transition-colors ${
                    dark ? 'text-zinc-500' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </div>
                </div>

                <h3 className={`font-display text-2xl sm:text-3xl font-bold mb-4 leading-tight transition-colors ${
                  dark ? 'text-white' : 'text-[#0B1220]'
                }`}>
                  {step.title}
                </h3>

                <p className={`text-base leading-relaxed transition-colors ${
                  dark ? 'text-zinc-400' : 'text-gray-600'
                }`}>
                  {step.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Screenshot */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35 }}
                className={`relative rounded-2xl border overflow-hidden shadow-xl transition-colors duration-500 ${
                  dark ? 'border-zinc-800 shadow-black/30' : 'border-gray-200 shadow-gray-200/60'
                }`}
              >
                {/* Mini browser chrome */}
                <div className={`flex items-center gap-1.5 px-3 py-2 border-b transition-colors duration-500 ${
                  dark ? 'border-zinc-800 bg-zinc-900' : 'border-gray-100 bg-gray-50/80'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${dark ? 'bg-red-500/50' : 'bg-red-400'}`} />
                  <div className={`w-2 h-2 rounded-full ${dark ? 'bg-yellow-500/50' : 'bg-yellow-400'}`} />
                  <div className={`w-2 h-2 rounded-full ${dark ? 'bg-green-500/50' : 'bg-green-400'}`} />
                </div>
                <Image
                  src={step.screenshot}
                  alt={step.alt}
                  width={1400}
                  height={900}
                  className="w-full h-auto"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
