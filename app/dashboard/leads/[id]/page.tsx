'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Building2,
  MapPin,
  Globe,
  Clock,
  Sparkles,
  Send,
  MoreHorizontal,
  Trash2,
  User,
  Tag,
  TrendingUp,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useLead, useLeadTimeline, useUpdateLead, useQualifyLead, useDeleteLead } from '@/lib/hooks'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { LeadActivity } from '@/types/database'

// Activity icon mapping
const activityIcons: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  ai_qualified: { icon: Sparkles, color: 'text-impact', bgColor: 'bg-impact/10' },
  created: { icon: User, color: 'text-navy', bgColor: 'bg-navy/10' },
  stage_changed: { icon: TrendingUp, color: 'text-camel', bgColor: 'bg-camel/10' },
  note_added: { icon: FileText, color: 'text-vision', bgColor: 'bg-vision/10' },
  call_logged: { icon: Phone, color: 'text-studio', bgColor: 'bg-studio/10' },
  email_sent: { icon: Mail, color: 'text-vision', bgColor: 'bg-vision/10' },
  sms_sent: { icon: MessageSquare, color: 'text-studio', bgColor: 'bg-studio/10' },
  appointment_booked: { icon: Calendar, color: 'text-studio', bgColor: 'bg-studio/10' },
  appointment_completed: { icon: CheckCircle2, color: 'text-studio', bgColor: 'bg-studio/10' },
  appointment_cancelled: { icon: XCircle, color: 'text-impact', bgColor: 'bg-impact/10' },
}

// Loading skeleton
function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-200 rounded-xl" />
        <div className="flex-1">
          <div className="w-48 h-6 bg-gray-200 rounded mb-2" />
          <div className="w-32 h-4 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 h-16" />
          <div className="bg-gray-100 rounded-2xl p-6 h-48" />
          <div className="bg-white rounded-2xl p-6 border border-gray-100 h-64" />
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 h-64" />
          <div className="bg-white rounded-2xl p-6 border border-gray-100 h-48" />
        </div>
      </div>
    </div>
  )
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.id as string

  const [activeTab, setActiveTab] = useState('activity')
  const [note, setNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [showWonModal, setShowWonModal] = useState(false)
  const [showLostModal, setShowLostModal] = useState(false)
  const [dealValue, setDealValue] = useState('')
  const [lostReason, setLostReason] = useState('')

  const { data: lead, isLoading: leadLoading, refetch: refetchLead } = useLead(leadId)
  const { data: timeline, isLoading: timelineLoading, refetch: refetchTimeline } = useLeadTimeline(leadId)
  const updateLead = useUpdateLead()
  const qualifyLead = useQualifyLead()
  const deleteLead = useDeleteLead()

  const handleStageChange = async (newStage: string) => {
    try {
      await updateLead.mutateAsync({ id: leadId, data: { stage: newStage } })
      toast.success(`Stage updated to ${newStage}`)
      refetchLead()
      refetchTimeline()
    } catch (error) {
      toast.error('Failed to update stage')
    }
  }

  const handleQualify = async () => {
    try {
      await qualifyLead.mutateAsync(leadId)
      toast.success('Lead qualification started')
      refetchLead()
    } catch (error) {
      toast.error('Failed to qualify lead')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lead?')) return

    try {
      await deleteLead.mutateAsync(leadId)
      toast.success('Lead deleted')
      router.push('/dashboard/leads')
    } catch (error) {
      toast.error('Failed to delete lead')
    }
  }

  const handleAddNote = async () => {
    if (!note.trim()) return

    setIsAddingNote(true)
    try {
      await fetch(`/api/leads/${leadId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'note_added',
          content: note,
        }),
      })
      setNote('')
      toast.success('Note added')
      refetchTimeline()
    } catch (error) {
      toast.error('Failed to add note')
    } finally {
      setIsAddingNote(false)
    }
  }

  const handleMarkAsWon = async (): Promise<void> => {
    try {
      await updateLead.mutateAsync({
        id: leadId,
        data: {
          stage: 'won',
          deal_status: 'won',
          deal_value: dealValue ? parseFloat(dealValue) : undefined,
          deal_closed_at: new Date().toISOString(),
        },
      })
      toast.success('Lead marked as Won!')
      setShowWonModal(false)
      setDealValue('')
      refetchLead()
      refetchTimeline()
    } catch {
      toast.error('Failed to mark as won')
    }
  }

  const handleMarkAsLost = async (): Promise<void> => {
    try {
      await updateLead.mutateAsync({
        id: leadId,
        data: {
          stage: 'lost',
          deal_status: 'lost',
          lost_reason: lostReason || undefined,
          deal_closed_at: new Date().toISOString(),
        },
      })
      toast.success('Lead marked as Lost')
      setShowLostModal(false)
      setLostReason('')
      refetchLead()
      refetchTimeline()
    } catch {
      toast.error('Failed to mark as lost')
    }
  }

  const getStageStyle = (stage: string) => {
    const styles: Record<string, string> = {
      new: 'bg-impact/10 text-impact border-impact/20',
      qualified: 'bg-impact-light/10 text-impact-light border-impact-light/20',
      contacted: 'bg-camel/20 text-chocolate border-camel/30',
      booked: 'bg-studio/10 text-studio border-studio/20',
      won: 'bg-studio/10 text-studio border-studio/20',
      lost: 'bg-gray-100 text-gray-600 border-gray-200',
    }
    return styles[stage] || styles.new
  }

  const getTempStyle = (temp: string) => {
    const styles: Record<string, string> = {
      hot: 'bg-impact text-ivory',
      warm: 'bg-camel text-white',
      cold: 'bg-vision text-white',
    }
    return styles[temp] || styles.cold
  }

  if (leadLoading) {
    return <DetailSkeleton />
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-navy/60 mb-4">Lead not found</p>
        <Link href="/dashboard/leads" className="btn-primary">
          Back to Leads
        </Link>
      </div>
    )
  }

  const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'
  const activities = timeline || []

  // Parse AI analysis if available
  let buyingSignals: string[] = []
  let objections: string[] = []
  if (lead.ai_analysis) {
    const analysis = typeof lead.ai_analysis === 'string'
      ? JSON.parse(lead.ai_analysis)
      : lead.ai_analysis
    buyingSignals = analysis.buying_signals || analysis.buyingSignals || []
    objections = analysis.objections || []
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/leads"
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-navy" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-navy">{name}</h1>
            {lead.temperature && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTempStyle(lead.temperature)}`}>
                {lead.temperature.toUpperCase()}
              </span>
            )}
            {lead.score && (
              <span className="text-lg font-bold text-navy">{lead.score}/10</span>
            )}
          </div>
          <p className="text-navy/60">
            {lead.company || 'No company'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { refetchLead(); refetchTimeline() }}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-navy/60" />
          </button>
          <button
            onClick={handleQualify}
            disabled={qualifyLead.isPending}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Re-qualify with AI"
          >
            {qualifyLead.isPending ? (
              <Loader2 className="w-4 h-4 text-navy/60 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-impact" />
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteLead.isPending}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {deleteLead.isPending ? (
              <Loader2 className="w-4 h-4 text-navy/60 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 text-navy/60" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <a
                href={lead.phone ? `tel:${lead.phone}` : undefined}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors ${
                  lead.phone
                    ? 'bg-impact text-ivory hover:bg-impact-light'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Phone className="w-4 h-4" />
                Call
              </a>
              <a
                href={lead.email ? `mailto:${lead.email}` : undefined}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold transition-colors ${
                  lead.email
                    ? 'border-navy/20 text-navy hover:bg-navy/5'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email
              </a>
              <Link
                href="/dashboard/conversations"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-navy/20 text-navy font-semibold hover:bg-navy/5 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                SMS
              </Link>
              <Link
                href="/dashboard/calendar"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-navy/20 text-navy font-semibold hover:bg-navy/5 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Book Call
              </Link>
            </div>
          </div>

          {/* AI Summary */}
          {lead.ai_summary && (
            <div className="bg-gradient-to-br from-impact/5 to-camel/5 rounded-2xl p-6 border border-impact/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-impact flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-ivory" />
                </div>
                <h3 className="font-semibold text-navy">AI Analysis</h3>
              </div>
              <p className="text-navy/80 mb-4">{lead.ai_summary}</p>

              {(buyingSignals.length > 0 || objections.length > 0) && (
                <div className="grid grid-cols-2 gap-4">
                  {buyingSignals.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-navy/50 uppercase mb-2">Buying Signals</p>
                      <div className="space-y-1.5">
                        {buyingSignals.map((signal, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-studio">
                            <CheckCircle2 className="w-4 h-4" />
                            {signal}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {objections.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-navy/50 uppercase mb-2">Objections</p>
                      <div className="space-y-1.5">
                        {objections.map((obj, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-camel">
                            <AlertCircle className="w-4 h-4" />
                            {obj}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100">
              <div className="flex">
                {['activity', 'notes', 'emails', 'tasks'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'text-impact border-b-2 border-impact'
                        : 'text-navy/50 hover:text-navy'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'activity' && (
                <div className="space-y-4">
                  {timelineLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-navy/40 animate-spin" />
                    </div>
                  ) : !Array.isArray(activities) || activities.length === 0 ? (
                    <p className="text-center text-navy/40 py-8">No activity yet</p>
                  ) : (
                    activities.map((activity) => {
                      const iconConfig = activityIcons[activity.activity_type] || {
                        icon: FileText,
                        color: 'text-navy',
                        bgColor: 'bg-navy/10'
                      }
                      const Icon = iconConfig.icon

                      return (
                        <div key={activity.id} className="flex gap-4">
                          <div className={`w-10 h-10 rounded-xl ${iconConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-5 h-5 ${iconConfig.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-navy capitalize">
                                {activity.activity_type.replace(/_/g, ' ')}
                              </p>
                              <span className="text-xs text-navy/40">
                                {formatRelativeTime(activity.created_at)}
                              </span>
                            </div>
                            {activity.content && (
                              <p className="text-sm text-navy/60">{activity.content}</p>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div>
                  <div className="mb-4">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a note..."
                      className="w-full p-4 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleAddNote}
                        disabled={isAddingNote || !note.trim()}
                        className="btn-primary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50"
                      >
                        {isAddingNote ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Save Note
                      </button>
                    </div>
                  </div>
                  {/* Show notes from timeline */}
                  <div className="space-y-3">
                    {activities
                      .filter(a => a.activity_type === 'note_added')
                      .map((activity) => (
                        <div key={activity.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                          <p className="text-sm text-navy/80">{activity.content}</p>
                          <p className="text-xs text-navy/40 mt-2">
                            {formatRelativeTime(activity.created_at)}
                          </p>
                        </div>
                      ))}
                    {activities.filter(a => a.activity_type === 'note_added').length === 0 && (
                      <p className="text-center text-navy/40 py-4">No notes yet</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'emails' && (
                <div className="space-y-3">
                  {activities
                    .filter(a => a.activity_type === 'email_sent' || a.channel === 'email')
                    .map((activity) => (
                      <div key={activity.id} className="p-4 rounded-xl border border-gray-100">
                        {activity.subject && (
                          <p className="font-medium text-navy mb-1">{activity.subject}</p>
                        )}
                        <p className="text-sm text-navy/70">{activity.content}</p>
                        <p className="text-xs text-navy/40 mt-2">
                          {formatRelativeTime(activity.created_at)}
                        </p>
                      </div>
                    ))}
                  {activities.filter(a => a.activity_type === 'email_sent' || a.channel === 'email').length === 0 && (
                    <p className="text-center text-navy/40 py-8">No emails yet</p>
                  )}
                </div>
              )}

              {activeTab === 'tasks' && (
                <p className="text-center text-navy/40 py-8">No tasks yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-navy mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-navy/60" />
                </div>
                <div>
                  <p className="text-xs text-navy/40">Email</p>
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="text-sm text-navy hover:text-impact">
                      {lead.email}
                    </a>
                  ) : (
                    <p className="text-sm text-navy/40">Not provided</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-navy/60" />
                </div>
                <div>
                  <p className="text-xs text-navy/40">Phone</p>
                  {lead.phone ? (
                    <a href={`tel:${lead.phone}`} className="text-sm text-navy hover:text-impact">
                      {lead.phone}
                    </a>
                  ) : (
                    <p className="text-sm text-navy/40">Not provided</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-navy/60" />
                </div>
                <div>
                  <p className="text-xs text-navy/40">Company</p>
                  <p className="text-sm text-navy">{lead.company || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-navy mb-4">Lead Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-navy/40 mb-2">Stage</p>
                <select
                  value={lead.stage}
                  onChange={(e) => handleStageChange(e.target.value)}
                  disabled={updateLead.isPending}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-semibold capitalize border cursor-pointer ${getStageStyle(lead.stage)}`}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="appointment">Appointment</option>
                  <option value="proposal">Proposal</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-navy/40 mb-1">Source</p>
                <p className="text-sm text-navy">{lead.source || 'Unknown'}</p>
              </div>
              {lead.utm_campaign && (
                <div>
                  <p className="text-xs text-navy/40 mb-1">Campaign</p>
                  <p className="text-sm text-navy">{lead.utm_campaign}</p>
                </div>
              )}
              {lead.assigned_to && (
                <div>
                  <p className="text-xs text-navy/40 mb-1">Assigned To</p>
                  <p className="text-sm text-navy">{lead.assigned_to}</p>
                </div>
              )}
              {lead.deal_value && (
                <div>
                  <p className="text-xs text-navy/40 mb-1">Deal Value</p>
                  <p className="text-sm font-semibold text-studio">&pound;{Number(lead.deal_value).toLocaleString()}</p>
                </div>
              )}
              {lead.deal_status === 'lost' && lead.lost_reason && (
                <div>
                  <p className="text-xs text-navy/40 mb-1">Lost Reason</p>
                  <p className="text-sm text-navy/70">{lead.lost_reason}</p>
                </div>
              )}
              {/* Won/Lost Actions */}
              {lead.stage !== 'won' && lead.stage !== 'lost' && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowWonModal(true)}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg bg-studio/10 text-studio hover:bg-studio/20 transition-colors"
                  >
                    Mark Won
                  </button>
                  <button
                    onClick={() => setShowLostModal(true)}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg bg-gray-100 text-navy/60 hover:bg-gray-200 transition-colors"
                  >
                    Mark Lost
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-navy mb-4">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-navy/50">Created</span>
                <span className="text-navy">
                  {new Date(lead.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              {lead.qualified_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-navy/50">Qualified</span>
                  <span className="text-navy">
                    {new Date(lead.qualified_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-navy/50">Last Activity</span>
                <span className="text-navy">{formatRelativeTime(lead.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mark as Won Modal */}
      {showWonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-bold text-navy mb-1">Mark as Won</h3>
            <p className="text-sm text-navy/60 mb-4">Enter the deal value for this lead.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-navy/80 mb-1.5">Deal Value</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40">&pound;</span>
                <input
                  type="number"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-200 text-navy focus:outline-none focus:ring-2 focus:ring-studio/30 focus:border-studio"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowWonModal(false); setDealValue('') }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-navy/60 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsWon}
                disabled={updateLead.isPending}
                className="flex-1 px-4 py-2.5 rounded-lg bg-studio text-white text-sm font-semibold hover:bg-studio/90 disabled:opacity-50"
              >
                {updateLead.isPending ? 'Saving...' : 'Confirm Won'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Lost Modal */}
      {showLostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-bold text-navy mb-1">Mark as Lost</h3>
            <p className="text-sm text-navy/60 mb-4">Why was this lead lost?</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-navy/80 mb-1.5">Reason</label>
              <textarea
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-200 text-sm text-navy resize-none focus:outline-none focus:ring-2 focus:ring-impact/30 focus:border-impact"
                rows={3}
                placeholder="e.g. Budget too high, chose competitor, not ready..."
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowLostModal(false); setLostReason('') }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-navy/60 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsLost}
                disabled={updateLead.isPending}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50"
              >
                {updateLead.isPending ? 'Saving...' : 'Confirm Lost'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
