'use client'

import { useState, useEffect } from 'react'
import {
  Mail,
  MessageSquare,
  Phone,
  Clock,
  Globe,
  ChevronDown,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Loader2,
  Zap,
  Play,
  Pause,
  UserPlus,
  Calendar,
  Target,
  FileText,
  Tag,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useCreateAutomation,
  useUpdateAutomation,
  useAddAction,
  useUpdateAction,
  useDeleteAction,
  useReorderActions,
  useToggleAutomation,
} from '@/lib/hooks'
import { Automation, AutomationAction } from '@/types/database'

// ─── Types ───────────────────────────────────────────────────────────
interface AutomationBuilderProps {
  isOpen: boolean
  onClose: () => void
  automation?: Automation & { actions: AutomationAction[] } // null for create
}

type TriggerType = Automation['trigger_type']
type ActionType = AutomationAction['action_type']

interface LocalAction {
  id?: string // present if saved to DB
  action_type: ActionType
  action_config: Record<string, unknown>
  action_order: number
}

// ─── Constants ───────────────────────────────────────────────────────
const TRIGGER_OPTIONS: { value: TriggerType; label: string; icon: typeof Zap }[] = [
  { value: 'lead_created', label: 'Lead Created', icon: UserPlus },
  { value: 'lead_scored', label: 'Lead Scored', icon: Target },
  { value: 'lead_qualified', label: 'Lead Qualified', icon: Check },
  { value: 'appointment_booked', label: 'Appointment Booked', icon: Calendar },
  { value: 'appointment_cancelled', label: 'Appointment Cancelled', icon: X },
  { value: 'form_submitted', label: 'Form Submitted', icon: FileText },
]

const ACTION_OPTIONS: { value: ActionType; label: string; icon: typeof Mail }[] = [
  { value: 'send_email', label: 'Send Email', icon: Mail },
  { value: 'send_whatsapp', label: 'Send WhatsApp', icon: MessageSquare },
  { value: 'send_sms', label: 'Send SMS', icon: Phone },
  { value: 'send_slack', label: 'Send Slack', icon: Send },
  { value: 'add_tag', label: 'Add Tag', icon: Tag },
  { value: 'wait', label: 'Wait', icon: Clock },
  { value: 'webhook', label: 'Webhook', icon: Globe },
]

function getActionLabel(type: ActionType): string {
  return ACTION_OPTIONS.find((a) => a.value === type)?.label || type
}

function getActionIcon(type: ActionType) {
  return ACTION_OPTIONS.find((a) => a.value === type)?.icon || Zap
}

function getTriggerLabel(type: TriggerType): string {
  return TRIGGER_OPTIONS.find((t) => t.value === type)?.label || type
}

function getActionConfigSummary(type: ActionType, config: Record<string, unknown>): string {
  switch (type) {
    case 'send_email':
      return config.subject ? `Subject: ${config.subject}` : 'No subject set'
    case 'send_whatsapp':
    case 'send_sms':
    case 'send_slack':
      return config.message
        ? String(config.message).substring(0, 50) + (String(config.message).length > 50 ? '...' : '')
        : 'No message set'
    case 'add_tag':
      return config.tag ? `Tag: ${config.tag}` : 'No tag set'
    case 'wait':
      return config.minutes ? `Wait ${config.minutes} minute(s)` : 'No duration set'
    case 'webhook':
      return config.url ? String(config.url).substring(0, 50) : 'No URL set'
    default:
      return ''
  }
}

// ─── Component ───────────────────────────────────────────────────────
export default function AutomationBuilder({ isOpen, onClose, automation }: AutomationBuilderProps) {
  const isEditing = !!automation

  // Step state
  const [step, setStep] = useState(1)

  // Step 1: Trigger
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [triggerType, setTriggerType] = useState<TriggerType>('lead_created')
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>({})

  // Step 2: Actions
  const [actions, setActions] = useState<LocalAction[]>([])
  const [showActionDropdown, setShowActionDropdown] = useState(false)

  // Step 3: Review
  const [isActive, setIsActive] = useState(false)

  // Mutations
  const createAutomation = useCreateAutomation()
  const updateAutomation = useUpdateAutomation()
  const addAction = useAddAction()
  const updateAction = useUpdateAction()
  const deleteAction = useDeleteAction()
  const reorderActions = useReorderActions()
  const toggleAutomation = useToggleAutomation()

  const isSaving =
    createAutomation.isPending ||
    updateAutomation.isPending ||
    addAction.isPending ||
    toggleAutomation.isPending

  // Populate form when editing
  useEffect(() => {
    if (automation) {
      setName(automation.name)
      setDescription(automation.description || '')
      setTriggerType(automation.trigger_type)
      setTriggerConfig(
        typeof automation.trigger_config === 'object' && automation.trigger_config !== null
          ? (automation.trigger_config as Record<string, unknown>)
          : {}
      )
      setActions(
        automation.actions.map((a) => ({
          id: a.id,
          action_type: a.action_type,
          action_config:
            typeof a.action_config === 'object' && a.action_config !== null
              ? (a.action_config as Record<string, unknown>)
              : {},
          action_order: a.action_order,
        }))
      )
      setIsActive(automation.is_active)
    } else {
      setName('')
      setDescription('')
      setTriggerType('lead_created')
      setTriggerConfig({})
      setActions([])
      setIsActive(false)
    }
    setStep(1)
  }, [automation, isOpen])

  // ─── Handlers ────────────────────────────────────────────────────
  function handleAddAction(type: ActionType) {
    setActions((prev) => [
      ...prev,
      {
        action_type: type,
        action_config: {},
        action_order: prev.length,
      },
    ])
    setShowActionDropdown(false)
  }

  function handleRemoveAction(index: number) {
    setActions((prev) => {
      const next = prev.filter((_, i) => i !== index)
      return next.map((a, i) => ({ ...a, action_order: i }))
    })
  }

  function handleMoveAction(index: number, direction: 'up' | 'down') {
    setActions((prev) => {
      const next = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next.map((a, i) => ({ ...a, action_order: i }))
    })
  }

  function handleActionConfigChange(index: number, key: string, value: unknown) {
    setActions((prev) =>
      prev.map((a, i) =>
        i === index ? { ...a, action_config: { ...a.action_config, [key]: value } } : a
      )
    )
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error('Please enter an automation name')
      return
    }

    if (actions.length === 0) {
      toast.error('Please add at least one action')
      return
    }

    try {
      if (isEditing && automation) {
        // Update the automation metadata
        await updateAutomation.mutateAsync({
          id: automation.id,
          data: {
            name,
            description: description || null,
            trigger_type: triggerType,
            trigger_config: triggerConfig,
          },
        })

        // Handle action changes
        const existingIds = new Set(automation.actions.map((a) => a.id))
        const currentIds = new Set(actions.filter((a) => a.id).map((a) => a.id!))

        // Delete removed actions
        for (const existing of automation.actions) {
          if (!currentIds.has(existing.id)) {
            await deleteAction.mutateAsync({
              automationId: automation.id,
              actionId: existing.id,
            })
          }
        }

        // Add new actions (no id) and update existing ones
        for (const action of actions) {
          if (!action.id) {
            // New action
            await addAction.mutateAsync({
              automationId: automation.id,
              data: {
                action_type: action.action_type,
                action_config: action.action_config,
                action_order: action.action_order,
              },
            })
          } else if (existingIds.has(action.id)) {
            // Existing action — update
            const original = automation.actions.find((a) => a.id === action.id)
            const configChanged =
              JSON.stringify(original?.action_config) !== JSON.stringify(action.action_config)
            const orderChanged = original?.action_order !== action.action_order
            const typeChanged = original?.action_type !== action.action_type

            if (configChanged || orderChanged || typeChanged) {
              await updateAction.mutateAsync({
                automationId: automation.id,
                actionId: action.id,
                data: {
                  action_type: action.action_type,
                  action_config: action.action_config,
                  action_order: action.action_order,
                },
              })
            }
          }
        }

        // Toggle active state if changed
        if (automation.is_active !== isActive) {
          await toggleAutomation.mutateAsync(automation.id)
        }

        toast.success('Automation updated')
      } else {
        // Create new automation with actions
        await createAutomation.mutateAsync({
          name,
          description: description || undefined,
          trigger_type: triggerType,
          trigger_config: triggerConfig,
          actions: actions.map((a) => ({
            action_type: a.action_type,
            action_config: a.action_config,
            action_order: a.action_order,
          })),
        })

        toast.success('Automation created')
      }

      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong'
      toast.error(message)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-impact/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-impact" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy">
                {isEditing ? 'Edit Automation' : 'New Automation'}
              </h2>
              <p className="text-sm text-navy/50">
                Step {step} of 3 — {step === 1 ? 'Trigger' : step === 2 ? 'Actions' : 'Review'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-navy/60" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="px-6 py-3 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  s < step
                    ? 'bg-impact text-white'
                    : s === step
                    ? 'bg-impact/10 text-impact border-2 border-impact'
                    : 'bg-gray-100 text-navy/40'
                }`}
              >
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-0.5 rounded ${
                    s < step ? 'bg-impact' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {/* ─── STEP 1: TRIGGER ─────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Automation Name <span className="text-impact">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Speed to Lead SMS"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-impact focus:ring-2 focus:ring-impact/20 outline-none text-navy placeholder:text-navy/30 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Description <span className="text-navy/40">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this automation do?"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-impact focus:ring-2 focus:ring-impact/20 outline-none text-navy placeholder:text-navy/30 transition-all resize-none"
                />
              </div>

              {/* Trigger Type */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  When this happens...
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TRIGGER_OPTIONS.map((trigger) => {
                    const Icon = trigger.icon
                    const selected = triggerType === trigger.value
                    return (
                      <button
                        key={trigger.value}
                        onClick={() => {
                          setTriggerType(trigger.value)
                          setTriggerConfig({})
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          selected
                            ? 'border-impact bg-impact/5 text-impact'
                            : 'border-gray-100 hover:border-gray-200 text-navy/70 hover:text-navy'
                        }`}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-medium">{trigger.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Trigger Config: min_score for lead_scored */}
              {triggerType === 'lead_scored' && (
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">
                    Minimum Score
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={(triggerConfig.min_score as number) || ''}
                    onChange={(e) =>
                      setTriggerConfig({ ...triggerConfig, min_score: Number(e.target.value) })
                    }
                    placeholder="e.g. 7"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-impact focus:ring-2 focus:ring-impact/20 outline-none text-navy placeholder:text-navy/30 transition-all"
                  />
                  <p className="text-xs text-navy/40 mt-1">
                    Trigger when lead score reaches or exceeds this value (1-10)
                  </p>
                </div>
              )}

              {/* Trigger Config: temperature for lead_qualified */}
              {triggerType === 'lead_qualified' && (
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">
                    Temperature
                  </label>
                  <div className="flex gap-2">
                    {['hot', 'warm', 'cold'].map((temp) => (
                      <button
                        key={temp}
                        onClick={() => setTriggerConfig({ ...triggerConfig, temperature: temp })}
                        className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                          triggerConfig.temperature === temp
                            ? temp === 'hot'
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : temp === 'warm'
                              ? 'border-amber-500 bg-amber-50 text-amber-700'
                              : 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-100 hover:border-gray-200 text-navy/60'
                        }`}
                      >
                        {temp}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 2: ACTIONS ─────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-navy">
                  Actions ({actions.length})
                </p>
                <div className="relative">
                  <button
                    onClick={() => setShowActionDropdown(!showActionDropdown)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-impact text-white text-sm font-medium hover:bg-impact/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Action
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showActionDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl border border-gray-100 shadow-lg z-20 py-1">
                      {ACTION_OPTIONS.map((option) => {
                        const Icon = option.icon
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleAddAction(option.value)}
                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-navy/80 hover:bg-gray-50 hover:text-navy transition-colors"
                          >
                            <Icon className="w-4 h-4" />
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Close dropdown on outside click */}
              {showActionDropdown && (
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActionDropdown(false)}
                />
              )}

              {/* Empty state */}
              {actions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                    <Zap className="w-7 h-7 text-navy/30" />
                  </div>
                  <p className="text-sm font-medium text-navy/60 mb-1">No actions yet</p>
                  <p className="text-xs text-navy/40">
                    Click &ldquo;Add Action&rdquo; to define what happens when triggered
                  </p>
                </div>
              )}

              {/* Action cards */}
              <div className="space-y-3">
                {actions.map((action, index) => {
                  const Icon = getActionIcon(action.action_type)
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                      {/* Action header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-impact/10 flex items-center justify-center text-xs font-bold text-impact">
                            {index + 1}
                          </span>
                          <Icon className="w-4 h-4 text-navy/60" />
                          <span className="text-sm font-medium text-navy">
                            {getActionLabel(action.action_type)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveAction(index, 'up')}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ArrowUp className="w-3.5 h-3.5 text-navy/60" />
                          </button>
                          <button
                            onClick={() => handleMoveAction(index, 'down')}
                            disabled={index === actions.length - 1}
                            className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ArrowDown className="w-3.5 h-3.5 text-navy/60" />
                          </button>
                          <button
                            onClick={() => handleRemoveAction(index)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-navy/40 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Action config */}
                      <div className="px-4 py-3 space-y-2.5">
                        {renderActionConfig(action, index, handleActionConfigChange)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── STEP 3: REVIEW ──────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Summary card */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                <div>
                  <p className="text-xs font-medium text-navy/40 uppercase tracking-wider mb-1">
                    Name
                  </p>
                  <p className="text-sm font-semibold text-navy">{name}</p>
                  {description && (
                    <p className="text-sm text-navy/60 mt-0.5">{description}</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-navy/40 uppercase tracking-wider mb-1">
                    Trigger
                  </p>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-impact" />
                    <span className="text-sm font-medium text-navy">
                      {getTriggerLabel(triggerType)}
                    </span>
                    {triggerType === 'lead_scored' && triggerConfig.min_score && (
                      <span className="text-xs bg-impact/10 text-impact px-2 py-0.5 rounded-full">
                        Score &ge; {String(triggerConfig.min_score)}
                      </span>
                    )}
                    {triggerType === 'lead_qualified' && triggerConfig.temperature && (
                      <span className="text-xs bg-impact/10 text-impact px-2 py-0.5 rounded-full capitalize">
                        {String(triggerConfig.temperature)}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-navy/40 uppercase tracking-wider mb-2">
                    Actions ({actions.length})
                  </p>
                  <div className="space-y-2">
                    {actions.map((action, index) => {
                      const Icon = getActionIcon(action.action_type)
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2.5 text-sm"
                        >
                          <span className="w-5 h-5 rounded bg-impact/10 flex items-center justify-center text-[10px] font-bold text-impact">
                            {index + 1}
                          </span>
                          <Icon className="w-4 h-4 text-navy/50" />
                          <span className="font-medium text-navy">
                            {getActionLabel(action.action_type)}
                          </span>
                          <span className="text-navy/40 truncate">
                            {getActionConfigSummary(action.action_type, action.action_config)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between py-3 px-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  {isActive ? (
                    <Play className="w-5 h-5 text-studio" />
                  ) : (
                    <Pause className="w-5 h-5 text-navy/40" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-navy">
                      {isActive ? 'Active' : 'Inactive'}
                    </p>
                    <p className="text-xs text-navy/40">
                      {isActive
                        ? 'Automation will run when triggered'
                        : 'Automation is saved but will not run'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    isActive ? 'bg-studio' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                      isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-gray-100 px-6 py-4 flex items-center justify-between">
          <button
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-navy/60 hover:text-navy hover:bg-gray-100 transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && !name.trim()) {
                  toast.error('Please enter an automation name')
                  return
                }
                setStep(step + 1)
              }}
              className="px-6 py-2.5 rounded-xl bg-impact text-white text-sm font-medium hover:bg-impact/90 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-impact text-white text-sm font-medium hover:bg-impact/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {isEditing ? 'Save Changes' : 'Create Automation'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Action Config Renderer ──────────────────────────────────────────
function renderActionConfig(
  action: LocalAction,
  index: number,
  onChange: (index: number, key: string, value: unknown) => void
) {
  switch (action.action_type) {
    case 'send_email':
      return (
        <>
          <div>
            <label className="block text-xs font-medium text-navy/50 mb-1">Subject</label>
            <input
              type="text"
              value={(action.action_config.subject as string) || ''}
              onChange={(e) => onChange(index, 'subject', e.target.value)}
              placeholder="Email subject line"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-impact focus:ring-1 focus:ring-impact/20 outline-none text-sm text-navy placeholder:text-navy/30 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy/50 mb-1">Body</label>
            <textarea
              value={(action.action_config.body as string) || ''}
              onChange={(e) => onChange(index, 'body', e.target.value)}
              placeholder="Email body text. Use {{lead_name}}, {{lead_email}} for personalization."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-impact focus:ring-1 focus:ring-impact/20 outline-none text-sm text-navy placeholder:text-navy/30 transition-all resize-none"
            />
          </div>
        </>
      )

    case 'send_whatsapp':
    case 'send_sms':
    case 'send_slack':
      return (
        <div>
          <label className="block text-xs font-medium text-navy/50 mb-1">Message</label>
          <textarea
            value={(action.action_config.message as string) || ''}
            onChange={(e) => onChange(index, 'message', e.target.value)}
            placeholder={`${
              action.action_type === 'send_whatsapp'
                ? 'WhatsApp'
                : action.action_type === 'send_sms'
                ? 'SMS'
                : 'Slack'
            } message. Use {{lead_name}}, {{lead_email}} for personalization.`}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-impact focus:ring-1 focus:ring-impact/20 outline-none text-sm text-navy placeholder:text-navy/30 transition-all resize-none"
          />
        </div>
      )

    case 'add_tag':
      return (
        <div>
          <label className="block text-xs font-medium text-navy/50 mb-1">Tag Name</label>
          <input
            type="text"
            value={(action.action_config.tag as string) || ''}
            onChange={(e) => onChange(index, 'tag', e.target.value)}
            placeholder="e.g. hot-lead, needs-follow-up"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-impact focus:ring-1 focus:ring-impact/20 outline-none text-sm text-navy placeholder:text-navy/30 transition-all"
          />
        </div>
      )

    case 'wait':
      return (
        <div>
          <label className="block text-xs font-medium text-navy/50 mb-1">Wait Duration (minutes)</label>
          <input
            type="number"
            min={1}
            value={(action.action_config.minutes as number) || ''}
            onChange={(e) => onChange(index, 'minutes', Number(e.target.value))}
            placeholder="e.g. 30"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-impact focus:ring-1 focus:ring-impact/20 outline-none text-sm text-navy placeholder:text-navy/30 transition-all"
          />
          <p className="text-[11px] text-navy/40 mt-1">
            How long to wait before the next action
          </p>
        </div>
      )

    case 'webhook':
      return (
        <div>
          <label className="block text-xs font-medium text-navy/50 mb-1">Webhook URL</label>
          <input
            type="url"
            value={(action.action_config.url as string) || ''}
            onChange={(e) => onChange(index, 'url', e.target.value)}
            placeholder="https://example.com/webhook"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-impact focus:ring-1 focus:ring-impact/20 outline-none text-sm text-navy placeholder:text-navy/30 transition-all"
          />
        </div>
      )

    default:
      return (
        <p className="text-xs text-navy/40 italic">No configuration needed</p>
      )
  }
}
