'use client'

import { useScroll, useTransform, motion } from 'framer-motion'
import React, { useEffect, useRef, useState } from 'react'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

interface TimelineEntry {
  title: string
  content: React.ReactNode
}

export function Timeline({ data }: { data: TimelineEntry[] }): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setHeight(rect.height)
    }
  }, [ref])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 20%', 'end 50%'],
  })

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height])
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1])

  return (
    <div className="w-full font-sans" ref={containerRef}>
      <div ref={ref} className="relative max-w-5xl mx-auto pb-20">
        {data.map((item, index) => (
          <div key={index} className="flex justify-start pt-10 md:pt-32 md:gap-10">
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className={`h-10 absolute left-3 md:left-3 w-10 rounded-full flex items-center justify-center transition-colors duration-500 ${
                dark ? 'bg-[#0A0A0A]' : 'bg-[#FAFAF8]'
              }`}>
                <div className={`h-4 w-4 rounded-full border p-2 transition-colors duration-500 ${
                  dark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-200 border-gray-300'
                }`} />
              </div>
              <h3 className={`hidden md:block text-xl md:pl-20 md:text-4xl font-bold font-display transition-colors duration-500 ${
                dark ? 'text-zinc-500' : 'text-gray-400'
              }`}>
                {item.title}
              </h3>
            </div>

            <div className="relative pl-20 pr-4 md:pl-4 w-full">
              <h3 className={`md:hidden block text-2xl mb-4 text-left font-bold font-display transition-colors duration-500 ${
                dark ? 'text-zinc-500' : 'text-gray-400'
              }`}>
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}
        <div
          style={{ height: height + 'px' }}
          className={`absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] transition-colors duration-500 ${
            dark ? 'via-zinc-700' : 'via-gray-300'
          }`}
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-[#E8642C] via-[#E8642C] to-transparent from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  )
}
