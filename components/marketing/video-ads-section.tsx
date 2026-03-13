'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Volume2, VolumeX } from 'lucide-react'

const ads = [
  {
    src: '/videos/ad-stop-losing-leads.mp4',
    label: 'How many leads did you lose?',
    speaker: 'AI Presenter',
  },
  {
    src: '/videos/ad-lead-response.mp4',
    label: 'You\'re spending thousands on ads',
    speaker: 'AI Presenter',
  },
]

function VideoCard({ src, label, speaker }: { src: string; label: string; speaker: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play()
      setPlaying(true)
    } else {
      v.pause()
      setPlaying(false)
    }
  }

  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative group"
    >
      <div
        className="relative aspect-[9/16] max-w-[320px] mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40 cursor-pointer bg-black"
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          loop
          preload="metadata"
          className="w-full h-full object-cover"
          onEnded={() => setPlaying(false)}
        />

        {/* Play overlay */}
        {!playing && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity">
            <div className="w-16 h-16 rounded-full bg-[#6E0F1A] flex items-center justify-center shadow-lg shadow-[#6E0F1A]/30">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Mute toggle */}
        {playing && (
          <button
            onClick={toggleMute}
            className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}

        {/* Bottom label */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
          <p className="text-white text-sm font-semibold leading-tight">{label}</p>
          <p className="text-white/50 text-xs mt-1">{speaker}</p>
        </div>
      </div>
    </motion.div>
  )
}

export function VideoAdsSection(): React.JSX.Element {
  return (
    <section className="py-20 sm:py-28 bg-[#0B1220] overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-sm font-medium text-[#6E0F1A] uppercase tracking-widest mb-4">
            See it in action
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Watch what <span className="text-[#6E0F1A]">:Impact</span> does
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            30 seconds. That&apos;s all you need to understand why speed-to-lead changes everything.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 max-w-[720px] mx-auto">
          {ads.map((ad) => (
            <VideoCard key={ad.src} {...ad} />
          ))}
        </div>
      </div>
    </section>
  )
}
