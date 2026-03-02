'use client'

import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

export function ContainerScrollAnimation({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    // 'start 80%' = element top hits 80% of viewport (visible on load)
    // 'start 10%' = element top hits 10% of viewport (scrolled well past)
    offset: ['start 80%', 'start 10%'],
  })

  // Starts tilted at 20deg, flattens to 0 as user scrolls
  const rotateX = useTransform(scrollYProgress, [0, 1], [20, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1.02])
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0.7, 1])

  return (
    <div
      ref={containerRef}
      className={cn('perspective-1060', className)}
    >
      <motion.div
        style={{
          rotateX,
          scale,
          opacity,
          transformOrigin: 'center bottom',
        }}
        className="will-change-transform motion-reduce:!transform-none motion-reduce:!opacity-100"
      >
        {children}
      </motion.div>
    </div>
  )
}
