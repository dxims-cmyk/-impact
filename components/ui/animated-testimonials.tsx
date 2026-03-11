'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'

type Testimonial = {
  quote: string
  name: string
  designation: string
  src?: string
}

export function AnimatedTestimonials({
  testimonials,
  autoplay = true,
}: {
  testimonials: Testimonial[]
  autoplay?: boolean
}): React.JSX.Element {
  const [active, setActive] = useState(0)

  const handleNext = useCallback(() => {
    setActive((prev) => (prev + 1) % testimonials.length)
  }, [testimonials.length])

  const handlePrev = useCallback(() => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [testimonials.length])

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(handleNext, 5000)
      return () => clearInterval(interval)
    }
  }, [autoplay, handleNext])

  const isActive = (index: number) => index === active

  const randomRotateY = () => Math.floor(Math.random() * 21) - 10

  return (
    <div className="max-w-sm md:max-w-4xl mx-auto antialiased px-4 md:px-8 lg:px-12 py-20">
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-20">
        <div>
          <div className="relative h-80 w-full">
            <AnimatePresence>
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                    z: -100,
                    rotate: randomRotateY(),
                  }}
                  animate={{
                    opacity: isActive(index) ? 1 : 0.7,
                    scale: isActive(index) ? 1 : 0.95,
                    z: isActive(index) ? 0 : -100,
                    rotate: isActive(index) ? 0 : randomRotateY(),
                    zIndex: isActive(index)
                      ? 999
                      : testimonials.length - index,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.9,
                    z: 100,
                    rotate: randomRotateY(),
                  }}
                  transition={{
                    duration: 0.4,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 origin-bottom"
                >
                  {testimonial.src ? (
                    <img
                      src={testimonial.src}
                      alt={testimonial.name}
                      className="h-full w-full rounded-3xl object-cover object-center"
                    />
                  ) : (
                    <div className="h-full w-full rounded-3xl bg-gradient-to-br from-[#E8642C]/20 to-[#E8642C]/5 flex items-center justify-center">
                      <span className="text-6xl font-bold text-[#E8642C]/30 font-display">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex justify-between flex-col py-4">
          <motion.div
            key={active}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <h3 className="text-2xl font-bold font-display">
              {testimonials[active].name}
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              {testimonials[active].designation}
            </p>
            <motion.p className="text-lg mt-8 leading-relaxed">
              &ldquo;{testimonials[active].quote}&rdquo;
            </motion.p>
          </motion.div>
          <div className="flex gap-4 pt-12 md:pt-0">
            <button
              onClick={handlePrev}
              className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center group/button hover:bg-[#E8642C] transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-zinc-400 group-hover/button:text-white transition-colors" />
            </button>
            <button
              onClick={handleNext}
              className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center group/button hover:bg-[#E8642C] transition-colors"
            >
              <ArrowRight className="h-5 w-5 text-zinc-400 group-hover/button:text-white transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
