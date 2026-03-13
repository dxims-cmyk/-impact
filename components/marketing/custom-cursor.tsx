'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Custom cursor that grows on interactive elements.
 * Only renders on non-touch devices. Uses direct DOM transforms for zero lag.
 */
export function CustomCursor(): React.JSX.Element | null {
  const outerRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const [isTouch, setIsTouch] = useState(true)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hasCoarse = window.matchMedia('(pointer: coarse)').matches
    if (hasCoarse) return
    setIsTouch(false)

    let x = -100
    let y = -100
    let currentX = -100
    let currentY = -100
    let hovering = false
    let currentScale = 1
    let rafId: number

    const onMove = (e: MouseEvent): void => {
      x = e.clientX
      y = e.clientY
      if (!visible) setVisible(true)
    }

    const onOver = (e: MouseEvent): void => {
      const target = e.target as HTMLElement
      const interactive = target.closest('a, button, [role="button"], .spring-hover, input, textarea, select')
      hovering = !!interactive
    }

    const onLeave = (): void => {
      setVisible(false)
    }

    const tick = (): void => {
      // Lerp position directly on DOM — no React re-renders
      currentX += (x - currentX) * 0.15
      currentY += (y - currentY) * 0.15

      const targetScale = hovering ? 5 : 1
      currentScale += (targetScale - currentScale) * 0.12

      if (outerRef.current) {
        outerRef.current.style.transform = `translate3d(${currentX - 4}px, ${currentY - 4}px, 0)`
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `scale(${currentScale})`
      }

      rafId = requestAnimationFrame(tick)
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    rafId = requestAnimationFrame(tick)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(rafId)
    }
  }, [visible])

  if (isTouch) return null

  return visible ? (
    <div
      ref={outerRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
      style={{ willChange: 'transform' }}
    >
      <div
        ref={dotRef}
        className="w-2 h-2 rounded-full bg-white"
        style={{ opacity: 0.7, willChange: 'transform' }}
      />
    </div>
  ) : null
}
