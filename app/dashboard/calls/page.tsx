'use client'

import { useState } from 'react'
import { useCalls, type Call } from '@/lib/hooks/use-calls'
import { formatRelativeTime } from '@/lib/utils'
import {
  Phone,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  ExternalLink,
  Settings,
  Loader2,
  Search,
  Filter,
} from 'lucide-react'
import Link from 'next/link'

// Format seconds as "Xm Ys"
function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '--'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-studio/10 text-studio',
    in_progress: 'bg-camel/20 text-camel',
    missed: 'bg-impact/10 text-impact',
    failed: 'bg-red-100 text-red-600',
    voicemail: 'bg-navy/10 text-navy/70',
  }

  const labels: Record<string, string> = {
    completed: 'Completed',
    in_progress: 'In Progress',
    missed: 'Missed',
    failed: 'Failed',
    voicemail: 'Voicemail',
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  )
}

// Direction icon
function DirectionIcon({ direction, status }: { direction: string; status: string }) {
  if (status === 'missed') {
    return <PhoneMissed className="w-4 h-4 text-impact" />
  }
  if (direction === 'outbound') {
    return <PhoneOutgoing className="w-4 h-4 text-navy/50" />
  }
  return <PhoneIncoming className="w-4 h-4 text-studio" />
}

// Expandable call row
function CallRow({ call }: { call: Call }) {
  const [expanded, setExpanded] = useState(false)

  const leadName = call.lead
    ? [call.lead.first_name, call.lead.last_name].filter(Boolean).join(' ') || 'Unknown'
    : call.caller_name || 'Unknown Caller'

  const summarySnippet = call.summary
    ? call.summary.length > 80
      ? call.summary.slice(0, 80) + '...'
      : call.summary
    : 'No summary available'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all">
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors text-left"
      >
        {/* Direction icon */}
        <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center flex-shrink-0">
          <DirectionIcon direction={call.direction} status={call.status} />
        </div>

        {/* Caller info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-navy truncate">{leadName}</p>
            {call.lead && (
              <Link
                href={`/dashboard/leads?id=${call.lead.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-impact hover:text-impact/80 transition-colors"
                title="View lead"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          <p className="text-sm text-navy/50 truncate">
            {call.phone_number || 'No phone number'} &middot; {summarySnippet}
          </p>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-1.5 text-navy/60 flex-shrink-0">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">{formatDuration(call.duration_seconds)}</span>
        </div>

        {/* Status */}
        <div className="flex-shrink-0">
          <StatusBadge status={call.status} />
        </div>

        {/* Date */}
        <div className="text-sm text-navy/50 flex-shrink-0 w-20 text-right">
          {formatRelativeTime(call.created_at)}
        </div>

        {/* Expand chevron */}
        <div className="flex-shrink-0">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-navy/30" />
          ) : (
            <ChevronDown className="w-5 h-5 text-navy/30" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/30">
          {/* AI Summary */}
          {call.summary && (
            <div>
              <h4 className="text-sm font-semibold text-navy mb-1">AI Summary</h4>
              <p className="text-sm text-navy/70 leading-relaxed">{call.summary}</p>
            </div>
          )}

          {/* Recording */}
          {call.recording_url && (
            <div>
              <h4 className="text-sm font-semibold text-navy mb-2">Recording</h4>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <audio
                    src={call.recording_url}
                    controls
                    className="w-full h-8"
                    style={{ filter: 'sepia(20%) saturate(70%) brightness(0.9)' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Transcript */}
          {call.transcript && (
            <div>
              <h4 className="text-sm font-semibold text-navy mb-1">Transcript</h4>
              <div className="max-h-64 overflow-y-auto rounded-xl bg-white border border-gray-100 p-3">
                <pre className="text-sm text-navy/70 whitespace-pre-wrap font-sans leading-relaxed">
                  {call.transcript}
                </pre>
              </div>
            </div>
          )}

          {/* Metadata row */}
          <div className="flex items-center gap-6 text-xs text-navy/40 pt-2 border-t border-gray-100">
            <span>Call ID: {call.vapi_call_id}</span>
            {call.ended_at && (
              <span>
                Ended: {new Date(call.ended_at).toLocaleString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
            {call.lead?.temperature && (
              <span className="capitalize">Lead temp: {call.lead.temperature}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CallsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const { data, isLoading, error } = useCalls({
    status: statusFilter || undefined,
    limit: 50,
  })

  const calls = data?.calls || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">AI Receptionist Calls</h1>
          <p className="text-navy/60">View and manage incoming calls handled by your AI receptionist</p>
        </div>
        <Link
          href="/dashboard/settings/receptionist"
          className="btn-primary flex items-center gap-2 text-sm px-4 py-2 self-start sm:self-auto"
        >
          <Settings className="w-4 h-4" />
          Configure
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-3 py-2">
          <Filter className="w-4 h-4 text-navy/40" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm text-navy bg-transparent border-none outline-none cursor-pointer"
          >
            <option value="">All Calls</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="missed">Missed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {data?.pagination && (
          <span className="text-sm text-navy/50">
            {data.pagination.total} call{data.pagination.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Call List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-48 bg-gray-200 rounded" />
                </div>
                <div className="h-4 w-12 bg-gray-200 rounded" />
                <div className="h-5 w-20 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-impact/10 flex items-center justify-center mx-auto mb-3">
            <Phone className="w-6 h-6 text-impact" />
          </div>
          <h3 className="font-semibold text-navy mb-1">Failed to load calls</h3>
          <p className="text-sm text-navy/50">{error instanceof Error ? error.message : 'Something went wrong'}</p>
        </div>
      ) : calls.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-navy/5 flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-navy/30" />
          </div>
          <h3 className="font-semibold text-navy text-lg mb-2">No calls yet</h3>
          <p className="text-sm text-navy/50 max-w-md mx-auto mb-6">
            Set up the AI Receptionist in Settings to start receiving and logging calls automatically.
          </p>
          <Link
            href="/dashboard/settings/receptionist"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-impact text-ivory text-sm font-medium hover:bg-impact/90 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Set Up AI Receptionist
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {calls.map((call) => (
            <CallRow key={call.id} call={call} />
          ))}
        </div>
      )}
    </div>
  )
}
