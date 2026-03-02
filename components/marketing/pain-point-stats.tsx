'use client'

import { Clock, Trophy, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'

const painPoints = [
  {
    icon: Clock,
    stat: '47 hours',
    label: 'Average response time to a new lead',
    desc: "By the time you follow up, they've already moved on.",
  },
  {
    icon: Trophy,
    stat: '78%',
    label: 'Of customers buy from whoever responds first',
    desc: "Speed isn't a nice-to-have. It's the entire game.",
  },
  {
    icon: AlertTriangle,
    stat: 'Thousands',
    label: 'Spent on ads with leads slipping through',
    desc: "You're paying to generate demand, then losing it in your inbox.",
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
}

export function PainPointStats(): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
      {painPoints.map((item, i) => (
        <motion.div
          key={i}
          custom={i}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={cardVariants}
          className="text-center sm:text-left"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#E8642C]/15 mb-5">
            <item.icon className="w-6 h-6 text-[#E8642C]" />
          </div>
          <div className="text-4xl sm:text-5xl font-extrabold text-white mb-2">
            <TextGenerateEffect text={item.stat} staggerDelay={0.06} />
          </div>
          <div className="text-base font-semibold text-gray-300 mb-2">{item.label}</div>
          <p className="text-sm text-gray-500">{item.desc}</p>
        </motion.div>
      ))}
    </div>
  )
}
