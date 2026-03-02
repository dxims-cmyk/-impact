'use client'

import React from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'

export function TextGenerateEffect({
  text,
  className,
  staggerDelay = 0.05,
}: {
  text: string
  className?: string
  staggerDelay?: number
}): React.JSX.Element {
  const ref = React.useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  const chars = text.split('')

  return (
    <span ref={ref} className={cn('inline-block', className)}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={
            isInView
              ? { opacity: 1, filter: 'blur(0px)' }
              : { opacity: 0, filter: 'blur(8px)' }
          }
          transition={{
            duration: 0.3,
            delay: i * staggerDelay,
            ease: 'easeOut',
          }}
          className="inline-block motion-reduce:!opacity-100 motion-reduce:!filter-none"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  )
}
