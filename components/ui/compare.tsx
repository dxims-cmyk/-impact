'use client'

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function Compare({
  firstContent,
  secondContent,
  firstLabel,
  secondLabel,
  className,
  initialSliderPercentage = 50,
}: {
  firstContent: React.ReactNode
  secondContent: React.ReactNode
  firstLabel?: string
  secondLabel?: string
  className?: string
  initialSliderPercentage?: number
}): React.JSX.Element {
  const [sliderPosition, setSliderPosition] = useState(initialSliderPercentage)
  const [isDragging, setIsDragging] = useState(false)

  const handleMove = useCallback(
    (clientX: number, rect: DOMRect) => {
      const x = clientX - rect.left
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
      setSliderPosition(percentage)
    },
    []
  )

  const handleMouseDown = () => setIsDragging(true)
  const handleMouseUp = () => setIsDragging(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    handleMove(e.clientX, rect)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    handleMove(e.touches[0].clientX, rect)
  }

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl select-none cursor-col-resize',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* First (left) content */}
      <div className="absolute inset-0">{firstContent}</div>

      {/* Second (right) content - clipped */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
        {secondContent}
      </div>

      {/* Slider handle */}
      <div
        className="absolute top-0 bottom-0 z-30 w-0.5 bg-white/80 cursor-col-resize"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4L3 10L7 16" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13 4L17 10L13 16" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      {firstLabel && (
        <div className="absolute bottom-4 left-4 z-20 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-xs font-medium text-white">
          {firstLabel}
        </div>
      )}
      {secondLabel && (
        <div className="absolute bottom-4 right-4 z-20 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-xs font-medium text-white">
          {secondLabel}
        </div>
      )}
    </div>
  )
}
