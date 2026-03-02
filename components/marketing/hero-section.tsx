'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { ContainerScrollAnimation } from '@/components/ui/container-scroll-animation'

const stagger = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
}

export function HeroSection(): React.JSX.Element {
  return (
    <section className="relative pt-28 sm:pt-36 lg:pt-44 pb-20 sm:pb-28 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#E8642C]/[0.04] rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#0B1220]/[0.03] rounded-full blur-[100px] -translate-x-1/3 translate-y-1/4" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8642C]/10 text-[#E8642C] text-xs font-medium mb-6 sm:mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              Lead management that actually works
            </div>
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-extrabold text-[#0B1220] leading-[1.1] tracking-tight mb-6"
          >
            Stop Losing the Leads{' '}
            <span className="text-[#E8642C]">You Paid For</span>
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10"
          >
            WhatsApp alerts in 5 seconds. AI lead scoring. One inbox for everything.
            Turn your ad spend into booked appointments.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
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
          </motion.div>
        </div>

        {/* Dashboard preview with 3D scroll */}
        <motion.div
          custom={4}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="mt-16 sm:mt-20 max-w-5xl mx-auto"
        >
          <ContainerScrollAnimation>
            <div className="relative rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white shadow-2xl shadow-gray-200/60 overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:24px_24px]" />
              <div className="relative p-6 sm:p-10">
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
          </ContainerScrollAnimation>
        </motion.div>
      </div>
    </section>
  )
}
