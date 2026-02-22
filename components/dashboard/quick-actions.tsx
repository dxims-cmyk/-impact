'use client'

import { useState } from 'react'
import { Plus, Upload, Link2, Calendar, ChevronDown } from 'lucide-react'

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false)
  
  const actions = [
    { icon: Plus, label: 'Add Lead', href: '/dashboard/leads/new' },
    { icon: Upload, label: 'Import Leads', href: '/dashboard/leads/import' },
    { icon: Link2, label: 'Get Form Link', href: '/dashboard/settings/forms' },
    { icon: Calendar, label: 'Book Meeting', href: '/dashboard/calendar' },
  ]
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-primary flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Quick Actions
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 animate-fade-in">
            {actions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                <action.icon className="w-4 h-4 text-gray-400" />
                {action.label}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
