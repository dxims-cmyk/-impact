'use client'

import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'
import { Mail, Phone, Building2, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface Lead {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  company: string | null
  stage: string
  temperature: 'hot' | 'warm' | 'cold' | null
  score: number | null
  source: string | null
  ai_summary: string | null
  created_at: string
}

// Demo data - replace with real data fetch
const demoLeads: Lead[] = [
  {
    id: '1',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah@techcorp.com',
    phone: '+44 7700 900123',
    company: 'TechCorp Ltd',
    stage: 'qualified',
    temperature: 'hot',
    score: 9,
    source: 'meta_ads',
    ai_summary: 'High-intent lead. Mentioned scaling issues and budget approval.',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
  },
  {
    id: '2',
    first_name: 'James',
    last_name: 'Wilson',
    email: 'james@startup.io',
    phone: '+44 7700 900456',
    company: 'Startup.io',
    stage: 'new',
    temperature: 'warm',
    score: 7,
    source: 'google_ads',
    ai_summary: 'Looking for lead gen help. Timeline unclear.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: '3',
    first_name: 'Emma',
    last_name: 'Davis',
    email: 'emma@agency.co',
    phone: null,
    company: 'Creative Agency',
    stage: 'new',
    temperature: 'cold',
    score: 4,
    source: 'organic',
    ai_summary: 'Early research phase. No immediate need identified.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
]

function TemperatureBadge({ temperature }: { temperature: Lead['temperature'] }) {
  if (!temperature) return null
  
  return (
    <span className={cn(
      'badge',
      temperature === 'hot' && 'badge-hot',
      temperature === 'warm' && 'badge-warm',
      temperature === 'cold' && 'badge-cold',
    )}>
      {temperature}
    </span>
  )
}

function LeadCard({ lead }: { lead: Lead }) {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown'
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  
  return (
    <Link 
      href={`/dashboard/leads/${lead.id}`}
      className="block p-4 rounded-lg hover:bg-gray-50 transition-colors -mx-2"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0",
          lead.temperature === 'hot' && "bg-red-500",
          lead.temperature === 'warm' && "bg-amber-500",
          lead.temperature === 'cold' && "bg-blue-500",
          !lead.temperature && "bg-gray-400",
        )}>
          {initials}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 truncate">{name}</h4>
            <TemperatureBadge temperature={lead.temperature} />
            {lead.score && (
              <span className="text-xs text-gray-500">{lead.score}/10</span>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            {lead.company && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {lead.company}
              </span>
            )}
            {lead.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {lead.email.split('@')[0]}...
              </span>
            )}
          </div>
          
          {lead.ai_summary && (
            <p className="mt-2 text-sm text-gray-600 flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-500 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{lead.ai_summary}</span>
            </p>
          )}
        </div>
        
        {/* Time */}
        <span className="text-xs text-gray-400 flex-shrink-0">
          {formatRelativeTime(lead.created_at)}
        </span>
      </div>
    </Link>
  )
}

export function LeadFeed() {
  const leads = demoLeads // Replace with real data fetch
  
  if (leads.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No leads yet. They'll appear here as they come in.</p>
      </div>
    )
  }
  
  return (
    <div className="divide-y divide-gray-100">
      {leads.map(lead => (
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </div>
  )
}
