'use client'

import { cn } from '@/lib/utils'
import { useMotionValue, motion, useMotionTemplate } from 'framer-motion'
import React from 'react'

export function HeroHighlight({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode
  className?: string
  containerClassName?: string
}): React.JSX.Element {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    if (!currentTarget) return
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div
      className={cn('relative group', containerClassName)}
      onMouseMove={handleMouseMove}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-dot-thick-neutral-800 [mask-image:radial-gradient(200px_at_center,white,transparent)]" />
      </div>
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              250px circle at ${mouseX}px ${mouseY}px,
              rgba(232, 100, 44, 0.08),
              transparent 80%
            )
          `,
        }}
      />
      <div className={cn('relative z-20', className)}>{children}</div>
    </div>
  )
}

export function Highlight({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <motion.span
      initial={{ backgroundSize: '0% 100%' }}
      whileInView={{ backgroundSize: '100% 100%' }}
      viewport={{ once: true }}
      transition={{
        duration: 0.7,
        ease: 'easeOut',
        delay: 0.3,
      }}
      style={{
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'left center',
        display: 'inline',
      }}
      className={cn(
        'relative inline-block rounded-sm px-1 py-0.5',
        'bg-gradient-to-r from-[#E8642C]/20 to-[#E8642C]/10',
        className
      )}
    >
      {children}
    </motion.span>
  )
}
