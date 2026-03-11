'use client'

import { useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }): React.JSX.Element {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    let frame: number
    const duration = 1500
    const start = performance.now()

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setCount(Math.round(eased * target))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [inView, target])

  return <span ref={ref}>{count}{suffix}</span>
}

export function PainPointStats(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className={`py-20 sm:py-28 border-t transition-colors duration-500 ${
      dark ? 'border-zinc-900' : 'border-gray-200'
    }`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Provocation headline */}
        <FadeIn>
          <h2 className={`font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-4 transition-colors duration-500 ${
            dark ? 'text-white' : 'text-[#0B1220]'
          }`}>
            Your leads are dying while you check email.
          </h2>
          <p className={`text-center text-base sm:text-lg max-w-2xl mx-auto mb-12 transition-colors duration-500 ${
            dark ? 'text-zinc-400' : 'text-gray-600'
          }`}>
            The data is brutal. Speed wins. Everything else is an excuse.
          </p>
        </FadeIn>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <FadeIn delay={0.05}>
            <div className={`rounded-2xl border p-6 text-center transition-colors duration-500 spring-hover ${
              dark ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-200 bg-white shadow-sm'
            }`}>
              <div className={`font-display text-4xl sm:text-5xl font-extrabold text-[#E8642C] mb-2 ${dark ? 'neon-glow' : ''}`}>
                <AnimatedCounter target={47} suffix="h" />
              </div>
              <p className={`text-sm font-medium mb-1 transition-colors duration-500 ${dark ? 'text-white' : 'text-[#0B1220]'}`}>
                Average lead response time
              </p>
              <p className={`text-xs transition-colors duration-500 ${dark ? 'text-zinc-600' : 'text-gray-400'}`}>
                Harvard Business Review
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className={`rounded-2xl border p-6 text-center transition-colors duration-500 spring-hover ${
              dark ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-200 bg-white shadow-sm'
            }`}>
              <div className={`font-display text-4xl sm:text-5xl font-extrabold text-[#E8642C] mb-2 ${dark ? 'neon-glow' : ''}`}>
                <AnimatedCounter target={78} suffix="%" />
              </div>
              <p className={`text-sm font-medium mb-1 transition-colors duration-500 ${dark ? 'text-white' : 'text-[#0B1220]'}`}>
                Buy from whoever responds first
              </p>
              <p className={`text-xs transition-colors duration-500 ${dark ? 'text-zinc-600' : 'text-gray-400'}`}>
                Lead Connect Study
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className={`rounded-2xl border p-6 text-center transition-colors duration-500 spring-hover ${
              dark ? 'border-[#E8642C]/20 bg-[#E8642C]/5' : 'border-[#E8642C]/20 bg-[#E8642C]/5'
            }`}>
              <div className={`font-display text-4xl sm:text-5xl font-extrabold text-[#E8642C] mb-2 ${dark ? 'neon-glow' : ''}`}>
                5s
              </div>
              <p className={`text-sm font-medium mb-1 transition-colors duration-500 ${dark ? 'text-white' : 'text-[#0B1220]'}`}>
                Impact&apos;s response time
              </p>
              <p className="text-xs text-[#E8642C] font-semibold">
                9,400x faster than average
              </p>
            </div>
          </FadeIn>
        </div>

        {/* Live urgency ticker */}
        <FadeIn delay={0.2}>
          <div className="mt-10 text-center">
            <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono transition-colors duration-500 ${
              dark ? 'bg-zinc-900 border border-zinc-800 text-zinc-400' : 'bg-gray-50 border border-gray-200 text-gray-500'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              In the last {seconds}s, roughly {Math.max(1, Math.floor(seconds / 6))} leads went unanswered
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
