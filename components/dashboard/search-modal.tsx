'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  X,
  User,
  MessageSquare,
  Calendar,
  FileText,
  ArrowRight,
  Command,
} from 'lucide-react'

interface SearchResult {
  id: string
  type: 'lead' | 'conversation' | 'appointment' | 'campaign'
  title: string
  subtitle: string
  href: string
}

// Mock search results - in real app this would be an API call
const mockResults: SearchResult[] = [
  { id: '1', type: 'lead', title: 'Sarah Johnson', subtitle: 'TechCorp Ltd • Hot Lead', href: '/dashboard/leads/1' },
  { id: '2', type: 'lead', title: 'James Wilson', subtitle: 'Startup.io • Warm Lead', href: '/dashboard/leads/2' },
  { id: '3', type: 'lead', title: 'Emma Davis', subtitle: 'Creative Agency • Cold Lead', href: '/dashboard/leads/3' },
  { id: '4', type: 'conversation', title: 'Sarah Johnson', subtitle: 'Last message: That sounds great!', href: '/dashboard/conversations' },
  { id: '5', type: 'appointment', title: 'Discovery Call - Sarah Johnson', subtitle: 'Tomorrow at 10:00 AM', href: '/dashboard/calendar' },
  { id: '6', type: 'campaign', title: 'Summer Sale 2024', subtitle: 'Meta Ads • Active', href: '/dashboard/campaigns' },
]

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    if (query.trim()) {
      // Filter mock results - in real app this would be an API call
      const filtered = mockResults.filter(
        r => r.title.toLowerCase().includes(query.toLowerCase()) ||
             r.subtitle.toLowerCase().includes(query.toLowerCase())
      )
      setResults(filtered)
      setSelectedIndex(0)
    } else {
      setResults([])
    }
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      router.push(results[selectedIndex].href)
      onClose()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'lead': return User
      case 'conversation': return MessageSquare
      case 'appointment': return Calendar
      case 'campaign': return FileText
      default: return User
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search leads, conversations, campaigns..."
              className="flex-1 text-lg outline-none placeholder:text-gray-400"
            />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {query.trim() === '' ? (
              <div className="p-8 text-center text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Start typing to search...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p>No results found for "{query}"</p>
              </div>
            ) : (
              <div className="p-2">
                {results.map((result, index) => {
                  const Icon = getIcon(result.type)
                  return (
                    <button
                      key={result.id}
                      onClick={() => {
                        router.push(result.href)
                        onClose()
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                        index === selectedIndex ? 'bg-impact/10' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        index === selectedIndex ? 'bg-impact text-ivory' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-navy truncate">{result.title}</p>
                        <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                      </div>
                      <ArrowRight className={`w-4 h-4 ${
                        index === selectedIndex ? 'text-impact' : 'text-gray-300'
                      }`} />
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">↵</kbd>
                to select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">esc</kbd>
              to close
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
