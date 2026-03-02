'use client'

import React from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'

export function LampEffect({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  const ref = React.useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <div
      ref={ref}
      className={cn('relative overflow-hidden bg-[#0B1220]', className)}
    >
      {/* Lamp beams */}
      <div className="absolute inset-0 flex items-end justify-center motion-reduce:hidden">
        <motion.div
          initial={{ opacity: 0, width: '15rem' }}
          animate={isInView ? { opacity: 1, width: '30rem' } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="h-[60%] sm:h-[70%]"
          style={{
            background:
              'conic-gradient(from 270deg at 50% 100%, transparent 30%, rgba(232,100,44,0.12) 45%, rgba(232,100,44,0.2) 50%, rgba(232,100,44,0.12) 55%, transparent 70%)',
          }}
        />
      </div>

      {/* Glow at the base */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 motion-reduce:hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
          className="w-[400px] sm:w-[600px] h-[200px] sm:h-[300px] rounded-full blur-[80px] sm:blur-[120px]"
          style={{
            background: 'radial-gradient(ellipse, rgba(232,100,44,0.15), transparent 70%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
