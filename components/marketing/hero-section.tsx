'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { ContainerScrollAnimation } from '@/components/ui/container-scroll-animation'

const stagger = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
}

export function HeroSection(): React.JSX.Element {
  return (
    <section className="relative pt-28 sm:pt-36 lg:pt-44 pb-20 sm:pb-28 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#E8642C]/[0.04] rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#0B1220]/[0.03] rounded-full blur-[100px] -translate-x-1/3 translate-y-1/4" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8642C]/10 text-[#E8642C] text-xs font-medium mb-6 sm:mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              Lead management that actually works
            </div>
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-extrabold text-[#0B1220] leading-[1.1] tracking-tight mb-6"
          >
            Stop Losing the Leads{' '}
            <span className="text-[#E8642C]">You Paid For</span>
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10"
          >
            WhatsApp alerts in 5 seconds. AI lead scoring. One inbox for everything.
            Turn your ad spend into booked appointments.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#E8642C] text-white font-semibold text-base hover:bg-[#d55a25] transition-all shadow-lg shadow-[#E8642C]/20 hover:shadow-xl hover:shadow-[#E8642C]/25 hover:-translate-y-0.5"
            >
              Book a Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-gray-200 text-[#0B1220] font-medium text-base hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              See How It Works
            </a>
          </motion.div>
        </div>

        {/* Dashboard preview with 3D scroll */}
        <motion.div
          custom={4}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="mt-16 sm:mt-20 max-w-5xl mx-auto"
        >
          <ContainerScrollAnimation>
            <div className="relative rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/60 overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/80">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <div className="ml-3 h-5 w-52 rounded-md bg-gray-100 flex items-center px-2.5">
                  <span className="text-[9px] text-gray-400 font-medium">driveimpact.io/dashboard</span>
                </div>
              </div>

              {/* Dashboard */}
              <div className="flex">
                {/* Navy sidebar strip */}
                <div className="hidden sm:flex flex-col items-center w-12 bg-[#0B1220] py-4 gap-3 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-[#E8642C] flex items-center justify-center mb-1">
                    <span className="text-[8px] font-extrabold text-white tracking-tight">IE</span>
                  </div>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-white/10' : ''}`}>
                      <div className={`w-3.5 h-3.5 rounded ${i === 0 ? 'bg-white/70' : 'bg-white/20'}`} />
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 p-4 sm:p-5 bg-[#F8F9FB]">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-xs font-bold text-[#0B1220]">Dashboard</div>
                      <div className="text-[9px] text-gray-400">Welcome back, Alex</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-white border border-gray-100 flex items-center justify-center">
                        <div className="w-3 h-3 rounded bg-gray-200" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-[#E8642C]/10 flex items-center justify-center">
                        <span className="text-[7px] font-bold text-[#E8642C]">A</span>
                      </div>
                    </div>
                  </div>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                    {[
                      { label: 'Total Leads', value: '247', change: '+12%' },
                      { label: 'Cost / Lead', value: '£18.40', change: '-8%' },
                      { label: 'Booked Calls', value: '34', change: '+23%' },
                      { label: 'ROAS', value: '4.2x', change: '+15%' },
                    ].map((kpi) => (
                      <div key={kpi.label} className="rounded-xl bg-white border border-gray-100 p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="text-[9px] text-gray-400 font-medium">{kpi.label}</div>
                          <div className="w-5 h-5 rounded-md bg-[#E8642C]/10 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-sm bg-[#E8642C]/40" />
                          </div>
                        </div>
                        <div className="text-lg font-bold text-[#0B1220] leading-none">{kpi.value}</div>
                        <div className="text-[9px] font-medium text-green-500 mt-1">{kpi.change} this month</div>
                      </div>
                    ))}
                  </div>

                  {/* Pipeline + Recent Leads */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                    {/* Pipeline */}
                    <div className="sm:col-span-2 rounded-xl bg-white border border-gray-100 p-3 shadow-sm">
                      <div className="text-[10px] font-semibold text-[#0B1220] mb-2.5">Pipeline</div>
                      <div className="space-y-1.5">
                        {[
                          { stage: 'New', count: 24, width: '80%', color: '#6E0F1A' },
                          { stage: 'Qualified', count: 18, width: '60%', color: '#8B1422' },
                          { stage: 'Contacted', count: 15, width: '50%', color: '#D4A574' },
                          { stage: 'Booked', count: 12, width: '40%', color: '#2D4A3E' },
                          { stage: 'Won', count: 8, width: '27%', color: '#2D4A3E' },
                          { stage: 'Lost', count: 3, width: '10%', color: '#4A3728' },
                        ].map((s) => (
                          <div key={s.stage} className="flex items-center gap-1.5">
                            <div className="text-[8px] text-gray-400 w-12 shrink-0">{s.stage}</div>
                            <div className="flex-1 h-3 bg-gray-50 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: s.width, backgroundColor: s.color }} />
                            </div>
                            <div className="text-[8px] font-semibold text-[#0B1220] w-4 text-right">{s.count}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Leads */}
                    <div className="sm:col-span-3 rounded-xl bg-white border border-gray-100 p-3 shadow-sm">
                      <div className="text-[10px] font-semibold text-[#0B1220] mb-2.5">Recent Leads</div>
                      <div className="space-y-1.5">
                        {[
                          { initials: 'SM', name: 'Sarah Mitchell', temp: 'Hot', score: 92, summary: 'Interested in premium plan, requested callback' },
                          { initials: 'JC', name: 'James Cooper', temp: 'Warm', score: 74, summary: 'Compared pricing, downloaded brochure' },
                          { initials: 'EC', name: 'Emily Chen', temp: 'Hot', score: 88, summary: 'Booked demo for Friday, high engagement' },
                          { initials: 'MW', name: 'Marcus Williams', temp: 'Cold', score: 31, summary: 'Initial enquiry via Facebook ad' },
                        ].map((lead) => (
                          <div key={lead.name} className="flex items-center gap-2 py-0.5">
                            <div className="w-5 h-5 rounded-full bg-[#E8642C]/10 flex items-center justify-center shrink-0">
                              <span className="text-[7px] font-bold text-[#E8642C]">{lead.initials}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-semibold text-[#0B1220] truncate">{lead.name}</span>
                                <span className={`text-[7px] px-1 py-px rounded-full font-medium shrink-0 ${
                                  lead.temp === 'Hot' ? 'bg-red-50 text-red-600' :
                                  lead.temp === 'Warm' ? 'bg-amber-50 text-amber-600' :
                                  'bg-blue-50 text-blue-600'
                                }`}>{lead.temp}</span>
                                <span className="text-[7px] text-gray-300 shrink-0">AI: {lead.score}%</span>
                              </div>
                              <div className="text-[8px] text-gray-400 truncate">{lead.summary}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ContainerScrollAnimation>
        </motion.div>
      </div>
    </section>
  )
}
