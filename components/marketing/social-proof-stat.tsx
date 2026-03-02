'use client'

import { BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'

export function SocialProofStat(): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="text-center mb-16 sm:mb-20"
    >
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium mb-6">
        <BarChart3 className="w-3.5 h-3.5" />
        Real results
      </div>
      <div className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[#0B1220] mb-3">
        <TextGenerateEffect text="5" staggerDelay={0.08} className="text-[#0B1220]" />
        <span className="text-[#E8642C]">s</span>
      </div>
      <p className="text-lg sm:text-xl text-gray-600 max-w-lg mx-auto">
        average speed to lead — from enquiry to WhatsApp alert on your phone
      </p>
    </motion.div>
  )
}
