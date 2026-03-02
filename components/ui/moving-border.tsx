'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function MovingBorder({
  children,
  as: Component = 'div',
  className,
  containerClassName,
  borderClassName,
  duration = 3000,
  ...props
}: {
  children: React.ReactNode
  as?: React.ElementType
  className?: string
  containerClassName?: string
  borderClassName?: string
  duration?: number
} & React.HTMLAttributes<HTMLElement>): React.JSX.Element {
  return (
    <Component
      className={cn('relative overflow-hidden rounded-full p-[2px]', containerClassName)}
      {...props}
    >
      {/* Spinning conic gradient border */}
      <motion.div
        className={cn(
          'absolute inset-0 rounded-full motion-reduce:hidden',
          borderClassName
        )}
        style={{
          background: 'conic-gradient(from 0deg, transparent, #E8642C, transparent, #E8642C, transparent)',
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: duration / 1000,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      {/* Inner content */}
      <div className={cn('relative rounded-full', className)}>
        {children}
      </div>
    </Component>
  )
}
