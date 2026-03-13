'use client'

import { Play } from 'lucide-react'
import { Timeline } from '@/components/ui/timeline'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

export function HowItWorks(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'

  const data = [
    {
      title: 'Connect',
      content: (
        <div>
          <p className={`text-sm font-semibold mb-2 transition-colors duration-700 ${dark ? 'text-white' : 'text-[#0B1220]'}`}>
            Link your ad accounts in two clicks
          </p>
          <p className={`text-sm mb-6 transition-colors duration-700 ${dark ? 'text-zinc-400' : 'text-gray-600'}`}>
            Meta, Google, TikTok, your website forms. We handle all the webhooks, routing, and technical setup. You just authorize and go.
          </p>
          <div className={`rounded-xl border p-6 transition-colors duration-700 ${
            dark ? 'border-zinc-800 bg-zinc-900/50' : 'border-gray-200 bg-white shadow-sm'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-sm">📘</div>
              <div>
                <div className={`text-sm font-medium transition-colors duration-700 ${dark ? 'text-white' : 'text-[#0B1220]'}`}>Meta Ads</div>
                <div className="text-xs text-green-500">Connected</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-sm">🔍</div>
              <div>
                <div className={`text-sm font-medium transition-colors duration-700 ${dark ? 'text-white' : 'text-[#0B1220]'}`}>Google Ads</div>
                <div className="text-xs text-green-500">Connected</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Alert',
      content: (
        <div>
          <p className={`text-sm font-semibold mb-2 transition-colors duration-700 ${dark ? 'text-white' : 'text-[#0B1220]'}`}>
            WhatsApp alert in 5 seconds
          </p>
          <p className={`text-sm mb-6 transition-colors duration-700 ${dark ? 'text-zinc-400' : 'text-gray-600'}`}>
            The moment a lead submits a form, you get their name, phone number, source, and what they want. On your phone. Before your competitor even knows.
          </p>
          {/* WhatsApp message mockup */}
          <div className={`rounded-xl border p-4 transition-colors duration-700 ${
            dark ? 'border-zinc-800 bg-zinc-900/50' : 'border-gray-200 bg-white shadow-sm'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-xs">💬</span>
              </div>
              <span className={`text-xs font-medium transition-colors duration-700 ${dark ? 'text-white' : 'text-[#0B1220]'}`}>Impact Bot</span>
              <span className={`text-[10px] transition-colors duration-700 ${dark ? 'text-zinc-600' : 'text-gray-400'}`}>Just now</span>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3">
              <p className={`text-xs leading-relaxed transition-colors duration-700 ${dark ? 'text-zinc-300' : 'text-gray-700'}`}>
                🔥 <strong>New Hot Lead</strong><br />
                Sarah Mitchell | 07XXX XXX XXX<br />
                Source: Meta Ads - Summer Campaign<br />
                &quot;Interested in premium plan&quot;<br />
                AI Score: 92/100
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Score',
      content: (
        <div>
          <p className={`text-sm font-semibold mb-2 transition-colors duration-700 ${dark ? 'text-white' : 'text-[#0B1220]'}`}>
            AI qualifies every lead automatically
          </p>
          <p className={`text-sm mb-6 transition-colors duration-700 ${dark ? 'text-zinc-400' : 'text-gray-600'}`}>
            Powered by Claude AI. Every lead is scored 1-100 based on intent, engagement, and fit. You know who to call first before you pick up the phone.
          </p>
          <div className="space-y-2">
            {[
              { name: 'Sarah Mitchell', score: 92, label: 'Hot' },
              { name: 'Emily Chen', score: 88, label: 'Hot' },
              { name: 'James Cooper', score: 74, label: 'Warm' },
            ].map((lead) => (
              <div key={lead.name} className={`flex items-center justify-between rounded-lg border p-3 transition-colors duration-700 ${
                dark ? 'border-zinc-800 bg-zinc-900/50' : 'border-gray-200 bg-white'
              }`}>
                <span className={`text-sm transition-colors duration-700 ${dark ? 'text-white' : 'text-[#0B1220]'}`}>{lead.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full bg-[#6E0F1A]" style={{ width: `${lead.score}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-[#6E0F1A]">{lead.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Close',
      content: (
        <div>
          <p className={`text-sm font-semibold mb-2 transition-colors duration-700 ${dark ? 'text-white' : 'text-[#0B1220]'}`}>
            One inbox. Every channel. Close more deals.
          </p>
          <p className={`text-sm mb-6 transition-colors duration-700 ${dark ? 'text-zinc-400' : 'text-gray-600'}`}>
            Reply via WhatsApp, SMS, email, Instagram, or Messenger from one timeline. Set up automations that follow up for you. Track every lead from click to close.
          </p>
          <div className={`rounded-xl border p-4 transition-colors duration-700 ${
            dark ? 'border-zinc-800 bg-zinc-900/50' : 'border-gray-200 bg-white shadow-sm'
          }`}>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-[#6E0F1A]">40%</div>
                <div className={`text-[10px] transition-colors duration-700 ${dark ? 'text-zinc-500' : 'text-gray-500'}`}>Higher close rate</div>
              </div>
              <div>
                <div className={`text-2xl font-bold transition-colors duration-700 ${dark ? 'text-white' : 'text-[#0B1220]'}`}>5s</div>
                <div className={`text-[10px] transition-colors duration-700 ${dark ? 'text-zinc-500' : 'text-gray-500'}`}>Response time</div>
              </div>
              <div>
                <div className={`text-2xl font-bold transition-colors duration-700 ${dark ? 'text-white' : 'text-[#0B1220]'}`}>0</div>
                <div className={`text-[10px] transition-colors duration-700 ${dark ? 'text-zinc-500' : 'text-gray-500'}`}>Leads missed</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <section id="how-it-works" className={`py-20 sm:py-28 scroll-mt-20 transition-colors duration-700 ${
      dark ? 'bg-[#0A0A0A]' : 'bg-[#FAFAF8]'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <p className={`text-sm font-medium uppercase tracking-widest text-center mb-4 ${
            dark ? 'text-zinc-500' : 'text-gray-500'
          }`}>How it works</p>
          <h2 className={`font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-4 transition-colors duration-700 ${
            dark ? 'text-white' : 'text-[#0B1220]'
          }`}>
            Live in 48 hours. Not 48 days.
          </h2>
          <p className={`text-center text-lg max-w-xl mx-auto mb-10 transition-colors duration-700 ${
            dark ? 'text-zinc-500' : 'text-gray-500'
          }`}>
            Four steps. Fully managed. No technical knowledge needed.
          </p>
        </FadeIn>

        <Timeline data={data} />

        {/* Video placeholder */}
        <FadeIn delay={0.2}>
          <div className={`mt-12 max-w-3xl mx-auto rounded-xl border aspect-video flex items-center justify-center transition-colors duration-700 ${
            dark ? 'border-zinc-800 bg-zinc-900/50' : 'border-gray-200 bg-white shadow-sm'
          }`}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#6E0F1A]/10 flex items-center justify-center mx-auto mb-3 hover:bg-[#6E0F1A]/20 transition-colors cursor-pointer">
                <Play className="w-6 h-6 text-[#6E0F1A] ml-0.5" />
              </div>
              <p className={`text-sm font-medium transition-colors duration-700 ${dark ? 'text-zinc-400' : 'text-gray-500'}`}>
                Watch the full walkthrough
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
