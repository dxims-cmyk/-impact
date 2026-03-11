'use client'

import { useState } from 'react'
import {
  Zap,
  Plus,
  Play,
  Pause,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  Target,
  Trash2,
  Edit2,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Workflow,
  UserPlus,
  FileText,
  Loader2,
  AlertCircle,
  Send,
  Tag,
  Globe,
  Check,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAutomations, useAutomation, useToggleAutomation, useDeleteAutomation } from '@/lib/hooks'
import { usePlan } from '@/lib/hooks/use-plan'
import { FeatureGate } from '@/components/ui/FeatureGate'
import AutomationBuilder from '@/components/automations/AutomationBuilder'
import { Automation, AutomationAction } from '@/types/database'
import { useQuery } from '@tanstack/react-query'

// ─── Trigger / Action display helpers ────────────────────────────────
type TriggerType = Automation['trigger_type']
type ActionType = AutomationAction['action_type']

const TRIGGER_META: Record<TriggerType, { label: string; icon: typeof Zap }> = {
  lead_created: { label: 'Lead Created', icon: UserPlus },
  lead_scored: { label: 'Lead Scored', icon: Target },
  lead_qualified: { label: 'Lead Qualified', icon: Check },
  appointment_booked: { label: 'Appointment Booked', icon: Calendar },
  appointment_cancelled: { label: 'Appointment Cancelled', icon: X },
  form_submitted: { label: 'Form Submitted', icon: FileText },
  tag_added: { label: 'Tag Added', icon: Tag },
}

const ACTION_META: Record<ActionType, { label: string; icon: typeof Mail }> = {
  send_email: { label: 'Email', icon: Mail },
  send_whatsapp: { label: 'WhatsApp', icon: MessageSquare },
  send_sms: { label: 'SMS', icon: Phone },
  send_slack: { label: 'Slack', icon: Send },
  add_tag: { label: 'Tag', icon: Tag },
  assign_user: { label: 'Assign', icon: UserPlus },
  create_task: { label: 'Task', icon: FileText },
  wait: { label: 'Wait', icon: Clock },
  webhook: { label: 'Webhook', icon: Globe },
}

// ─── Run History Component ───────────────────────────────────────────
function RunHistory({ automationId }: { automationId: string }): React.JSX.Element {
  const { data, isLoading } = useQuery({
    queryKey: ['automation-runs', automationId],
    queryFn: async () => {
      const res = await fetch(`/api/automations/${automationId}/runs`)
      if (!res.ok) throw new Error('Failed to fetch runs')
      return res.json() as Promise<{ runs: { id: string; status: string; started_at: string; completed_at: string | null; error: string | null }[] }>
    },
  })

  if (isLoading) {
    return (
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-navy/40">
          <Loader2 className="w-3 h-3 animate-spin" />
          Loading run history...
        </div>
      </div>
    )
  }

  const runs = data?.runs || []

  if (runs.length === 0) {
    return (
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-xs text-navy/40">No runs yet</p>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-100">
      <div className="px-4 py-2">
        <p className="text-[10px] font-medium text-navy/40 uppercase tracking-wider">Recent Runs</p>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {runs.map((run) => (
          <div key={run.id} className="px-4 py-2 flex items-center justify-between text-xs hover:bg-gray-50/50">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${
                run.status === 'completed' ? 'bg-green-500' :
                run.status === 'failed' ? 'bg-red-500' :
                run.status === 'running' ? 'bg-amber-500 animate-pulse' :
                'bg-gray-300'
              }`} />
              <span className="text-navy/70 capitalize">{run.status}</span>
            </div>
            <div className="flex items-center gap-3">
              {run.error && (
                <span className="text-red-500 truncate max-w-[200px]" title={run.error}>
                  {run.error.length > 40 ? run.error.substring(0, 40) + '...' : run.error}
                </span>
              )}
              <span className="text-navy/40 whitespace-nowrap">
                {new Date(run.started_at).toLocaleDateString()} {new Date(run.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page Component ──────────────────────────────────────────────────
export default function AutomationsPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editAutomationId, setEditAutomationId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [expandedRunHistory, setExpandedRunHistory] = useState<string | null>(null)

  // Plan check
  const { hasFeature } = usePlan()

  // Data fetching
  const { data, isLoading, error } = useAutomations()
  const toggleAutomation = useToggleAutomation()
  const deleteAutomation = useDeleteAutomation()

  // Fetch single automation for editing (with actions)
  const { data: editAutomationData, isLoading: editLoading } = useAutomation(editAutomationId || '')

  const automations = data?.automations || []

  // Filter
  const filteredAutomations = automations.filter((a) => {
    if (statusFilter === 'active') return a.is_active
    if (statusFilter === 'inactive') return !a.is_active
    return true
  })

  // Stats
  const activeCount = automations.filter((a) => a.is_active).length
  const totalActions = automations.reduce((sum, a) => sum + (a.action_count || 0), 0)
  const totalRuns = automations.reduce((sum, a) => sum + (a.recent_run_count || 0), 0)

  // Handlers
  function handleToggle(id: string) {
    toggleAutomation.mutate(id, {
      onError: (err) => toast.error(err.message),
    })
  }

  function handleEdit(id: string) {
    setEditAutomationId(id)
    setBuilderOpen(true)
  }

  function handleDelete(id: string) {
    deleteAutomation.mutate(id, {
      onSuccess: () => {
        toast.success('Automation deleted')
        setDeleteConfirmId(null)
      },
      onError: (err) => toast.error(err.message),
    })
  }

  function handleCloseBuilder() {
    setBuilderOpen(false)
    setEditAutomationId(null)
  }

  // ─── Loading state ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-40 bg-gray-200 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-gray-200 rounded-xl animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse mb-3" />
              <div className="h-7 w-16 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 animate-pulse" />
                <div>
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-4" />
              <div className="flex gap-2 mb-4">
                <div className="h-6 w-16 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-6 w-16 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Error state ───────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Automations</h1>
          <p className="text-navy/60">Automate your lead nurturing and follow-up workflows</p>
        </div>
        <div className="bg-white rounded-2xl p-8 border border-red-100 shadow-sm text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-navy mb-1">Failed to load automations</p>
          <p className="text-xs text-navy/50">{error.message}</p>
        </div>
      </div>
    )
  }

  // ─── Main render ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Automations</h1>
          <p className="text-navy/60">Automate your lead nurturing and follow-up workflows</p>
        </div>
        <button
          onClick={() => {
            if (!hasFeature('advanced_automations')) {
              toast.error('Automations require the Growth plan or higher')
              return
            }
            setEditAutomationId(null)
            setBuilderOpen(true)
          }}
          className={`btn-primary flex items-center gap-2 self-start sm:self-auto ${!hasFeature('advanced_automations') ? 'opacity-50' : ''}`}
        >
          <Plus className="w-4 h-4" />
          New Automation
        </button>
      </div>

      {/* Plan gate banner for Core users */}
      {!hasFeature('advanced_automations') && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">Automations are a Growth feature</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Upgrade to Growth or Pro to create and run automations. Contact AM:PM Media to upgrade your plan.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <p className="text-2xl font-bold text-navy mb-1">{totalActions}</p>
          <p className="text-sm text-navy/50">Total Actions</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-vision/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-vision" />
            </div>
          </div>
          <p className="text-2xl font-bold text-navy mb-1">{totalRuns}</p>
          <p className="text-sm text-navy/50">Runs (Last 30 Days)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'active', 'inactive'] as const).map((status) => (
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
        <span className="text-sm text-navy/40">
          {filteredAutomations.length} automation{filteredAutomations.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Empty state */}
      {filteredAutomations.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-impact/10 flex items-center justify-center mx-auto mb-4">
            <Workflow className="w-8 h-8 text-impact" />
          </div>
          <h3 className="text-lg font-semibold text-navy mb-2">
            {statusFilter === 'all'
              ? 'No automations yet'
              : `No ${statusFilter} automations`}
          </h3>
          <p className="text-sm text-navy/50 mb-6 max-w-md mx-auto">
            {statusFilter === 'all'
              ? 'Create your first automation to start automating lead nurturing, follow-ups, and notifications.'
              : `You don't have any ${statusFilter} automations. Try changing the filter.`}
          </p>
          {statusFilter === 'all' && (
            <button
              onClick={() => {
                setEditAutomationId(null)
                setBuilderOpen(true)
              }}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create First Automation
            </button>
          )}
        </div>
      )}

      {/* Automations Grid */}
      {filteredAutomations.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAutomations.map((automation) => {
            const trigger = TRIGGER_META[automation.trigger_type]
            const TriggerIcon = trigger?.icon || Zap
            const isToggling = toggleAutomation.isPending && toggleAutomation.variables === automation.id

            return (
              <div
                key={automation.id}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-impact/20 transition-all group"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        automation.is_active ? 'bg-impact/10' : 'bg-gray-100'
                      }`}
                    >
                      <TriggerIcon
                        className={`w-6 h-6 ${
                          automation.is_active ? 'text-impact' : 'text-gray-400'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy group-hover:text-impact transition-colors">
                        {automation.name}
                      </h3>
                      <p className="text-xs text-navy/50">
                        {trigger?.label || automation.trigger_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(automation.id)}
                      className="p-1"
                      title={automation.is_active ? 'Pause' : 'Activate'}
                      disabled={isToggling}
                    >
                      {isToggling ? (
                        <Loader2 className="w-8 h-8 text-navy/30 animate-spin" />
                      ) : automation.is_active ? (
                        <ToggleRight className="w-8 h-8 text-studio" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Description */}
                {automation.description && (
                  <p className="text-sm text-navy/70 mb-3">{automation.description}</p>
                )}

                {/* Action count badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy/5 text-xs font-medium text-navy">
                    <Zap className="w-3 h-3" />
                    {automation.action_count} action{automation.action_count !== 1 ? 's' : ''}
                  </span>
                  {automation.recent_run_count > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-studio/5 text-xs font-medium text-studio">
                      <TrendingUp className="w-3 h-3" />
                      {automation.recent_run_count} runs
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                      automation.is_active
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-navy/40'
                    }`}
                  >
                    {automation.is_active ? (
                      <>
                        <Play className="w-3 h-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3" />
                        Inactive
                      </>
                    )}
                  </span>
                </div>

                {/* Bottom row: actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-navy/40">
                      Created {new Date(automation.created_at).toLocaleDateString()}
                    </p>
                    {automation.recent_run_count > 0 && (
                      <button
                        onClick={() => setExpandedRunHistory(expandedRunHistory === automation.id ? null : automation.id)}
                        className="text-xs text-impact/70 hover:text-impact transition-colors font-medium"
                      >
                        {expandedRunHistory === automation.id ? 'Hide runs' : 'View runs'}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(automation.id)}
                      className="p-2 rounded-lg text-navy/40 hover:text-impact hover:bg-impact/5 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(automation.id)}
                      className="p-2 rounded-lg text-navy/40 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Run history (expandable) */}
                {expandedRunHistory === automation.id && (
                  <RunHistory automationId={automation.id} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-navy text-center mb-2">
              Delete Automation?
            </h3>
            <p className="text-sm text-navy/60 text-center mb-6">
              This will permanently remove this automation and all its actions. This cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-navy/60 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleteAutomation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleteAutomation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automation Builder Modal */}
      {builderOpen && editAutomationId && editLoading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseBuilder} />
          <div className="relative bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-impact animate-spin" />
            <p className="text-sm text-navy/60">Loading automation...</p>
          </div>
        </div>
      ) : (
        <AutomationBuilder
          isOpen={builderOpen && (!editAutomationId || !!editAutomationData)}
          onClose={handleCloseBuilder}
          automation={editAutomationId ? editAutomationData || undefined : undefined}
        />
      )}
    </div>
  )
}
