'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

/**
 * Custom cursor that grows on interactive elements.
 * Only renders on non-touch devices.
 */
export function CustomCursor(): React.JSX.Element | null {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [hovering, setHovering] = useState(false)
  const [visible, setVisible] = useState(false)
  const [isTouch, setIsTouch] = useState(true)
  const rafRef = useRef<number>(0)
  const targetRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // Detect touch device
    const hasCoarse = window.matchMedia('(pointer: coarse)').matches
    if (hasCoarse) return
    setIsTouch(false)

    const onMove = (e: MouseEvent): void => {
      targetRef.current = { x: e.clientX, y: e.clientY }
      if (!visible) setVisible(true)
    }

    const onOver = (e: MouseEvent): void => {
      const target = e.target as HTMLElement
      const interactive = target.closest('a, button, [role="button"], .spring-hover, input, textarea, select')
      setHovering(!!interactive)
    }

    const onLeave = (): void => {
      setVisible(false)
    }

    // Smooth follow using RAF
    const tick = (): void => {
      setPos((prev) => ({
        x: prev.x + (targetRef.current.x - prev.x) * 0.15,
        y: prev.y + (targetRef.current.y - prev.y) * 0.15,
      }))
      rafRef.current = requestAnimationFrame(tick)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseleave', onLeave)
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [visible])

  if (isTouch) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px)`,
          }}
        >
          <motion.div
            animate={{
              width: hovering ? 48 : 8,
              height: hovering ? 48 : 8,
              x: hovering ? -24 : -4,
              y: hovering ? -24 : -4,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="rounded-full bg-white"
            style={{ opacity: 0.8 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
