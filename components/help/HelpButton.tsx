'use client'

import { useState } from 'react'
import {
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  ListChecks,
  Mail,
  BookOpen,
  MessageCircle,
} from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: 'How do leads get into the system?',
    answer: 'Leads are captured automatically when someone fills out your embedded form, comes through a connected ad platform (Meta, Google, TikTok), or is created via ManyChat, Zapier, or the API. You can also add leads manually.',
  },
  {
    question: 'How does the AI qualification work?',
    answer: 'When a new lead arrives, our AI analyses their details and assigns a score (1-10), temperature (hot/warm/cold), and a summary. This helps you prioritise who to contact first.',
  },
  {
    question: 'How do I get notified about new leads?',
    answer: 'Connect WhatsApp in the Integrations page. You\'ll receive an instant WhatsApp message whenever a new lead comes in, including their details and AI summary.',
  },
  {
    question: 'Can I connect my calendar for bookings?',
    answer: 'Yes! Connect Cal.com or Calendly from the Integrations page. When a lead books a call, it automatically syncs to your calendar and updates the lead\'s stage.',
  },
  {
    question: 'What does the AI Receptionist do?',
    answer: 'The AI Receptionist (powered by Vapi) answers your phone 24/7, qualifies callers, captures their details, and creates leads automatically. Configure it in Settings > AI Receptionist.',
  },
  {
    question: 'How do I embed the lead capture form?',
    answer: 'Go to Settings and find the "Form Embed Code" section. Copy the code snippet and paste it into your website HTML. The form automatically sends leads into your pipeline.',
  },
]

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const reopenChecklist = (): void => {
    window.dispatchEvent(new Event('onboarding-reopen'))
    setIsOpen(false)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          isOpen
            ? 'bg-navy text-ivory rotate-90 scale-95'
            : 'bg-impact text-ivory hover:bg-impact-light hover:scale-105'
        }`}
      >
        {isOpen ? <X className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
      </button>

      {/* Slide-out panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-right">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-navy">Help & Support</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-navy/50" />
                </button>
              </div>
              <p className="text-sm text-navy/50">Everything you need to get started</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Getting Started Video */}
              <div>
                <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-impact" />
                  Getting Started
                </h3>
                <div className="rounded-xl bg-navy/5 border border-navy/10 p-8 flex flex-col items-center justify-center text-center">
                  <PlayCircle className="w-10 h-10 text-navy/30 mb-2" />
                  <p className="text-sm text-navy/50">Video walkthrough coming soon</p>
                  <p className="text-xs text-navy/30 mt-1">A quick tour of all features</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-sm font-semibold text-navy mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={reopenChecklist}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-impact/10 flex items-center justify-center">
                      <ListChecks className="w-4 h-4 text-impact" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy">Reopen Setup Checklist</p>
                      <p className="text-xs text-navy/50">Continue setting up your account</p>
                    </div>
                  </button>
                  <a
                    href="mailto:support@mediampm.com"
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-studio/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-studio" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy">Contact Support</p>
                      <p className="text-xs text-navy/50">support@mediampm.com</p>
                    </div>
                  </a>
                  <div className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-left opacity-60">
                    <div className="w-9 h-9 rounded-lg bg-navy/10 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-navy/50" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy">Help Documentation</p>
                      <p className="text-xs text-navy/50">Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div>
                <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-impact" />
                  Frequently Asked Questions
                </h3>
                <div className="space-y-1">
                  {faqs.map((faq, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-navy pr-4">{faq.question}</span>
                        {expandedFaq === i ? (
                          <ChevronUp className="w-4 h-4 text-navy/40 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-navy/40 flex-shrink-0" />
                        )}
                      </button>
                      {expandedFaq === i && (
                        <div className="px-3 pb-3">
                          <p className="text-sm text-navy/60 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 text-center">
              <p className="text-xs text-navy/40">
                Built by AM:PM Media
              </p>
            </div>
          </div>
        </>
      )}
    </>
  )
}
