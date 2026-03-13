'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Search,
  MapPin,
  Loader2,
  Download,
  RefreshCw,
  Trash2,
  ArrowUpDown,
  ChevronDown,
  Globe,
  Phone,
  Star,
  AlertTriangle,
  CheckCircle2,
  Target,
} from 'lucide-react'
import {
  useOutboundLeads,
  useUpdateOutboundLead,
  useDeleteOutboundLeads,
  useSearchPlaces,
  useImportOutboundLeads,
  type OutboundLead,
} from '@/lib/hooks/use-outbound-leads'
import { EmptyState } from '@/components/ui/EmptyState'
import { toast } from 'sonner'

const statuses = [
  { value: 'all', label: 'All Statuses' },
  { value: 'to_call', label: 'To Call' },
  { value: 'called', label: 'Called' },
  { value: 'interested', label: 'Interested' },
  { value: 'booked', label: 'Booked' },
  { value: 'closed', label: 'Closed' },
  { value: 'dead', label: 'Dead' },
]

const statusStyles: Record<string, string> = {
  to_call: 'bg-impact/10 text-impact',
  called: 'bg-camel/20 text-chocolate',
  interested: 'bg-studio/10 text-studio',
  booked: 'bg-vision/10 text-vision',
  closed: 'bg-studio/20 text-studio',
  dead: 'bg-gray-100 text-gray-500',
}

const statusLabels: Record<string, string> = {
  to_call: 'To Call',
  called: 'Called',
  interested: 'Interested',
  booked: 'Booked',
  closed: 'Closed',
  dead: 'Dead',
}

function RowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-4"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-4"><div className="w-40 h-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-4"><div className="w-28 h-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-4"><div className="w-24 h-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-4"><div className="w-12 h-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-4"><div className="w-20 h-6 bg-gray-200 rounded-full" /></td>
      <td className="px-4 py-4"><div className="w-32 h-4 bg-gray-200 rounded" /></td>
    </tr>
  )
}

export default function OutboundLeadsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-impact" /></div>}>
      <OutboundLeadsContent />
    </Suspense>
  )
}

function OutboundLeadsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Search form state
  const [searchTerm, setSearchTerm] = useState('')
  const [searchLocation, setSearchLocation] = useState('')
  const [searchCount, setSearchCount] = useState(100)
  const [runId, setRunId] = useState<string | null>(null)
  const [pollStatus, setPollStatus] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<Record<string, unknown>[] | null>(null)

  // Table state
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all')
  const [filterSearch, setFilterSearch] = useState(searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(filterSearch)
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [sortField, setSortField] = useState(searchParams.get('sort') || 'created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((searchParams.get('order') || 'desc') as 'asc' | 'desc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesValue, setNotesValue] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  // Hooks
  const searchPlaces = useSearchPlaces()
  const importLeads = useImportOutboundLeads()
  const updateLead = useUpdateOutboundLead()
  const deleteLeads = useDeleteOutboundLeads()

  const queryParams = {
    page,
    limit: 50,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    search: debouncedSearch || undefined,
    sort: sortField,
    order: sortOrder,
  }

  const { data, isLoading, isFetching, refetch } = useOutboundLeads(queryParams)
  const leads = data?.leads || []
  const totalCount = data?.pagination?.total || 0
  const totalPages = data?.pagination?.pages || 1

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filterSearch), 300)
    return () => clearTimeout(timer)
  }, [filterSearch])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [filterStatus, debouncedSearch])

  // URL sync
  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (filterStatus !== 'all') params.set('status', filterStatus)
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (sortField !== 'created_at') params.set('sort', sortField)
    if (sortOrder !== 'desc') params.set('order', sortOrder)
    const newUrl = params.toString() ? `?${params.toString()}` : '/dashboard/outbound-leads'
    router.replace(newUrl, { scroll: false })
  }, [page, filterStatus, debouncedSearch, sortField, sortOrder, router])

  // Poll Apify run status
  useEffect(() => {
    if (!runId) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/outbound-leads/search?runId=${runId}`)
        const data = await res.json()
        setPollStatus(data.status)

        if (data.status === 'SUCCEEDED') {
          clearInterval(interval)
          setSearchResults(data.results || [])
          setRunId(null)
          toast.success(`Found ${data.results?.length || 0} businesses`)
        } else if (data.status === 'FAILED' || data.status === 'ABORTED' || data.status === 'TIMED-OUT') {
          clearInterval(interval)
          setRunId(null)
          toast.error(`Search ${data.status.toLowerCase()}`)
        }
      } catch {
        // Keep polling
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [runId])

  const handleStartSearch = async () => {
    if (!searchTerm.trim() || !searchLocation.trim()) {
      toast.error('Enter both a search term and location')
      return
    }
    try {
      setSearchResults(null)
      const result = await searchPlaces.mutateAsync({
        searchTerm: searchTerm.trim(),
        location: searchLocation.trim(),
        count: searchCount,
      })
      setRunId(result.runId)
      setPollStatus('RUNNING')
      toast.success('Search started — this may take a few minutes')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start search')
    }
  }

  const handleImportResults = async () => {
    if (!searchResults || searchResults.length === 0) return
    try {
      const result = await importLeads.mutateAsync({
        results: searchResults,
        searchTerm,
        searchLocation,
      })
      if (result.warning) {
        toast.warning(result.warning)
      } else {
        toast.success(`Imported ${result.imported} leads`)
      }
      if (result.dailyRemaining !== undefined) {
        toast.info(`${result.dailyRemaining} leads remaining today`)
      }
      setSearchResults(null)
      setSearchTerm('')
      setSearchLocation('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import')
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateLead.mutateAsync({ id, status: newStatus })
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleNotesBlur = async (id: string) => {
    setEditingNotes(null)
    try {
      await updateLead.mutateAsync({ id, notes: notesValue })
    } catch {
      toast.error('Failed to save notes')
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} lead(s)? This cannot be undone.`)) return
    try {
      await deleteLeads.mutateAsync(selectedIds)
      toast.success(`${selectedIds.length} lead(s) deleted`)
      setSelectedIds([])
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '10000')
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (debouncedSearch) params.set('search', debouncedSearch)

      const res = await fetch(`/api/outbound-leads?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      const allLeads: OutboundLead[] = json.leads || []

      if (allLeads.length === 0) {
        toast.error('No leads to export')
        return
      }

      const esc = (v: string | number | null | undefined): string => {
        if (v === null || v === undefined) return ''
        const s = String(v)
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
      }

      const headers = ['Business Name', 'Phone', 'Website', 'Address', 'Rating', 'Reviews', 'Category', 'Status', 'Notes', 'Search Term', 'Location']
      const rows = allLeads.map(l => [
        esc(l.business_name), esc(l.phone), esc(l.website), esc(l.address),
        esc(l.rating), esc(l.reviews_count), esc(l.category),
        esc(statusLabels[l.status] || l.status), esc(l.notes),
        esc(l.search_term), esc(l.search_location),
      ].join(','))

      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `outbound-leads-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Exported to CSV')
    } catch {
      toast.error('Export failed')
    } finally {
      setIsExporting(false)
    }
  }, [filterStatus, debouncedSearch])

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === leads.length ? [] : leads.map(l => l.id))
  }

  const isSearching = searchPlaces.isPending || !!runId

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Outbound Leads</h1>
          <p className="text-navy/60">
            {isLoading ? 'Loading...' : `${totalCount} prospects in database`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Refresh">
            <RefreshCw className={`w-4 h-4 text-navy/60 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleExport} disabled={isExporting} className="btn-secondary flex items-center gap-2">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="text-sm font-semibold text-navy/70 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-impact" />
          Find Businesses
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search term (e.g. restaurant, plumber)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isSearching}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent disabled:opacity-50"
            />
          </div>
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Location (e.g. Glasgow, Scotland)"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              disabled={isSearching}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent disabled:opacity-50"
            />
          </div>
          <div className="w-24">
            <input
              type="number"
              min={1}
              max={200}
              value={searchCount}
              onChange={(e) => setSearchCount(Math.min(200, Math.max(1, parseInt(e.target.value) || 100)))}
              disabled={isSearching}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent disabled:opacity-50"
              title="Max 200 per day"
            />
          </div>
          <button
            onClick={handleStartSearch}
            disabled={isSearching || !searchTerm.trim() || !searchLocation.trim()}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {pollStatus === 'RUNNING' ? 'Searching...' : 'Starting...'}
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search
              </>
            )}
          </button>
        </div>

        {/* Search Results Preview */}
        {searchResults && searchResults.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-navy/70">
                <CheckCircle2 className="w-4 h-4 text-studio inline mr-1" />
                Found <span className="font-semibold text-navy">{searchResults.length}</span> businesses
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSearchResults(null)}
                  className="btn-secondary text-sm py-1.5"
                >
                  Discard
                </button>
                <button
                  onClick={handleImportResults}
                  disabled={importLeads.isPending}
                  className="btn-primary text-sm py-1.5 flex items-center gap-1"
                >
                  {importLeads.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Import All
                </button>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-navy/60">Business</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-navy/60">Phone</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-navy/60">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {searchResults.slice(0, 10).map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5 text-navy">{String(r.business_name || '')}</td>
                      <td className="px-3 py-1.5 text-navy/70">{String(r.phone || '—')}</td>
                      <td className="px-3 py-1.5 text-navy/70">{r.rating ? `${r.rating}` : '—'}</td>
                    </tr>
                  ))}
                  {searchResults.length > 10 && (
                    <tr><td colSpan={3} className="px-3 py-1.5 text-navy/50 text-center">...and {searchResults.length - 10} more</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by name, phone, address..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
            />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-navy bg-white focus:outline-none focus:ring-2 focus:ring-impact cursor-pointer"
            >
              {statuses.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
            <span className="text-sm text-navy/60">{selectedIds.length} selected</span>
            <button onClick={handleBulkDelete} disabled={deleteLeads.isPending} className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50">
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length === leads.length && leads.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-impact focus:ring-impact"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">
                <button className="flex items-center gap-1 hover:text-navy" onClick={() => handleSort('business_name')}>
                  Business <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">Website</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">
                <button className="flex items-center gap-1 hover:text-navy" onClick={() => handleSort('rating')}>
                  Rating <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider min-w-[200px]">Notes</th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <>{Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}</>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-4">
                  {debouncedSearch || filterStatus !== 'all' ? (
                    <div className="text-center text-navy/50 py-8">No leads match your filters</div>
                  ) : (
                    <EmptyState
                      icon={Target}
                      title="No outbound leads yet"
                      description="Use the search above to find businesses on Google Maps and import them as prospects."
                    />
                  )}
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const hasWeakWebsite = !lead.website || lead.website === 'null'

                return (
                  <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(lead.id)}
                        onChange={() => setSelectedIds(prev => prev.includes(lead.id) ? prev.filter(x => x !== lead.id) : [...prev, lead.id])}
                        className="w-4 h-4 rounded border-gray-300 text-impact focus:ring-impact"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-navy text-sm">{lead.business_name}</p>
                        {lead.address && (
                          <p className="text-xs text-navy/50 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{lead.address}</span>
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {lead.phone ? (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(lead.phone!)
                            toast.success('Phone copied', { description: lead.phone })
                          }}
                          className="text-sm text-navy/70 hover:text-impact flex items-center gap-1"
                          title="Click to copy"
                        >
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </button>
                      ) : (
                        <span className="text-sm text-navy/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {lead.website && lead.website !== 'null' ? (
                        <a
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-vision hover:underline flex items-center gap-1 max-w-[150px] truncate"
                        >
                          <Globe className="w-3 h-3 flex-shrink-0" />
                          {lead.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                        </a>
                      ) : (
                        <span className="text-sm text-red-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          None
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {lead.rating ? (
                        <span className="text-sm text-navy flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          {Number(lead.rating).toFixed(1)}
                          {lead.reviews_count ? <span className="text-navy/40">({lead.reviews_count})</span> : null}
                        </span>
                      ) : (
                        <span className="text-sm text-navy/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className={`appearance-none pl-3 pr-7 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-impact ${statusStyles[lead.status] || 'bg-gray-100 text-gray-600'}`}
                        >
                          {statuses.filter(s => s.value !== 'all').map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingNotes === lead.id ? (
                        <input
                          autoFocus
                          type="text"
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          onBlur={() => handleNotesBlur(lead.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleNotesBlur(lead.id) }}
                          className="w-full text-sm px-2 py-1 rounded-lg border border-impact/30 focus:outline-none focus:ring-2 focus:ring-impact"
                        />
                      ) : (
                        <button
                          onClick={() => { setEditingNotes(lead.id); setNotesValue(lead.notes || '') }}
                          className="text-sm text-navy/60 hover:text-navy w-full text-left truncate block"
                          title={lead.notes || 'Click to add notes'}
                        >
                          {lead.notes || <span className="text-navy/30 italic">Add notes...</span>}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (!confirm('Delete this lead?')) return
                          deleteLeads.mutate([lead.id])
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors lg:opacity-0 lg:group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-navy/50">
              Showing <span className="font-medium text-navy">{leads.length}</span> of{' '}
              <span className="font-medium text-navy">{totalCount}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-navy/60 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) pageNum = i + 1
                else if (page <= 3) pageNum = i + 1
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
                else pageNum = page - 2 + i

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      page === pageNum ? 'bg-impact text-ivory' : 'border border-gray-200 text-navy hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-navy hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
