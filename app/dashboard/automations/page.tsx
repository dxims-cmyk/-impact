'use client'

import { useState } from 'react'
import {
  Zap,
  Plus,
  Play,
  Pause,
  MoreHorizontal,
  Clock,
  Users,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Settings,
  Copy,
  Trash2,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Filter,
  TrendingUp,
  Bell,
  Workflow,
} from 'lucide-react'
import { toast } from 'sonner'

// Sample automations data
const automationsData = [
  {
    id: '1',
    name: 'Speed to Lead',
    description: 'Send instant SMS when a new lead is captured from any source',
    trigger: 'Lead Created',
    actions: ['Send SMS', 'AI Qualify'],
    status: 'active',
    runsToday: 23,
    runsTotal: 1456,
    successRate: 98.5,
    lastRun: '5 min ago',
    icon: Zap,
  },
  {
    id: '2',
    name: 'AI Lead Qualification',
    description: 'Automatically score and tag leads using AI analysis',
    trigger: 'Lead Created',
    actions: ['AI Analysis', 'Update Score', 'Add Tags'],
    status: 'active',
    runsToday: 23,
    runsTotal: 1456,
    successRate: 99.2,
    lastRun: '5 min ago',
    icon: Sparkles,
  },
  {
    id: '3',
    name: 'AI Conversation Handler',
    description: 'Auto-reply to inbound messages with AI (max 3 turns)',
    trigger: 'Message Received',
    actions: ['AI Generate Reply', 'Send Message', 'Update Lead'],
    status: 'active',
    runsToday: 45,
    runsTotal: 2341,
    successRate: 94.8,
    lastRun: '2 min ago',
    icon: MessageSquare,
  },
  {
    id: '4',
    name: 'Appointment Reminder',
    description: 'Send reminder SMS 24h and 1h before scheduled appointments',
    trigger: 'Scheduled Time',
    actions: ['Send SMS', 'Send Email'],
    status: 'active',
    runsToday: 8,
    runsTotal: 567,
    successRate: 100,
    lastRun: '1 hour ago',
    icon: Calendar,
  },
  {
    id: '5',
    name: 'Weekly Performance Report',
    description: 'Generate and send AI-powered weekly report every Monday',
    trigger: 'Scheduled (Monday 7am)',
    actions: ['Generate Report', 'AI Summary', 'Send Email'],
    status: 'active',
    runsToday: 0,
    runsTotal: 12,
    successRate: 100,
    lastRun: '5 days ago',
    icon: TrendingUp,
  },
  {
    id: '6',
    name: 'Lead Decay Alert',
    description: 'Notify team when qualified leads haven\'t been contacted in 48h',
    trigger: 'Scheduled Check',
    actions: ['Check Activity', 'Send Alert', 'Update Priority'],
    status: 'paused',
    runsToday: 0,
    runsTotal: 89,
    successRate: 100,
    lastRun: '2 days ago',
    icon: AlertCircle,
  },
  {
    id: '7',
    name: 'Hot Lead Notification',
    description: 'Instant Slack notification when a lead is scored 8+',
    trigger: 'Lead Score Updated',
    actions: ['Check Score', 'Send Slack'],
    status: 'active',
    runsToday: 5,
    runsTotal: 234,
    successRate: 100,
    lastRun: '3 hours ago',
    icon: Bell,
  },
  {
    id: '8',
    name: 'Post-Call Follow-up',
    description: 'Send thank you email after completed discovery calls',
    trigger: 'Call Completed',
    actions: ['Wait 30min', 'Send Email'],
    status: 'active',
    runsToday: 3,
    runsTotal: 156,
    successRate: 97.4,
    lastRun: '4 hours ago',
    icon: Phone,
  },
]

const triggerTypes = [
  { value: 'all', label: 'All Triggers' },
  { value: 'lead', label: 'Lead Events' },
  { value: 'message', label: 'Message Events' },
  { value: 'schedule', label: 'Scheduled' },
  { value: 'call', label: 'Call Events' },
]

const templates = [
  {
    name: 'Speed to Lead',
    description: 'Instantly engage new leads with personalized SMS',
    category: 'Lead Capture',
  },
  {
    name: 'Nurture Sequence',
    description: '5-part email sequence for cold leads',
    category: 'Nurturing',
  },
  {
    name: 'Re-engagement',
    description: 'Win back leads that went cold',
    category: 'Recovery',
  },
  {
    name: 'Appointment Booking',
    description: 'Guide qualified leads to book a call',
    category: 'Conversion',
  },
]

export default function AutomationsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [triggerFilter, setTriggerFilter] = useState('all')
  const [selectedAutomation, setSelectedAutomation] = useState<typeof automationsData[0] | null>(null)

  const filteredAutomations = automationsData.filter(auto => {
    const matchesStatus = statusFilter === 'all' || auto.status === statusFilter
    return matchesStatus
  })

  const activeCount = automationsData.filter(a => a.status === 'active').length
  const totalRuns = automationsData.reduce((sum, a) => sum + a.runsToday, 0)
  const avgSuccess = automationsData.reduce((sum, a) => sum + a.successRate, 0) / automationsData.length

  const toggleStatus = (id: string) => {
    toast('Coming Soon', { description: 'Automation toggle will be available soon.' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Automations</h1>
          <p className="text-navy/60">Automate your lead nurturing and follow-up workflows</p>
        </div>
        <button className="btn-primary flex items-center gap-2 opacity-50 cursor-not-allowed" title="Coming Soon" disabled>
          <Plus className="w-4 h-4" />
          New Automation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-studio/10 flex items-center justify-center">
              <Play className="w-5 h-5 text-studio" />
            </div>
          </div>
          <p className="text-2xl font-bold text-navy mb-1">{activeCount}</p>
          <p className="text-sm text-navy/50">Active Automations</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-impact/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-impact" />
            </div>
          </div>
          <p className="text-2xl font-bold text-navy mb-1">{totalRuns}</p>
          <p className="text-sm text-navy/50">Runs Today</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-vision/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-vision" />
            </div>
          </div>
          <p className="text-2xl font-bold text-navy mb-1">{avgSuccess.toFixed(1)}%</p>
          <p className="text-sm text-navy/50">Avg Success Rate</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-camel/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-camel" />
            </div>
          </div>
          <p className="text-2xl font-bold text-navy mb-1">2.3s</p>
          <p className="text-sm text-navy/50">Avg Response Time</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {['all', 'active', 'paused'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-navy/60 hover:text-navy'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Automations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredAutomations.map((automation) => {
          const Icon = automation.icon

          return (
            <div
              key={automation.id}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-impact/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    automation.status === 'active' ? 'bg-impact/10' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${automation.status === 'active' ? 'text-impact' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy group-hover:text-impact transition-colors">
                      {automation.name}
                    </h3>
                    <p className="text-sm text-navy/50">{automation.trigger}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatus(automation.id)}
                    className="p-1"
                    title={automation.status === 'active' ? 'Pause' : 'Activate'}
                  >
                    {automation.status === 'active' ? (
                      <ToggleRight className="w-8 h-8 text-studio" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-300" />
                    )}
                  </button>
                  <button className="p-2 rounded-lg opacity-0 group-hover:opacity-50 cursor-not-allowed" title="Coming Soon" disabled>
                    <MoreHorizontal className="w-4 h-4 text-navy/60" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-navy/70 mb-4">{automation.description}</p>

              {/* Actions Flow */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {automation.actions.map((action, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-navy/5 text-xs font-medium text-navy">
                      {action}
                    </span>
                    {i < automation.actions.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-navy/30" />
                    )}
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-navy/50">
                    <span className="font-semibold text-navy">{automation.runsToday}</span> today
                  </span>
                  <span className="text-navy/50">
                    <span className="font-semibold text-navy">{automation.runsTotal}</span> total
                  </span>
                  <span className="text-navy/50">
                    <span className="font-semibold text-studio">{automation.successRate}%</span> success
                  </span>
                </div>
                <span className="text-xs text-navy/40 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {automation.lastRun}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Templates Section */}
      <div className="bg-gradient-to-br from-impact/5 to-camel/5 rounded-2xl p-6 border border-impact/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-impact flex items-center justify-center">
              <Workflow className="w-4 h-4 text-ivory" />
            </div>
            <h2 className="text-lg font-semibold text-navy">Automation Templates</h2>
          </div>
          <button className="text-sm font-medium text-navy/30 cursor-not-allowed flex items-center gap-1" title="Coming Soon" disabled>
            Browse All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((template) => (
            <button
              key={template.name}
              className="p-4 rounded-xl bg-white border border-gray-100 text-left opacity-60 cursor-not-allowed"
              title="Coming Soon"
              disabled
            >
              <span className="text-xs font-medium text-impact/70 mb-1 block">{template.category}</span>
              <h4 className="font-semibold text-navy mb-1">
                {template.name}
              </h4>
              <p className="text-sm text-navy/60">{template.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
