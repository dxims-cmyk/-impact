'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, MessageSquare, BarChart3, Inbox, Zap } from 'lucide-react'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

const STEPS = [
  { id: 'connect', label: 'Connect', icon: Zap },
  { id: 'alert', label: 'Alert', icon: MessageSquare },
  { id: 'score', label: 'Score', icon: BarChart3 },
  { id: 'close', label: 'Close', icon: Inbox },
] as const

type StepId = (typeof STEPS)[number]['id']

const spring = { type: 'spring' as const, stiffness: 400, damping: 30 }
const springBouncy = { type: 'spring' as const, stiffness: 500, damping: 25 }

function ConnectStep({ onNext }: { onNext: () => void }): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)

  const handleConnect = () => {
    setConnecting(true)
    setTimeout(() => {
      setConnecting(false)
      setConnected(true)
      setTimeout(onNext, 1200)
    }, 1500)
  }

  return (
    <div className="space-y-4">
      <p className={`text-sm font-medium transition-colors ${dark ? 'text-zinc-300' : 'text-gray-700'}`}>
        Connect your ad account to start capturing leads.
      </p>

      {/* Meta Ads connection card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className={`rounded-xl border p-4 transition-colors ${
          dark ? 'border-zinc-800 bg-zinc-900/60' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-lg">
              📘
            </div>
            <div>
              <div className={`text-sm font-semibold transition-colors ${dark ? 'text-white' : 'text-[#0B1220]'}`}>
                Meta Ads
              </div>
              <div className={`text-xs transition-colors ${dark ? 'text-zinc-500' : 'text-gray-400'}`}>
                Facebook & Instagram campaigns
              </div>
            </div>
          </div>

          {connected ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={springBouncy}
              className="flex items-center gap-1.5 text-green-500 text-xs font-semibold"
            >
              <Check className="w-4 h-4" />
              Connected
            </motion.div>
          ) : (
            <motion.button
              onClick={handleConnect}
              disabled={connecting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={spring}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                connecting
                  ? dark ? 'bg-zinc-800 text-zinc-500' : 'bg-gray-100 text-gray-400'
                  : 'bg-[#E8642C] text-white hover:bg-[#d55a25]'
              }`}
            >
              {connecting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </span>
              ) : (
                'Connect'
              )}
            </motion.button>
          )}
        </div>

        {/* Campaigns appearing after connection */}
        <AnimatePresence>
          {connected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ ...spring, delay: 0.2 }}
              className="overflow-hidden"
            >
              <div className={`mt-4 pt-3 border-t space-y-2 ${dark ? 'border-zinc-800' : 'border-gray-100'}`}>
                {[
                  { name: 'Summer Campaign', status: 'Active', leads: 47 },
                  { name: 'Local Promo', status: 'Active', leads: 23 },
                  { name: 'Retargeting', status: 'Active', leads: 12 },
                ].map((campaign, i) => (
                  <motion.div
                    key={campaign.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...spring, delay: 0.3 + i * 0.1 }}
                    className="flex items-center justify-between"
                  >
                    <span className={`text-xs transition-colors ${dark ? 'text-zinc-400' : 'text-gray-600'}`}>
                      {campaign.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-green-500 font-medium">{campaign.status}</span>
                      <span className={`text-[10px] font-mono transition-colors ${dark ? 'text-zinc-600' : 'text-gray-400'}`}>
                        {campaign.leads} leads
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function AlertStep({ onNext }: { onNext: () => void }): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowNotification(true), 600)
    const t2 = setTimeout(onNext, 3500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onNext])

  return (
    <div className="space-y-4">
      <p className={`text-sm font-medium transition-colors ${dark ? 'text-zinc-300' : 'text-gray-700'}`}>
        A new lead just came in from your Meta campaign...
      </p>

      {/* Phone mockup with WhatsApp notification */}
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={spring}
          className={`relative w-64 rounded-[2rem] border-[3px] p-2 ${
            dark ? 'border-zinc-700 bg-zinc-900' : 'border-gray-300 bg-gray-50'
          }`}
        >
          {/* Phone notch */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 rounded-b-xl ${
            dark ? 'bg-zinc-800' : 'bg-gray-200'
          }`} />

          {/* Phone screen */}
          <div className={`rounded-[1.5rem] p-4 pt-8 min-h-[220px] flex flex-col justify-center ${
            dark ? 'bg-zinc-950' : 'bg-white'
          }`}>
            {/* Time */}
            <div className={`text-center text-2xl font-light mb-6 ${dark ? 'text-white' : 'text-[#0B1220]'}`}>
              9:41
            </div>

            {/* WhatsApp notification sliding in */}
            <AnimatePresence>
              {showNotification && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={springBouncy}
                  className={`rounded-2xl p-3 shadow-lg ${
                    dark ? 'bg-zinc-800 shadow-black/30' : 'bg-white shadow-gray-200/80 border border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold ${dark ? 'text-white' : 'text-[#0B1220]'}`}>
                          Impact Bot
                        </span>
                        <span className={`text-[9px] ${dark ? 'text-zinc-500' : 'text-gray-400'}`}>now</span>
                      </div>
                      <div className={`text-[10px] leading-relaxed mt-1 ${dark ? 'text-zinc-300' : 'text-gray-600'}`}>
                        <span className="font-semibold">🔥 New Hot Lead</span>
                        <br />
                        Sarah Mitchell | 07XXX XXX XXX
                        <br />
                        Source: Meta Ads - Summer Campaign
                        <br />
                        <span className="text-[#E8642C] font-semibold">AI Score: 92/100</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Response time badge */}
            <AnimatePresence>
              {showNotification && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-3 text-center"
                >
                  <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-full ${
                    dark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'
                  }`}>
                    <Zap className="w-2.5 h-2.5" />
                    Delivered in 4.2 seconds
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function ScoreStep({ onNext }: { onNext: () => void }): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setAnimate(true), 300)
    const t2 = setTimeout(onNext, 3500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onNext])

  const leads = [
    { name: 'Sarah Mitchell', score: 92, label: 'Hot', color: '#ef4444' },
    { name: 'Emily Chen', score: 88, label: 'Hot', color: '#ef4444' },
    { name: 'James Cooper', score: 74, label: 'Warm', color: '#f59e0b' },
    { name: 'Marcus Williams', score: 31, label: 'Cold', color: '#3b82f6' },
  ]

  return (
    <div className="space-y-4">
      <p className={`text-sm font-medium transition-colors ${dark ? 'text-zinc-300' : 'text-gray-700'}`}>
        AI scored every lead. You know exactly who to call first.
      </p>

      <div className="space-y-2">
        {leads.map((lead, i) => (
          <motion.div
            key={lead.name}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: i * 0.12 }}
            className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
              dark ? 'border-zinc-800 bg-zinc-900/60' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E8642C]/10 flex items-center justify-center">
                <span className="text-[9px] font-bold text-[#E8642C]">
                  {lead.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <span className={`text-xs font-semibold ${dark ? 'text-white' : 'text-[#0B1220]'}`}>
                  {lead.name}
                </span>
                <span
                  className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: lead.color + '15', color: lead.color }}
                >
                  {lead.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-20 h-2 rounded-full overflow-hidden ${dark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: animate ? `${lead.score}%` : 0 }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-[#E8642C]"
                />
              </div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: animate ? 1 : 0 }}
                transition={{ delay: 0.6 + i * 0.15 }}
                className="text-xs font-bold font-mono text-[#E8642C] w-6 text-right"
              >
                {lead.score}
              </motion.span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function CloseStep(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'
  const [showMessages, setShowMessages] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowMessages(true), 500)
    return () => clearTimeout(t)
  }, [])

  const messages = [
    { from: 'them', channel: 'WhatsApp', text: "Hi! I saw your ad about the premium plan. Can I get more details?", time: '9:41 AM' },
    { from: 'you', channel: 'WhatsApp', text: "Hi Sarah! Absolutely. Let me send you our pricing guide. Are you free for a quick call today?", time: '9:41 AM' },
    { from: 'them', channel: 'Email', text: "That would be great! I'm free after 2pm.", time: '9:43 AM' },
  ]

  return (
    <div className="space-y-4">
      <p className={`text-sm font-medium transition-colors ${dark ? 'text-zinc-300' : 'text-gray-700'}`}>
        Reply from one inbox. Every channel. Close the deal.
      </p>

      {/* Mini inbox */}
      <div className={`rounded-xl border overflow-hidden transition-colors ${
        dark ? 'border-zinc-800 bg-zinc-900/60' : 'border-gray-200 bg-white'
      }`}>
        {/* Inbox header */}
        <div className={`px-4 py-2.5 border-b flex items-center justify-between ${
          dark ? 'border-zinc-800 bg-zinc-900' : 'border-gray-100 bg-gray-50'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#E8642C]/10 flex items-center justify-center">
              <span className="text-[8px] font-bold text-[#E8642C]">SM</span>
            </div>
            <span className={`text-xs font-semibold ${dark ? 'text-white' : 'text-[#0B1220]'}`}>
              Sarah Mitchell
            </span>
          </div>
          <div className="flex items-center gap-1">
            {['WhatsApp', 'Email'].map((ch) => (
              <span key={ch} className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
                dark ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-500'
              }`}>
                {ch}
              </span>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="p-3 space-y-2.5 min-h-[160px]">
          <AnimatePresence>
            {showMessages && messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...spring, delay: i * 0.5 }}
                className={`flex ${msg.from === 'you' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                  msg.from === 'you'
                    ? 'bg-[#E8642C] text-white rounded-br-sm'
                    : dark
                      ? 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                      : 'bg-gray-100 text-gray-700 rounded-bl-sm'
                }`}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className={`text-[8px] font-medium ${
                      msg.from === 'you' ? 'text-white/60' : dark ? 'text-zinc-500' : 'text-gray-400'
                    }`}>
                      via {msg.channel}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{msg.text}</p>
                  <span className={`text-[8px] float-right mt-1 ${
                    msg.from === 'you' ? 'text-white/50' : dark ? 'text-zinc-600' : 'text-gray-400'
                  }`}>
                    {msg.time}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="grid grid-cols-3 gap-2"
      >
        {[
          { value: '4.2s', label: 'Response time' },
          { value: '92', label: 'AI Score' },
          { value: 'Won', label: 'Outcome' },
        ].map((stat) => (
          <div key={stat.label} className={`text-center rounded-lg p-2 transition-colors ${
            dark ? 'bg-zinc-900/40' : 'bg-gray-50'
          }`}>
            <div className="text-lg font-bold text-[#E8642C]">{stat.value}</div>
            <div className={`text-[9px] ${dark ? 'text-zinc-500' : 'text-gray-400'}`}>{stat.label}</div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

export function InteractiveDemo(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'
  const [currentStep, setCurrentStep] = useState(0)
  const [autoPlaying, setAutoPlaying] = useState(false)

  const goToNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
  }, [])

  const startDemo = () => {
    setCurrentStep(0)
    setAutoPlaying(true)
  }

  const stepId = STEPS[currentStep].id

  return (
    <section id="interactive-demo" className={`py-20 sm:py-28 scroll-mt-20 transition-colors duration-500 ${
      dark ? 'bg-[#0A0A0A]' : 'bg-[#FAFAF8]'
    }`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className={`text-xs font-medium uppercase tracking-[0.2em] mb-4 ${
            dark ? 'text-zinc-500' : 'text-gray-500'
          }`}>
            Interactive demo
          </p>
          <h2 className={`font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 transition-colors duration-500 ${
            dark ? 'text-white' : 'text-[#0B1220]'
          }`}>
            Try Impact in 30 seconds.
          </h2>
          <p className={`text-lg max-w-xl mx-auto transition-colors duration-500 ${
            dark ? 'text-zinc-400' : 'text-gray-600'
          }`}>
            No signup. No sales call. Just click and see what happens when a lead comes in.
          </p>
        </div>

        {/* Demo container */}
        <div className="max-w-lg mx-auto">
          {/* Step indicators */}
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              const isActive = i === currentStep
              const isDone = i < currentStep

              return (
                <button
                  key={step.id}
                  onClick={() => { setCurrentStep(i); setAutoPlaying(false) }}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <motion.div
                    animate={{
                      scale: isActive ? 1 : 0.85,
                      backgroundColor: isActive
                        ? '#E8642C'
                        : isDone
                          ? dark ? '#27272a' : '#e5e7eb'
                          : dark ? '#18181b' : '#f3f4f6',
                    }}
                    transition={spring}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                  >
                    {isDone ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Icon className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-white' : dark ? 'text-zinc-500' : 'text-gray-400'
                      }`} />
                    )}
                  </motion.div>
                  <span className={`text-[10px] font-medium transition-colors ${
                    isActive ? 'text-[#E8642C]' : dark ? 'text-zinc-600' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Progress bar */}
          <div className={`h-0.5 rounded-full mb-8 overflow-hidden ${dark ? 'bg-zinc-800' : 'bg-gray-200'}`}>
            <motion.div
              animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-[#E8642C] rounded-full"
            />
          </div>

          {/* Step content */}
          <div className={`rounded-2xl border p-6 min-h-[340px] transition-colors duration-500 ${
            dark ? 'border-zinc-800 bg-zinc-950/50' : 'border-gray-200 bg-white shadow-sm'
          }`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={stepId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {stepId === 'connect' && <ConnectStep onNext={autoPlaying ? goToNext : () => {}} />}
                {stepId === 'alert' && <AlertStep onNext={autoPlaying ? goToNext : () => {}} />}
                {stepId === 'score' && <ScoreStep onNext={autoPlaying ? goToNext : () => {}} />}
                {stepId === 'close' && <CloseStep />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                  currentStep === 0
                    ? dark ? 'text-zinc-700' : 'text-gray-300'
                    : dark ? 'text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800' : 'text-gray-500 hover:text-[#0B1220] bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Back
              </button>
              {currentStep < STEPS.length - 1 ? (
                <button
                  onClick={() => { setCurrentStep(currentStep + 1); setAutoPlaying(false) }}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-[#E8642C] text-white hover:bg-[#d55a25] transition-colors"
                >
                  Next Step
                </button>
              ) : (
                <motion.button
                  onClick={startDemo}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-[#E8642C] text-white hover:bg-[#d55a25] transition-colors"
                >
                  Replay Demo
                </motion.button>
              )}
            </div>

            {!autoPlaying && currentStep === 0 && (
              <motion.button
                onClick={startDemo}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                  dark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ▶ Auto-play all steps
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
