'use client'

import { Sparkles, TrendingUp, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react'
import { useState } from 'react'

interface Insight {
  type: 'success' | 'warning' | 'recommendation'
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
}

// Demo insights - replace with AI-generated
const demoInsights: Insight[] = [
  {
    type: 'success',
    title: 'Strong week for lead quality',
    description: 'Hot leads are up 40% compared to last week. Your Meta campaign "Spring Promo" is driving most high-intent traffic.',
  },
  {
    type: 'warning',
    title: 'Response time slipping',
    description: 'Average first response time is now 4.2 hours. Speed-to-lead automation could help recover 15% more leads.',
    action: {
      label: 'Enable automation',
      href: '/dashboard/automations',
    },
  },
  {
    type: 'recommendation',
    title: 'Consider increasing budget',
    description: 'Your CPL dropped 18% this week. At current ROAS of 3.2x, increasing spend by £500/week could yield 20+ additional leads.',
    action: {
      label: 'View campaigns',
      href: '/dashboard/campaigns',
    },
  },
]

function InsightCard({ insight }: { insight: Insight }) {
  const icons = {
    success: TrendingUp,
    warning: AlertTriangle,
    recommendation: Sparkles,
  }
  
  const colors = {
    success: 'text-green-600 bg-green-50',
    warning: 'text-amber-600 bg-amber-50',
    recommendation: 'text-brand-600 bg-brand-50',
  }
  
  const Icon = icons[insight.type]
  
  return (
    <div className="p-4 rounded-lg bg-gray-50">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colors[insight.type]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{insight.title}</h4>
          <p className="mt-1 text-sm text-gray-600">{insight.description}</p>
          {insight.action && (
            <a 
              href={insight.action.href}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              {insight.action.label}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export function AIInsights() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsRefreshing(false)
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="space-y-3">
        {demoInsights.map((insight, index) => (
          <InsightCard key={index} insight={insight} />
        ))}
      </div>
      
      <p className="mt-4 text-xs text-gray-400 text-center">
        Updated 5 minutes ago
      </p>
    </div>
  )
}
