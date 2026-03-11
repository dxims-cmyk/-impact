'use client'

import { useEffect, useRef } from 'react'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

/**
 * Fluid canvas background — warm organic blobs behind the hero.
 * Inspired by Stripe Sessions. Uses vanilla canvas, no WebGL needed.
 */
export function FluidBackground(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useMarketingTheme()
  const themeRef = useRef(theme)
  themeRef.current = theme

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let w = 0
    let h = 0

    const resize = (): void => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.scale(dpr, dpr)
    }

    resize()
    window.addEventListener('resize', resize)

    // Blob definitions — each moves on its own sin/cos path
    const blobs = [
      { x: 0.7, y: 0.3, r: 0.35, sx: 0.0003, sy: 0.0004, ox: 0, oy: 0 },
      { x: 0.3, y: 0.6, r: 0.3, sx: 0.0004, sy: 0.0003, ox: 1000, oy: 2000 },
      { x: 0.5, y: 0.2, r: 0.25, sx: 0.0002, sy: 0.0005, ox: 3000, oy: 1000 },
    ]

    const draw = (time: number): void => {
      ctx.clearRect(0, 0, w, h)
      const dark = themeRef.current === 'dark'

      for (const blob of blobs) {
        const bx = (blob.x + Math.sin((time + blob.ox) * blob.sx) * 0.08) * w
        const by = (blob.y + Math.cos((time + blob.oy) * blob.sy) * 0.06) * h
        const br = blob.r * Math.min(w, h)

        const gradient = ctx.createRadialGradient(bx, by, 0, bx, by, br)

        if (dark) {
          gradient.addColorStop(0, 'rgba(232, 100, 44, 0.06)')
          gradient.addColorStop(0.5, 'rgba(232, 100, 44, 0.02)')
          gradient.addColorStop(1, 'rgba(232, 100, 44, 0)')
        } else {
          gradient.addColorStop(0, 'rgba(232, 100, 44, 0.08)')
          gradient.addColorStop(0.5, 'rgba(232, 100, 44, 0.03)')
          gradient.addColorStop(1, 'rgba(232, 100, 44, 0)')
        }

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(bx, by, br, 0, Math.PI * 2)
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full -z-10 pointer-events-none"
      aria-hidden="true"
    />
  )
}
