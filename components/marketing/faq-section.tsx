'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

const faqs = [
  {
    question: 'What types of business is Impact for?',
    answer: 'Any service business running paid ads. Restaurants, dental clinics, estate agents, gyms, salons, trades. If you get leads from Meta Ads and need to respond fast, Impact is for you.',
  },
  {
    question: 'Is Impact live yet?',
    answer: 'We are onboarding founding clients now. Early access includes hands-on setup, priority support, and direct access to the team building the product.',
  },
  {
    question: 'How fast is setup?',
    answer: '48 hours from sign-up to live. We connect your Meta ad account, configure your inbox channels, and handle all the technical setup. You do not need to touch any code.',
  },
  {
    question: 'Do I need technical knowledge?',
    answer: 'None. We handle everything. You get a dashboard and WhatsApp alerts. If you can read a text message, you can use Impact.',
  },
  {
    question: 'What is the AI Receptionist?',
    answer: 'A voice AI that answers your business calls 24/7, qualifies leads with natural conversation, and books appointments into your calendar. Available on Growth and Pro plans, or as a £400/mo addon on Core.',
  },
  {
    question: 'How does the unified inbox work?',
    answer: 'Every message from WhatsApp, SMS, email, Instagram DM, and Messenger appears in one timeline per lead. You reply from one place. No switching between apps.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. Monthly billing, no lock-in contracts. We keep clients because the product works, not because of fine print.',
  },
  {
    question: 'How is Impact different from GoHighLevel or HubSpot?',
    answer: 'Impact is built for UK service businesses running Meta Ads. No bloat, no enterprise pricing, no 6-month onboarding. You are live in 48 hours with WhatsApp-first alerts and AI lead scoring out of the box.',
  },
  {
    question: 'Run an agency?',
    answer: 'We offer white-label options for agencies who want to resell Impact under their own brand. Get in touch at hello@driveimpact.io to discuss.',
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
    <section id="faq" className={`py-24 sm:py-32 scroll-mt-20 transition-colors duration-700 ${
      dark ? 'bg-[#0F0F0F]' : 'bg-gray-50'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 lg:gap-16 items-start">
          {/* Left: Questions */}
          <div>
            <FadeIn>
              <h2 className={`font-display text-3xl sm:text-4xl font-bold mb-10 transition-colors duration-700 ${
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

          {/* Right: Visual */}
          <FadeIn delay={0.2}>
            <div className="hidden lg:block sticky top-32">
              {/* Phone mockup showing WhatsApp */}
              <div className={`relative rounded-[2rem] border-[4px] shadow-2xl mx-auto w-[260px] ${
                dark ? 'border-zinc-800 bg-black shadow-black/60' : 'border-gray-900 bg-black shadow-gray-400/40'
              }`}>
                <div className="absolute top-[5px] left-1/2 -translate-x-1/2 z-10 w-[60px] h-[18px] bg-black rounded-full" />
                <div className="rounded-[1.6rem] overflow-hidden">
                  <Image
                    src="/screenshots/whatsapp-notifications-cropped.png"
                    alt="WhatsApp lead notification"
                    width={1320}
                    height={2868}
                    className="w-full h-auto block"
                  />
                </div>
                <div className="absolute bottom-[4px] left-1/2 -translate-x-1/2 z-10 w-[64px] h-[3px] bg-white/30 rounded-full" />
              </div>
              {/* Caption */}
              <p className={`text-center text-xs mt-4 transition-colors ${
                dark ? 'text-zinc-600' : 'text-gray-400'
              }`}>
                Real lead alert. Under 5 seconds.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
