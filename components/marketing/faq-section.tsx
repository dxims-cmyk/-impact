'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

const faqs = [
  {
    question: 'What types of business is Impact for?',
    answer: 'Any service business running paid ads. Restaurants, dental clinics, estate agents, gyms, salons, trades. If you get leads from Meta or Google ads, Impact works for you.',
  },
  {
    question: 'How fast is setup?',
    answer: '48 hours from sign-up to live. We connect your Meta ad account, configure your inbox, and handle all the technical setup.',
  },
  {
    question: 'Do I need technical knowledge?',
    answer: 'None. We handle everything. You get a dashboard and WhatsApp alerts.',
  },
  {
    question: "What's the AI Receptionist?",
    answer: 'A voice AI that answers your business calls 24/7, qualifies leads, and books appointments directly into your calendar. Available on Growth and Pro plans, or as a £400/mo addon.',
  },
  {
    question: 'How does the unified inbox work?',
    answer: 'Every message from WhatsApp, SMS, email, Instagram and Messenger appears in one timeline per lead. No switching between apps.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. Monthly billing, no lock-in contracts.',
  },
  {
    question: 'How is Impact different from GoHighLevel or HubSpot?',
    answer: "Impact is built for SMBs running paid ads. No bloat, no enterprise pricing, no 6-month onboarding. You're live in 48 hours with WhatsApp-first alerts.",
  },
]

function FaqItem({ question, answer }: { question: string; answer: string }): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'

  return (
    <div className={`border-b last:border-0 transition-colors duration-700 ${
      dark ? 'border-zinc-800' : 'border-gray-200'
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className={`text-[15px] font-medium pr-4 transition-colors duration-700 ${
          dark ? 'text-white group-hover:text-zinc-300' : 'text-[#0B1220] group-hover:text-gray-600'
        }`}>
          {question}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-all duration-200 ${
          open ? 'rotate-180' : ''
        } ${dark ? 'text-zinc-500' : 'text-gray-400'}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className={`pb-5 text-sm leading-relaxed transition-colors duration-700 ${
              dark ? 'text-zinc-400' : 'text-gray-600'
            }`}>
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FaqSection(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'

  return (
    <section id="faq" className={`py-20 sm:py-28 scroll-mt-20 transition-colors duration-700 ${
      dark ? 'bg-[#0F0F0F]' : 'bg-gray-50'
    }`}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <h2 className={`font-display text-3xl sm:text-4xl font-bold text-center mb-12 transition-colors duration-700 ${
            dark ? 'text-white' : 'text-[#0B1220]'
          }`}>
            Questions?
          </h2>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className={`rounded-xl border px-6 transition-colors duration-700 ${
            dark ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-200 bg-white shadow-sm'
          }`}>
            {faqs.map((faq) => (
              <FaqItem key={faq.question} {...faq} />
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
