'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

const testimonials = [
  {
    quote: "We used to lose half our leads before even seeing them. Now I get a WhatsApp within seconds of someone enquiring. Game changer.",
    role: 'Restaurant Owner',
    industry: 'Hospitality',
    metric: '47h → 5s',
    metricLabel: 'Response time',
  },
  {
    quote: "The AI scoring saves me hours. I know exactly who to call first and who's just browsing. My close rate is up 40%.",
    role: 'Estate Agent',
    industry: 'Property',
    metric: '+40%',
    metricLabel: 'Close rate',
  },
  {
    quote: "Having everything in one inbox, WhatsApp, Instagram, email, means nothing falls through the cracks anymore.",
    role: 'Clinic Director',
    industry: 'Healthcare',
    metric: '0',
    metricLabel: 'Leads missed',
  },
]

export function TestimonialsSection(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'
  const [active, setActive] = useState(0)
  const [direction, setDirection] = useState(0)

  const next = useCallback(() => {
    setDirection(1)
    setActive((i) => (i + 1) % testimonials.length)
  }, [])

  const prev = useCallback(() => {
    setDirection(-1)
    setActive((i) => (i - 1 + testimonials.length) % testimonials.length)
  }, [])

  // Auto-advance every 6s
  useEffect(() => {
    const timer = setInterval(next, 6000)
    return () => clearInterval(timer)
  }, [next])

  const t = testimonials[active]

  return (
    <section className={`py-20 sm:py-28 transition-colors duration-700 ${
      dark ? 'bg-[#0A0A0A]' : 'bg-[#FAFAF8]'
    }`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <p className={`text-sm font-medium uppercase tracking-widest mb-4 transition-colors duration-700 ${
              dark ? 'text-zinc-500' : 'text-gray-500'
            }`}>
              Results, not promises
            </p>
            <h2 className={`font-display text-3xl sm:text-4xl font-bold transition-colors duration-700 ${
              dark ? 'text-white' : 'text-[#0B1220]'
            }`}>
              The numbers speak louder
            </h2>
          </div>
        </FadeIn>

        {/* Single testimonial card with animation */}
        <div className="relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={active}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`rounded-2xl border p-8 sm:p-10 transition-colors duration-700 ${
                dark ? 'border-zinc-800 bg-zinc-900/40' : 'border-gray-200 bg-white shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                {/* Metric highlight */}
                <div className={`shrink-0 w-full sm:w-36 text-center sm:text-left rounded-xl p-5 transition-colors duration-700 ${
                  dark ? 'bg-[#6E0F1A]/5 border border-[#6E0F1A]/20' : 'bg-[#6E0F1A]/5 border border-[#6E0F1A]/10'
                }`}>
                  <div className="font-display text-3xl sm:text-4xl font-extrabold text-[#6E0F1A]">
                    {t.metric}
                  </div>
                  <div className={`text-xs mt-1 font-medium transition-colors duration-700 ${
                    dark ? 'text-zinc-400' : 'text-gray-500'
                  }`}>
                    {t.metricLabel}
                  </div>
                </div>

                {/* Quote */}
                <div className="flex-1">
                  <Quote className={`w-6 h-6 mb-4 transition-colors duration-700 ${
                    dark ? 'text-zinc-700' : 'text-gray-300'
                  }`} />
                  <blockquote className={`text-lg sm:text-xl leading-relaxed font-medium mb-6 transition-colors duration-700 ${
                    dark ? 'text-zinc-200' : 'text-gray-800'
                  }`}>
                    {t.quote}
                  </blockquote>
                  <div className={`pt-4 border-t transition-colors duration-700 ${
                    dark ? 'border-zinc-800' : 'border-gray-100'
                  }`}>
                    <div className={`text-sm font-semibold transition-colors duration-700 ${
                      dark ? 'text-white' : 'text-[#0B1220]'
                    }`}>
                      {t.role}
                    </div>
                    <div className={`text-xs transition-colors duration-700 ${
                      dark ? 'text-zinc-500' : 'text-gray-500'
                    }`}>
                      {t.industry}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all spring-hover ${
                dark
                  ? 'border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white'
                  : 'border-gray-200 hover:border-gray-400 text-gray-400 hover:text-gray-700'
              }`}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > active ? 1 : -1); setActive(i) }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === active
                      ? 'w-6 bg-[#6E0F1A]'
                      : `w-1.5 ${dark ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-gray-300 hover:bg-gray-400'}`
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all spring-hover ${
                dark
                  ? 'border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white'
                  : 'border-gray-200 hover:border-gray-400 text-gray-400 hover:text-gray-700'
              }`}
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
