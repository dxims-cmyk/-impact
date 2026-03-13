'use client'

import { useState, useRef } from 'react'
import { Play, Pause } from 'lucide-react'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

const videos = [
  {
    title: 'How many leads did you lose?',
    src: '/videos/ad-stop-losing-leads.mp4',
  },
  {
    title: "You're spending thousands on ads",
    src: '/videos/ad-lead-response.mp4',
  },
]

function VideoCard({ title, src, dark }: { title: string; src: string; dark: boolean }): React.JSX.Element {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  const toggle = (): void => {
    if (!ref.current) return
    if (playing) {
      ref.current.pause()
    } else {
      ref.current.play()
    }
    setPlaying(!playing)
  }

  return (
    <div
      className={`group relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 spring-hover ${
        dark
          ? 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
          : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm hover:shadow-lg'
      }`}
      onClick={toggle}
    >
      <div className="relative aspect-[9/16]">
        <video
          ref={ref}
          src={src}
          className="w-full h-full object-cover"
          playsInline
          preload="metadata"
          onEnded={() => setPlaying(false)}
        />
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          playing ? 'opacity-0 hover:opacity-100' : 'opacity-100'
        }`}>
          <div className="w-14 h-14 rounded-full bg-[#6E0F1A] flex items-center justify-center shadow-lg shadow-[#6E0F1A]/20 group-hover:scale-110 transition-transform">
            {playing ? (
              <Pause className="w-5 h-5 text-white" fill="white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
            )}
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className={`text-sm font-medium transition-colors duration-700 ${
          dark ? 'text-white' : 'text-[#0B1220]'
        }`}>
          {title}
        </p>
      </div>
    </div>
  )
}

export function VideoSection(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-10">
            <h2 className={`font-display text-3xl sm:text-4xl font-bold mb-4 transition-colors duration-700 ${
              dark ? 'text-white' : 'text-[#0B1220]'
            }`}>
              See the full picture in 60 seconds
            </h2>
            <p className={`text-lg max-w-xl mx-auto transition-colors duration-700 ${
              dark ? 'text-zinc-500' : 'text-gray-500'
            }`}>
              From lead capture to close. Watch how Impact works in real time.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {videos.map((video, i) => (
            <FadeIn key={video.src} delay={i * 0.1}>
              <VideoCard title={video.title} src={video.src} dark={dark} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
