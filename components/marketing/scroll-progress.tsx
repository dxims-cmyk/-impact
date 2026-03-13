'use client'

import { motion, useScroll, useSpring } from 'framer-motion'

/**
 * Thin orange progress bar at the very top of the page.
 * Shows how far through the landing page the user has scrolled.
 */
export function ScrollProgress(): React.JSX.Element {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-[#6E0F1A] z-[60] origin-left"
      style={{ scaleX }}
    />
  )
}
