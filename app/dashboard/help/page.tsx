'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  HelpCircle,
  BookOpen,
  Zap,
  Bell,
  Users,
  ChevronDown,
  Mail,
  ExternalLink,
  MessageSquare,
} from 'lucide-react'

// ─────────────────────── Getting Started Cards ───────────────────────

const gettingStartedCards = [
  {
    icon: BookOpen,
    title: 'Add Your First Lead',
    description:
      'Leads flow in automatically from connected ad platforms (Meta, Google, TikTok), embedded lead forms, or you can add them manually from the Leads page.',
    href: '/dashboard/leads',
    linkLabel: 'Go to Leads',
  },
  {
    icon: Zap,
    title: 'Connect Integrations',
    description:
      'Link your ad accounts, calendar, payment providers, and communication tools so leads and data sync automatically.',
    href: '/dashboard/integrations',
    linkLabel: 'View Integrations',
  },
  {
    icon: Bell,
    title: 'Set Up Notifications',
    description:
      'Choose how you want to be alerted when new leads arrive -- email, WhatsApp, in-app, or all three. Never miss a hot lead.',
    href: '/dashboard/settings?tab=notifications',
    linkLabel: 'Notification Settings',
  },
  {
    icon: Users,
    title: 'Invite Your Team',
    description:
      'Add team members so everyone can manage leads, view reports, and collaborate. Set roles to control access.',
    href: '/dashboard/settings?tab=team',
    linkLabel: 'Team Settings',
  },
]

// ─────────────────────── FAQ Items ───────────────────────

const faqItems = [
  {
    question: 'How do leads get into the system?',
    answer:
      'Leads enter the system through several channels: connected ad platforms (Meta Lead Ads, Google Ads, TikTok Lead Gen), embedded lead capture forms on your website, manual entry from the Leads page, and incoming webhooks from third-party tools like Zapier or ManyChat. Once a lead arrives, it is automatically qualified by AI and you receive an instant notification.',
  },
  {
    question: 'What does AI qualification do?',
    answer:
      'Our AI analyses every incoming lead and assigns a quality score from 1 to 10. It examines the lead\'s responses, identifies buying signals, detects urgency indicators, and compares patterns against your historical conversion data. Leads scoring 8 or above are flagged as "hot" so you can prioritise them for immediate follow-up.',
  },
  {
    question: 'How do I connect my calendar?',
    answer:
      'Navigate to the Integrations page and look for Calendly or Cal.com. Click "Connect", authenticate with your calendar provider, and select which event types you want to use for booking. Once connected, you can send booking links directly to qualified leads.',
  },
  {
    question: 'Can I export my lead data?',
    answer:
      'Yes. On the Leads page, click the "Export" button in the top-right corner. You can export all leads or filter first by stage, source, date range, or score, then export just the filtered results. The data is downloaded as a CSV file that opens in Excel, Google Sheets, or any spreadsheet application.',
  },
  {
    question: 'How do I set up WhatsApp notifications?',
    answer:
      'Go to Settings, then the Organisation tab. Under the WhatsApp section, add the phone numbers that should receive instant lead alerts. When a new lead comes in or a lead is scored as hot, a WhatsApp message is sent to all registered numbers with the lead details.',
  },
  {
    question: 'What integrations are available?',
    answer:
      'We support a growing list of integrations: Meta (Facebook/Instagram Ads), Google Ads, TikTok Ads, Calendly, Cal.com, Stripe, Xero, Vapi (AI voice), Slack, WhatsApp, Zapier, and ManyChat. Visit the Integrations page to see which are connected and to add new ones.',
  },
]

// ─────────────────────── Accordion Item ───────────────────────

function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}): JSX.Element {
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden transition-shadow hover:shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-50/50 transition-colors"
      >
        <span className="text-[15px] font-semibold text-navy pr-4">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-navy/40 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="px-5 pb-5 text-sm text-navy/60 leading-relaxed">{answer}</div>
      </div>
    </div>
  )
}

// ─────────────────────── Page ───────────────────────

export default function HelpPage(): JSX.Element {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleToggle = (index: number): void => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-navy">Help Center</h1>
        <p className="text-navy/50 mt-1">
          Everything you need to get started and make the most of Impact Engine.
        </p>
      </div>

      {/* ── Getting Started ── */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-impact/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-impact" />
          </div>
          <h2 className="text-lg font-semibold text-navy">Getting Started</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gettingStartedCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="w-10 h-10 rounded-xl bg-impact/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-impact" />
                </div>
                <h3 className="text-[15px] font-semibold text-navy mb-2">{card.title}</h3>
                <p className="text-sm text-navy/50 leading-relaxed flex-1">{card.description}</p>
                <Link
                  href={card.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-impact hover:text-impact-light transition-colors"
                >
                  {card.linkLabel}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-impact/10 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-impact" />
          </div>
          <h2 className="text-lg font-semibold text-navy">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              isOpen={openFaq === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </section>

      {/* ── Contact Support ── */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-impact/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-impact" />
          </div>
          <h2 className="text-lg font-semibold text-navy">Contact Support</h2>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-sm text-navy/60 leading-relaxed mb-4">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help. Send us an
            email and we&apos;ll get back to you as soon as possible.
          </p>

          <a
            href="mailto:support@mediampm.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-impact text-white text-sm font-medium rounded-xl hover:bg-impact-light transition-colors"
          >
            <Mail className="w-4 h-4" />
            support@mediampm.com
          </a>

          <p className="text-xs text-navy/40 mt-4">
            We typically respond within 24 hours during business days (Monday -- Friday, 9am -- 6pm GMT).
          </p>
        </div>
      </section>
    </div>
  )
}
