'use client'

import { useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

function WhatsAppIcon(): React.JSX.Element {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  )
}

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
      const eased = 1 - Math.pow(1 - progress, 3)
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
    <section className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Provocation headline */}
        <FadeIn>
          <h2 className={`font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-4 transition-colors duration-500 ${
            dark ? 'text-white' : 'text-[#0B1220]'
          }`}>
            The maths behind every missed lead.
          </h2>
          <p className={`text-center text-base sm:text-lg max-w-2xl mx-auto mb-16 transition-colors duration-500 ${
            dark ? 'text-zinc-400' : 'text-gray-600'
          }`}>
            Speed is not a nice-to-have. It is the difference between winning and losing the deal.
          </p>
        </FadeIn>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FadeIn delay={0.05}>
            <div className={`rounded-2xl border p-8 text-center transition-colors duration-500 spring-hover ${
              dark ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-200 bg-white shadow-sm'
            }`}>
              <div className={`font-display text-5xl sm:text-6xl font-extrabold text-[#6E0F1A] mb-3 ${dark ? 'neon-glow' : ''}`}>
                <AnimatedCounter target={47} suffix="h" />
              </div>
              <p className={`text-base font-semibold mb-1 transition-colors duration-500 ${dark ? 'text-white' : 'text-[#0B1220]'}`}>
                Average lead response time
              </p>
              <p className={`text-xs transition-colors duration-500 ${dark ? 'text-zinc-600' : 'text-gray-400'}`}>
                Harvard Business Review
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className={`rounded-2xl border p-8 text-center transition-colors duration-500 spring-hover ${
              dark ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-200 bg-white shadow-sm'
            }`}>
              <div className={`font-display text-5xl sm:text-6xl font-extrabold text-[#6E0F1A] mb-3 ${dark ? 'neon-glow' : ''}`}>
                <AnimatedCounter target={78} suffix="%" />
              </div>
              <p className={`text-base font-semibold mb-1 transition-colors duration-500 ${dark ? 'text-white' : 'text-[#0B1220]'}`}>
                Buy from whoever responds first
              </p>
              <p className={`text-xs transition-colors duration-500 ${dark ? 'text-zinc-600' : 'text-gray-400'}`}>
                Lead Connect Study
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className={`relative rounded-2xl border-2 p-8 text-center transition-colors duration-500 spring-hover overflow-hidden ${
              dark ? 'border-[#6E0F1A]/30 bg-[#6E0F1A]/5' : 'border-[#6E0F1A]/20 bg-[#6E0F1A]/5'
            }`}>
              {/* Subtle radial glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#6E0F1A]/10 via-transparent to-[#6E0F1A]/5 pointer-events-none" />
              <div className="relative">
                <div className="flex justify-center mb-3">
                  <WhatsAppIcon />
                </div>
                <div className={`font-display text-5xl sm:text-6xl font-extrabold text-[#6E0F1A] mb-3 ${dark ? 'neon-glow' : ''}`}>
                  5s
                </div>
                <p className={`text-base font-semibold mb-1 transition-colors duration-500 ${dark ? 'text-white' : 'text-[#0B1220]'}`}>
                  Impact alerts you on WhatsApp
                </p>
                <p className="text-sm text-[#6E0F1A] font-bold mt-2">
                  That is 33,840x faster.
                </p>
              </div>
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
              In the last {seconds}s, roughly {Math.max(1, Math.floor(seconds / 6))} leads went unanswered across the UK
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
