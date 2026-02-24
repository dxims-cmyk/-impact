'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@/lib/hooks'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  X,
  Loader2,
  Save,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  Palette,
  MousePointerClick,
  Code2,
  FormInput,
  Moon,
  Sun,
} from 'lucide-react'
import Link from 'next/link'

// ---------- Types ----------

interface FormField {
  id: string
  label: string
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select'
  required: boolean
  enabled: boolean
  placeholder?: string
  options?: string[]
  isDefault?: boolean
}

interface FormAppearance {
  title: string
  subtitle: string
  submitButtonText: string
  accentColor: string
  darkMode: boolean
}

interface FormBehavior {
  successMessage: string
  redirectUrl: string
  enableRecaptcha: boolean
}

interface FormEmbed {
  type: 'inline' | 'popup'
  width: 'full' | 'fixed'
  fixedWidth: number
}

interface FormConfig {
  fields: FormField[]
  appearance: FormAppearance
  behavior: FormBehavior
  embed: FormEmbed
}

const DEFAULT_CONFIG: FormConfig = {
  fields: [
    { id: 'name', label: 'Name', type: 'text', required: true, enabled: true, placeholder: 'Your full name', isDefault: true },
    { id: 'email', label: 'Email', type: 'email', required: true, enabled: true, placeholder: 'you@example.com', isDefault: true },
    { id: 'phone', label: 'Phone', type: 'tel', required: false, enabled: true, placeholder: '+44 7700 900000', isDefault: true },
    { id: 'company', label: 'Company', type: 'text', required: false, enabled: true, placeholder: 'Your company', isDefault: true },
    { id: 'message', label: 'Message', type: 'textarea', required: false, enabled: true, placeholder: 'How can we help?', isDefault: true },
  ],
  appearance: {
    title: 'Get in Touch',
    subtitle: 'Fill out the form below and we\'ll get back to you shortly.',
    submitButtonText: 'Submit',
    accentColor: '#6E0F1A',
    darkMode: false,
  },
  behavior: {
    successMessage: 'Thank you! We\'ll be in touch soon.',
    redirectUrl: '',
    enableRecaptcha: false,
  },
  embed: {
    type: 'inline',
    width: 'full',
    fixedWidth: 500,
  },
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Text',
  email: 'Email',
  tel: 'Phone',
  textarea: 'Text Area',
  select: 'Dropdown',
}

// ---------- Component ----------

export default function FormsSettingsPage() {
  const queryClient = useQueryClient()

  // Local state for form editing
  const [config, setConfig] = useState<FormConfig>(DEFAULT_CONFIG)
  const [hasChanges, setHasChanges] = useState(false)
  const [showAddField, setShowAddField] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)

  // New field form state
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState<FormField['type']>('text')
  const [newFieldRequired, setNewFieldRequired] = useState(false)
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('')

  // Fetch org for slug
  const { data: organization } = useOrganization()
  const orgSlug = (organization as any)?.slug || ''

  // Fetch form config
  const { data: serverConfig, isLoading } = useQuery<FormConfig>({
    queryKey: ['form-config'],
    queryFn: async () => {
      const res = await fetch('/api/settings/forms')
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch form config')
      }
      return res.json()
    },
  })

  // Sync server config to local state
  useEffect(() => {
    if (serverConfig) {
      setConfig(serverConfig)
      setHasChanges(false)
    }
  }, [serverConfig])

  // Update form config mutation
  const updateConfig = useMutation({
    mutationFn: async (configUpdate: Partial<FormConfig>) => {
      const res = await fetch('/api/settings/forms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configUpdate),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update form config')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-config'] })
      setHasChanges(false)
      toast.success('Form settings saved')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Helper to update config and mark dirty
  const updateLocalConfig = useCallback((updater: (prev: FormConfig) => FormConfig) => {
    setConfig((prev) => {
      const next = updater(prev)
      setHasChanges(true)
      return next
    })
  }, [])

  // ---------- Field operations ----------

  const toggleFieldEnabled = (fieldId: string) => {
    updateLocalConfig((prev) => ({
      ...prev,
      fields: prev.fields.map((f) =>
        f.id === fieldId ? { ...f, enabled: !f.enabled } : f
      ),
    }))
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    updateLocalConfig((prev) => {
      const fields = [...prev.fields]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= fields.length) return prev
      ;[fields[index], fields[targetIndex]] = [fields[targetIndex], fields[index]]
      return { ...prev, fields }
    })
  }

  const removeField = (fieldId: string) => {
    updateLocalConfig((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== fieldId),
    }))
  }

  const addCustomField = () => {
    if (!newFieldLabel.trim()) {
      toast.error('Field label is required')
      return
    }

    const fieldId = `custom_${Date.now()}`
    const newField: FormField = {
      id: fieldId,
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      enabled: true,
      placeholder: newFieldPlaceholder.trim() || undefined,
      isDefault: false,
    }

    updateLocalConfig((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }))

    // Reset form
    setNewFieldLabel('')
    setNewFieldType('text')
    setNewFieldRequired(false)
    setNewFieldPlaceholder('')
    setShowAddField(false)
    toast.success('Custom field added')
  }

  // ---------- Save ----------

  const handleSave = () => {
    updateConfig.mutate(config)
  }

  // ---------- Embed code ----------

  const embedCode = `<script src="https://impact-full.vercel.app/api/embed/form?org=${encodeURIComponent(orgSlug)}&accent=${encodeURIComponent(config.appearance.accentColor)}&title=${encodeURIComponent(config.appearance.title)}&subtitle=${encodeURIComponent(config.appearance.subtitle)}&btn=${encodeURIComponent(config.appearance.submitButtonText)}"></script>`

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied(true)
      toast.success('Embed code copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy embed code')
    }
  }

  // ---------- Loading ----------

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-navy/60" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-navy">Form Builder</h1>
            <p className="text-navy/60">Loading...</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-5 w-40 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded-xl" />
            <div className="h-10 bg-gray-200 rounded-xl" />
            <div className="h-10 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-navy/60" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-navy">Form Builder</h1>
            <p className="text-navy/60">Customize your lead capture form</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || updateConfig.isPending}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateConfig.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left column: Settings */}
        <div className="space-y-6">
          {/* Form Fields Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-impact/10 flex items-center justify-center">
                <FormInput className="w-5 h-5 text-impact" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy">Form Fields</h2>
                <p className="text-sm text-navy/50">Configure which fields appear on your form</p>
              </div>
            </div>

            <div className="space-y-2">
              {config.fields.map((field, index) => {
                const isLocked = field.isDefault && (field.id === 'name' || field.id === 'email')
                return (
                  <div
                    key={field.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      field.enabled
                        ? 'border-gray-200 bg-white'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <GripVertical className="w-4 h-4 text-navy/20 flex-shrink-0" />

                    {/* Toggle */}
                    <button
                      onClick={() => !isLocked && toggleFieldEnabled(field.id)}
                      disabled={isLocked}
                      className={`flex-shrink-0 ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title={isLocked ? 'This field cannot be disabled' : field.enabled ? 'Disable field' : 'Enable field'}
                    >
                      {field.enabled ? (
                        <ToggleRight className="w-8 h-5 text-impact" />
                      ) : (
                        <ToggleLeft className="w-8 h-5 text-gray-300" />
                      )}
                    </button>

                    {/* Label */}
                    <span className={`font-medium text-sm flex-1 ${field.enabled ? 'text-navy' : 'text-navy/40'}`}>
                      {field.label}
                    </span>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {field.required && (
                        <span className="px-2 py-0.5 rounded-full bg-impact/10 text-impact text-xs font-medium">
                          Required
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-navy/5 text-navy/50 text-xs font-medium">
                        {FIELD_TYPE_LABELS[field.type] || field.type}
                      </span>
                    </div>

                    {/* Reorder buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => moveField(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-navy/50" />
                      </button>
                      <button
                        onClick={() => moveField(index, 'down')}
                        disabled={index === config.fields.length - 1}
                        className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-navy/50" />
                      </button>
                    </div>

                    {/* Delete button (custom fields only) */}
                    {!field.isDefault && (
                      <button
                        onClick={() => removeField(field.id)}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-navy/40 hover:text-impact"
                        title="Remove field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Add Custom Field */}
            {showAddField ? (
              <div className="border border-impact/20 rounded-xl p-4 space-y-3 bg-impact/5">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-navy text-sm">Add Custom Field</h3>
                  <button
                    onClick={() => setShowAddField(false)}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-navy/50" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-navy mb-1">Label</label>
                    <input
                      type="text"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="e.g. Budget"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy mb-1">Type</label>
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as FormField['type'])}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="tel">Phone</option>
                      <option value="textarea">Text Area</option>
                      <option value="select">Dropdown</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={newFieldPlaceholder}
                    onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                    placeholder="Placeholder text (optional)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button
                      onClick={() => setNewFieldRequired(!newFieldRequired)}
                      className="flex-shrink-0"
                    >
                      {newFieldRequired ? (
                        <ToggleRight className="w-8 h-5 text-impact" />
                      ) : (
                        <ToggleLeft className="w-8 h-5 text-gray-300" />
                      )}
                    </button>
                    <span className="text-sm text-navy">Required</span>
                  </label>
                  <button
                    onClick={addCustomField}
                    className="btn-primary text-sm px-4 py-1.5"
                  >
                    Add Field
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddField(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-navy/50 hover:text-navy hover:border-gray-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Custom Field
              </button>
            )}
          </div>

          {/* Form Appearance Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-vision/10 flex items-center justify-center">
                <Palette className="w-5 h-5 text-vision" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy">Appearance</h2>
                <p className="text-sm text-navy/50">Style your form</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Title</label>
                <input
                  type="text"
                  value={config.appearance.title}
                  onChange={(e) =>
                    updateLocalConfig((prev) => ({
                      ...prev,
                      appearance: { ...prev.appearance, title: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Subtitle</label>
                <input
                  type="text"
                  value={config.appearance.subtitle}
                  onChange={(e) =>
                    updateLocalConfig((prev) => ({
                      ...prev,
                      appearance: { ...prev.appearance, subtitle: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Submit Button Text</label>
                <input
                  type="text"
                  value={config.appearance.submitButtonText}
                  onChange={(e) =>
                    updateLocalConfig((prev) => ({
                      ...prev,
                      appearance: { ...prev.appearance, submitButtonText: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.appearance.accentColor}
                    onChange={(e) =>
                      updateLocalConfig((prev) => ({
                        ...prev,
                        appearance: { ...prev.appearance, accentColor: e.target.value },
                      }))
                    }
                    className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.appearance.accentColor}
                    onChange={(e) => {
                      const val = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                        updateLocalConfig((prev) => ({
                          ...prev,
                          appearance: { ...prev.appearance, accentColor: val },
                        }))
                      }
                    }}
                    className="w-32 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-navy">Dark Mode</label>
                  <p className="text-xs text-navy/50">Use dark background for the form</p>
                </div>
                <button
                  onClick={() =>
                    updateLocalConfig((prev) => ({
                      ...prev,
                      appearance: { ...prev.appearance, darkMode: !prev.appearance.darkMode },
                    }))
                  }
                >
                  {config.appearance.darkMode ? (
                    <ToggleRight className="w-10 h-6 text-impact" />
                  ) : (
                    <ToggleLeft className="w-10 h-6 text-gray-300" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Form Behavior Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-studio/10 flex items-center justify-center">
                <MousePointerClick className="w-5 h-5 text-studio" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy">Behavior</h2>
                <p className="text-sm text-navy/50">Configure what happens after submission</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Success Message</label>
                <input
                  type="text"
                  value={config.behavior.successMessage}
                  onChange={(e) =>
                    updateLocalConfig((prev) => ({
                      ...prev,
                      behavior: { ...prev.behavior, successMessage: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Redirect URL (optional)</label>
                <input
                  type="url"
                  value={config.behavior.redirectUrl}
                  onChange={(e) =>
                    updateLocalConfig((prev) => ({
                      ...prev,
                      behavior: { ...prev.behavior, redirectUrl: e.target.value },
                    }))
                  }
                  placeholder="https://yoursite.com/thank-you"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                />
                <p className="text-xs text-navy/40 mt-1">Leave empty to show the success message instead</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-navy">Enable reCAPTCHA</label>
                  <p className="text-xs text-navy/50">Protect against spam submissions</p>
                </div>
                <button
                  onClick={() =>
                    updateLocalConfig((prev) => ({
                      ...prev,
                      behavior: { ...prev.behavior, enableRecaptcha: !prev.behavior.enableRecaptcha },
                    }))
                  }
                >
                  {config.behavior.enableRecaptcha ? (
                    <ToggleRight className="w-10 h-6 text-impact" />
                  ) : (
                    <ToggleLeft className="w-10 h-6 text-gray-300" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Embed & Preview */}
        <div className="space-y-6">
          {/* Embed Code Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-creative/10 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-creative" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy">Embed Code</h2>
                <p className="text-sm text-navy/50">Add this form to any website</p>
              </div>
            </div>

            {/* Embed type selector */}
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-xl text-sm font-medium bg-impact text-ivory">
                Inline
              </button>
              <button
                disabled
                className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-navy/30 cursor-not-allowed"
                title="Coming soon"
              >
                Popup
              </button>
            </div>

            {/* Code block */}
            <div className="relative">
              <pre className="bg-navy/5 rounded-xl p-4 text-xs font-mono text-navy/70 overflow-x-auto whitespace-pre-wrap break-all">
                <code>{embedCode}</code>
              </pre>
              <button
                onClick={handleCopyEmbed}
                className="absolute top-3 right-3 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-studio" />
                ) : (
                  <Copy className="w-4 h-4 text-navy/50" />
                )}
              </button>
            </div>

            {/* Width selector (disabled) */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-navy/50">Width:</span>
              <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-impact/10 text-impact">
                Full
              </button>
              <button
                disabled
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-navy/30 cursor-not-allowed"
                title="Coming soon"
              >
                Fixed px
              </button>
            </div>

            {/* Preview button */}
            <button
              onClick={() => setShowPreview(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-navy hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview Form
            </button>
          </div>

          {/* Live Preview (inline) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center">
                <Eye className="w-5 h-5 text-navy/60" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy">Live Preview</h2>
                <p className="text-sm text-navy/50">Updates as you change settings</p>
              </div>
            </div>

            <FormPreview config={config} inline />
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setShowPreview(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between p-4 border-b border-gray-100 z-10">
              <h3 className="text-lg font-semibold text-navy">Form Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-navy/50" />
              </button>
            </div>
            <div className="p-6">
              <FormPreview config={config} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- Form Preview Component ----------

function FormPreview({ config, inline }: { config: FormConfig; inline?: boolean }) {
  const enabledFields = config.fields.filter((f) => f.enabled)
  const bgClass = config.appearance.darkMode ? 'bg-gray-900' : 'bg-white'
  const textClass = config.appearance.darkMode ? 'text-white' : 'text-navy'
  const subtitleClass = config.appearance.darkMode ? 'text-gray-400' : 'text-navy/50'
  const inputBg = config.appearance.darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-navy placeholder-gray-400'
  const labelClass = config.appearance.darkMode ? 'text-gray-300' : 'text-navy'

  return (
    <div className={`rounded-xl ${bgClass} ${inline ? '' : 'border border-gray-200'} p-6 space-y-4 transition-colors`}>
      {/* Title */}
      {config.appearance.title && (
        <h3 className={`text-xl font-bold ${textClass}`}>{config.appearance.title}</h3>
      )}

      {/* Subtitle */}
      {config.appearance.subtitle && (
        <p className={`text-sm ${subtitleClass}`}>{config.appearance.subtitle}</p>
      )}

      {/* Fields */}
      <div className="space-y-3">
        {enabledFields.map((field) => (
          <div key={field.id}>
            <label className={`block text-sm font-medium ${labelClass} mb-1`}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                placeholder={field.placeholder}
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:border-transparent ${inputBg}`}
                style={{ '--tw-ring-color': config.appearance.accentColor } as React.CSSProperties}
                disabled
              />
            ) : field.type === 'select' ? (
              <select
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:border-transparent ${inputBg}`}
                style={{ '--tw-ring-color': config.appearance.accentColor } as React.CSSProperties}
                disabled
              >
                <option>{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
                {field.options?.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                placeholder={field.placeholder}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:border-transparent ${inputBg}`}
                style={{ '--tw-ring-color': config.appearance.accentColor } as React.CSSProperties}
                disabled
              />
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <button
        className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: config.appearance.accentColor }}
        disabled
      >
        {config.appearance.submitButtonText || 'Submit'}
      </button>
    </div>
  )
}
