'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  MessageSquare,
  Building2,
  Clock,
  Sparkles,
  ChevronDown,
  ArrowUpDown,
  Eye,
  Loader2,
  RefreshCw,
  Trash2,
  Download,
} from 'lucide-react'
import { useLeads, useDeleteLead } from '@/lib/hooks'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatRelativeTime } from '@/lib/utils'
import { NewLeadModal } from '@/components/dashboard/new-lead-modal'
import { toast } from 'sonner'
import type { Lead } from '@/types/database'

const stages = [
  { value: 'all', label: 'All Stages' },
  { value: 'new', label: 'New' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'booked', label: 'Booked' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

const temperatures = [
  { value: 'all', label: 'All Temps' },
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
]

const sources = [
  { value: 'all', label: 'All Sources' },
  { value: 'Meta Ads', label: 'Meta Ads' },
  { value: 'Google Ads', label: 'Google Ads' },
  { value: 'Organic', label: 'Organic' },
  { value: 'Referral', label: 'Referral' },
  { value: 'ManyChat', label: 'ManyChat' },
]

// Loading skeleton for table rows
function LeadRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-4"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200" />
          <div>
            <div className="w-32 h-4 bg-gray-200 rounded mb-2" />
            <div className="w-24 h-3 bg-gray-200 rounded" />
          </div>
        </div>
      </td>
      <td className="px-4 py-4"><div className="w-20 h-6 bg-gray-200 rounded-full" /></td>
      <td className="px-4 py-4"><div className="w-16 h-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-4"><div className="w-20 h-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-4"><div className="w-40 h-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-4"><div className="w-20 h-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-4"><div className="w-16 h-4 bg-gray-200 rounded" /></td>
    </tr>
  )
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-impact" /></div>}>
      <LeadsPageContent />
    </Suspense>
  )
}

function LeadsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get initial values from URL
  const initialPage = parseInt(searchParams.get('page') || '1')
  const initialStage = searchParams.get('stage') || 'all'
  const initialTemp = searchParams.get('temperature') || 'all'
  const initialSource = searchParams.get('source') || 'all'
  const initialSearch = searchParams.get('search') || ''
  const initialSort = searchParams.get('sort') || 'created_at'
  const initialOrder = (searchParams.get('order') || 'desc') as 'asc' | 'desc'

  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [stageFilter, setStageFilter] = useState(initialStage)
  const [tempFilter, setTempFilter] = useState(initialTemp)
  const [sourceFilter, setSourceFilter] = useState(initialSource)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [page, setPage] = useState(initialPage)
  const [sortField, setSortField] = useState(initialSort)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialOrder)
  const [showNewLeadModal, setShowNewLeadModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Build query params for API
  const queryParams = {
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    stage: stageFilter !== 'all' ? stageFilter as Lead['stage'] : undefined,
    temperature: tempFilter !== 'all' ? tempFilter as Lead['temperature'] : undefined,
    source: sourceFilter !== 'all' ? sourceFilter : undefined,
    sort: sortField,
    order: sortOrder,
  }

  const { data, isLoading, isFetching, refetch } = useLeads(queryParams)
  const deleteLead = useDeleteLead()
  const leads = data?.leads || []
  const totalCount = data?.pagination?.total || 0
  const totalPages = data?.pagination?.pages || Math.ceil(totalCount / 20)

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (stageFilter !== 'all') params.set('stage', stageFilter)
    if (tempFilter !== 'all') params.set('temperature', tempFilter)
    if (sourceFilter !== 'all') params.set('source', sourceFilter)
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (sortField !== 'created_at') params.set('sort', sortField)
    if (sortOrder !== 'desc') params.set('order', sortOrder)

    const newUrl = params.toString() ? `?${params.toString()}` : '/dashboard/leads'
    router.replace(newUrl, { scroll: false })
  }, [page, stageFilter, tempFilter, sourceFilter, debouncedSearch, sortField, sortOrder, router])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [stageFilter, tempFilter, sourceFilter, debouncedSearch])

  const toggleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads.map(l => l.id))
    }
  }

  const toggleSelectLead = (id: string) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(l => l !== id))
    } else {
      setSelectedLeads([...selectedLeads, id])
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

  const handleCopyPhone = (phone: string, e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(phone)
    toast.success('Phone number copied', { description: phone })
  }

  const handleDeleteLead = async (id: string, e: React.MouseEvent): Promise<void> => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this lead?')) return
    try {
      await deleteLead.mutateAsync(id)
      toast.success('Lead deleted')
      setSelectedLeads(prev => prev.filter(l => l !== id))
    } catch {
      toast.error('Failed to delete lead')
    }
  }

  const handleBulkDelete = async (): Promise<void> => {
    if (!confirm(`Delete ${selectedLeads.length} lead(s)? This cannot be undone.`)) return
    try {
      await Promise.all(selectedLeads.map(id => deleteLead.mutateAsync(id)))
      toast.success(`${selectedLeads.length} lead(s) deleted`)
      setSelectedLeads([])
    } catch {
      toast.error('Failed to delete some leads')
      refetch()
    }
  }

  const handleExport = async (): Promise<void> => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '10000')
      if (stageFilter !== 'all') params.set('stage', stageFilter)
      if (tempFilter !== 'all') params.set('temperature', tempFilter)
      if (sourceFilter !== 'all') params.set('source', sourceFilter)
      if (debouncedSearch) params.set('search', debouncedSearch)

      const res = await fetch(`/api/leads?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch leads')
      const json = await res.json()
      const allLeads: Lead[] = json.leads || []

      if (allLeads.length === 0) {
        toast.error('No leads to export')
        return
      }

      const escapeCSV = (value: string | number | null | undefined): string => {
        if (value === null || value === undefined) return ''
        const str = String(value)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Stage', 'Score', 'Temperature', 'Source', 'AI Summary', 'Created At']
      const rows = allLeads.map(lead => [
        escapeCSV(lead.first_name),
        escapeCSV(lead.last_name),
        escapeCSV(lead.email),
        escapeCSV(lead.phone),
        escapeCSV(lead.company),
        escapeCSV(lead.stage),
        escapeCSV(lead.score),
        escapeCSV(lead.temperature),
        escapeCSV(lead.source),
        escapeCSV(lead.ai_summary),
        escapeCSV(lead.created_at),
      ].join(','))

      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const date = new Date().toISOString().split('T')[0]
      link.href = url
      link.download = `leads-export-${date}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Leads exported')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export leads')
    } finally {
      setIsExporting(false)
    }
  }

  const getStageStyle = (stage: string) => {
    const styles: Record<string, string> = {
      new: 'bg-impact/10 text-impact',
      qualified: 'bg-impact-light/10 text-impact-light',
      contacted: 'bg-camel/20 text-chocolate',
      booked: 'bg-studio/10 text-studio',
      won: 'bg-studio/10 text-studio',
      lost: 'bg-gray-100 text-gray-600',
    }
    return styles[stage] || styles.new
  }

  const getTempStyle = (temp: string) => {
    const styles: Record<string, string> = {
      hot: 'bg-impact/10 text-impact',
      warm: 'bg-camel/20 text-chocolate',
      cold: 'bg-vision/10 text-vision',
    }
    return styles[temp] || styles.cold
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Leads</h1>
          <p className="text-navy/60">
            {isLoading ? 'Loading...' : `${totalCount} leads found`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-navy/60 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleExport} disabled={isExporting} className="btn-secondary flex items-center gap-2">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
          </button>
          <button onClick={() => setShowNewLeadModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
            />
          </div>

          {/* Stage Filter */}
          <div className="relative">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-navy bg-white focus:outline-none focus:ring-2 focus:ring-impact cursor-pointer"
            >
              {stages.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Temperature Filter */}
          <div className="relative">
            <select
              value={tempFilter}
              onChange={(e) => setTempFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-navy bg-white focus:outline-none focus:ring-2 focus:ring-impact cursor-pointer"
            >
              {temperatures.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Source Filter */}
          <div className="relative">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-navy bg-white focus:outline-none focus:ring-2 focus:ring-impact cursor-pointer"
            >
              {sources.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* More Filters */}
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-navy/40 opacity-50 cursor-not-allowed" title="Coming Soon" disabled>
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedLeads.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
            <span className="text-sm text-navy/60">{selectedLeads.length} selected</span>
            <button className="text-sm font-medium text-navy/30 cursor-not-allowed" title="Coming Soon" disabled>
              Send Email
            </button>
            <button className="text-sm font-medium text-navy/30 cursor-not-allowed" title="Coming Soon" disabled>
              Send SMS
            </button>
            <button className="text-sm font-medium text-navy/30 cursor-not-allowed" title="Coming Soon" disabled>
              Change Stage
            </button>
            <button className="text-sm font-medium text-navy/30 cursor-not-allowed" title="Coming Soon" disabled>
              Assign
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={deleteLead.isPending}
              className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedLeads.length === leads.length && leads.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-impact focus:ring-impact"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">
                <button
                  className="flex items-center gap-1 hover:text-navy"
                  onClick={() => handleSort('last_name')}
                >
                  Lead <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">
                <button
                  className="flex items-center gap-1 hover:text-navy"
                  onClick={() => handleSort('stage')}
                >
                  Stage <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">
                <button
                  className="flex items-center gap-1 hover:text-navy"
                  onClick={() => handleSort('score')}
                >
                  Score <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">Source</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">AI Summary</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-navy/60 uppercase tracking-wider">
                <button
                  className="flex items-center gap-1 hover:text-navy"
                  onClick={() => handleSort('created_at')}
                >
                  Created <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="w-20 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <>
                <LeadRowSkeleton />
                <LeadRowSkeleton />
                <LeadRowSkeleton />
                <LeadRowSkeleton />
                <LeadRowSkeleton />
              </>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-4">
                  {debouncedSearch || stageFilter !== 'all' || tempFilter !== 'all' || sourceFilter !== 'all' ? (
                    <div className="text-center text-navy/50 py-8">No leads match your filters</div>
                  ) : (
                    <EmptyState
                      icon={Users}
                      title="No leads yet"
                      description="Leads will appear here when someone fills out your form, comes through an ad, or is added manually."
                      actionLabel="+ New Lead"
                      onAction={() => setShowNewLeadModal(true)}
                    />
                  )}
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'
                const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'

                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={() => toggleSelectLead(lead.id)}
                        className="w-4 h-4 rounded border-gray-300 text-impact focus:ring-impact"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/dashboard/leads/${lead.id}`} className="block">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center text-sm font-semibold text-navy">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-navy group-hover:text-impact transition-colors">
                              {name}
                            </p>
                            {lead.company && (
                              <div className="flex items-center gap-2 text-sm text-navy/50">
                                <Building2 className="w-3 h-3" />
                                {lead.company}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStageStyle(lead.stage)}`}>
                        {lead.stage}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {lead.temperature && (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getTempStyle(lead.temperature)}`}>
                            {lead.temperature}
                          </span>
                        )}
                        {lead.score && (
                          <span className="text-sm font-medium text-navy">{lead.score}/10</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-navy/70">{lead.source || '-'}</span>
                    </td>
                    <td className="px-4 py-4 max-w-[250px]">
                      {lead.ai_summary ? (
                        <p className="text-sm text-navy/70 truncate flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-impact flex-shrink-0" />
                          {lead.ai_summary}
                        </p>
                      ) : (
                        <span className="text-sm text-navy/40">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-navy/50 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatRelativeTime(lead.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {lead.phone ? (
                          <button
                            onClick={(e) => handleCopyPhone(lead.phone!, e)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title={`Copy: ${lead.phone}`}
                          >
                            <Phone className="w-4 h-4 text-navy/60" />
                          </button>
                        ) : (
                          <span className="p-2 opacity-30"><Phone className="w-4 h-4 text-navy/60" /></span>
                        )}
                        {lead.email ? (
                          <a
                            href={`mailto:${lead.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title={`Email: ${lead.email}`}
                          >
                            <Mail className="w-4 h-4 text-navy/60" />
                          </a>
                        ) : (
                          <span className="p-2 opacity-30"><Mail className="w-4 h-4 text-navy/60" /></span>
                        )}
                        <Link
                          href="/dashboard/conversations"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Conversations"
                        >
                          <MessageSquare className="w-4 h-4 text-navy/60" />
                        </Link>
                        <Link
                          href={`/dashboard/leads/${lead.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-navy/60" />
                        </Link>
                        <button
                          onClick={(e) => handleDeleteLead(lead.id, e)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-navy/50">
            {isLoading ? (
              'Loading...'
            ) : (
              <>
                Showing <span className="font-medium text-navy">{leads.length}</span> of{' '}
                <span className="font-medium text-navy">{totalCount}</span> leads
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-navy/60 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {totalPages > 0 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  disabled={isLoading}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    page === pageNum
                      ? 'bg-impact text-ivory'
                      : 'border border-gray-200 text-navy hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-navy hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <NewLeadModal
        isOpen={showNewLeadModal}
        onClose={() => {
          setShowNewLeadModal(false)
          refetch()
        }}
      />
    </div>
  )
}
