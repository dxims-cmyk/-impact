'use client'

import Link from 'next/link'
import { ArrowRight, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { MovingBorder } from '@/components/ui/moving-border'

export function CtaSection(): React.JSX.Element {
  return (
    <section className="py-20 sm:py-28 bg-[#0B1220] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Ready to Stop{' '}
            <span className="text-[#E8642C]">Losing Leads</span>?
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto mb-10">
            Book a 15-minute demo. See exactly how :Impact works for your business.
            No pressure, no pitch decks.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <MovingBorder
              containerClassName="w-full sm:w-auto"
              className="bg-[#E8642C] hover:bg-[#d55a25] transition-colors"
              duration={3000}
            >
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 text-white font-semibold text-base w-full"
              >
                Book Your Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </MovingBorder>
            <a
              href="mailto:hello@mediampm.com"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/20 text-white font-medium text-base hover:bg-white/5 transition-all"
            >
              <Mail className="w-4 h-4" />
              Get in Touch
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
