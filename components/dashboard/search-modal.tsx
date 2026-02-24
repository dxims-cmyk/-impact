'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  X,
  User,
  Calendar,
  FileText,
  ArrowRight,
  Loader2,
} from 'lucide-react'

interface SearchResult {
  id: string
  type: 'lead' | 'conversation' | 'appointment' | 'campaign'
  title: string
  subtitle: string
  href: string
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps): JSX.Element | null {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const router = useRouter()

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setIsLoading(false)
    } else {
      // Clean up on close
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [isOpen])

  const fetchResults = useCallback(async (searchQuery: string): Promise<void> => {
    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort()

    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    setIsLoading(true)

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery.trim())}`,
        { signal: controller.signal }
      )

      if (!res.ok) {
        setResults([])
        return
      }

      const data = await res.json()
      setResults(data.results || [])
      setSelectedIndex(0)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setResults([])
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim() || query.trim().length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    debounceRef.current = setTimeout(() => {
      fetchResults(query)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, fetchResults])

  const handleKeyDown = (e: React.KeyboardEvent): void => {
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

  const getIcon = (type: string): typeof User => {
    switch (type) {
      case 'lead': return User
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
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-impact animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-gray-400" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search leads, appointments, campaigns..."
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
            {query.trim().length < 2 ? (
              <div className="p-8 text-center text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Start typing to search...</p>
              </div>
            ) : isLoading && results.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin opacity-50" />
                <p>Searching...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p>No results found for &ldquo;{query}&rdquo;</p>
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
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">&uarr;</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">&darr;</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">&crarr;</kbd>
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
