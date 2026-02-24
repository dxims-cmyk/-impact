'use client'

import { useState, useEffect } from 'react'
import { useOrganization, useUpdateOrganization } from '@/lib/hooks'
import { toast } from 'sonner'
import {
  Phone,
  MessageSquare,
  Calendar,
  ArrowRight,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  PhoneCall,
  ArrowLeft,
  Settings,
  AlertCircle,
  CheckCircle,
  Power,
} from 'lucide-react'
import Link from 'next/link'

export default function ReceptionistSettingsPage() {
  const { data: organization, isLoading: orgLoading } = useOrganization()
  const updateOrganization = useUpdateOrganization()

  // Form state
  const [enabled, setEnabled] = useState(false)
  const [greeting, setGreeting] = useState('')
  const [questions, setQuestions] = useState<string[]>([''])
  const [calendarLink, setCalendarLink] = useState('')
  const [transferNumber, setTransferNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [assistantId, setAssistantId] = useState('')
  const [saving, setSaving] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)

  // Initialize from org settings
  useEffect(() => {
    if (organization) {
      const settings = (organization.settings || {}) as Record<string, any>
      setEnabled(!!settings.ai_receptionist_enabled)
      setGreeting(settings.ai_receptionist_greeting || `Thanks for calling ${organization.name}. How can I help you today?`)
      setQuestions(
        settings.ai_receptionist_questions?.length > 0
          ? settings.ai_receptionist_questions
          : ['What service are you interested in?', 'What is your budget range?', 'When are you looking to get started?']
      )
      setCalendarLink(settings.ai_receptionist_calendar_link || settings.booking_link || '')
      setTransferNumber(settings.ai_receptionist_transfer_number || '')
      setPhoneNumber(settings.ai_receptionist_phone || '')
      setAssistantId(settings.ai_receptionist_assistant_id || '')
      setSetupComplete(!!settings.ai_receptionist_assistant_id)
    }
  }, [organization])

  // Add question
  const addQuestion = () => {
    setQuestions([...questions, ''])
  }

  // Remove question
  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return
    setQuestions(questions.filter((_, i) => i !== index))
  }

  // Update question
  const updateQuestion = (index: number, value: string) => {
    const updated = [...questions]
    updated[index] = value
    setQuestions(updated)
  }

  // Move question up
  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return
    }
    const updated = [...questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]]
    setQuestions(updated)
  }

  // Toggle enabled/disabled
  const handleToggle = async () => {
    const newEnabled = !enabled
    setEnabled(newEnabled)

    try {
      await updateOrganization.mutateAsync({
        settings: { ai_receptionist_enabled: newEnabled },
      })
      toast.success(newEnabled ? 'AI Receptionist enabled' : 'AI Receptionist disabled')
    } catch (error) {
      setEnabled(!newEnabled) // revert
      toast.error('Failed to update setting')
    }
  }

  // Save full configuration and create/update Vapi assistant
  const handleSave = async () => {
    // Validate
    if (!greeting.trim()) {
      toast.error('Please enter a greeting message')
      return
    }

    const validQuestions = questions.filter((q) => q.trim())
    if (validQuestions.length === 0) {
      toast.error('Please add at least one qualifying question')
      return
    }

    setSaving(true)

    try {
      // POST to /api/integrations/vapi/setup to create/update the Vapi assistant
      const res = await fetch('/api/integrations/vapi/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          greeting: greeting.trim(),
          questions: validQuestions,
          calendarLink: calendarLink.trim(),
          transferNumber: transferNumber.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save configuration')
      }

      const data = await res.json()
      setAssistantId(data.assistantId)
      setSetupComplete(true)
      toast.success(data.message || 'AI Receptionist configured successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  if (orgLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/settings" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-navy/50" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-navy">AI Receptionist</h1>
            <p className="text-navy/60">Loading...</p>
          </div>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-24" />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-48" />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-navy/50" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-navy">AI Receptionist</h1>
          <p className="text-navy/60">Configure your AI-powered phone receptionist</p>
        </div>
        <Link
          href="/dashboard/calls"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-navy hover:bg-gray-50 transition-colors"
        >
          <PhoneCall className="w-4 h-4" />
          View Call Log
        </Link>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${enabled ? 'bg-studio/10' : 'bg-navy/5'}`}>
              <Power className={`w-6 h-6 ${enabled ? 'text-studio' : 'text-navy/40'}`} />
            </div>
            <div>
              <h2 className="font-semibold text-navy">AI Receptionist</h2>
              <p className="text-sm text-navy/50">
                {enabled ? 'Active — answering incoming calls' : 'Disabled — calls will not be answered by AI'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            disabled={updateOrganization.isPending}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              enabled ? 'bg-studio' : 'bg-gray-200'
            }`}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-7' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Phone Number (read-only) */}
      {phoneNumber && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-impact/10 flex items-center justify-center">
              <Phone className="w-6 h-6 text-impact" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-navy">Phone Number</h3>
              <p className="text-sm text-navy/50">Your AI receptionist phone number</p>
            </div>
            <span className="font-mono text-lg font-semibold text-navy">{phoneNumber}</span>
          </div>
        </div>
      )}

      {/* Setup Status */}
      {!setupComplete && (
        <div className="bg-camel/5 border border-camel/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-camel mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-navy">Setup required</p>
            <p className="text-sm text-navy/60">
              Configure the greeting, qualifying questions, and save to create your AI assistant.
              Make sure the VAPI_API_KEY environment variable is set.
            </p>
          </div>
        </div>
      )}

      {setupComplete && (
        <div className="bg-studio/5 border border-studio/20 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-studio mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-navy">AI Receptionist configured</p>
            <p className="text-sm text-navy/60">
              Assistant ID: <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{assistantId}</code>
            </p>
          </div>
        </div>
      )}

      {/* Greeting */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-navy/50" />
          <div>
            <h3 className="font-semibold text-navy">Greeting Message</h3>
            <p className="text-sm text-navy/50">The first thing callers will hear</p>
          </div>
        </div>
        <textarea
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          rows={3}
          placeholder="Thanks for calling {business}. How can I help you today?"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent resize-none"
        />
        <p className="text-xs text-navy/40">Keep it friendly, professional, and under 500 characters.</p>
      </div>

      {/* Qualifying Questions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-navy/50" />
            <div>
              <h3 className="font-semibold text-navy">Qualifying Questions</h3>
              <p className="text-sm text-navy/50">Questions the AI will ask to qualify leads</p>
            </div>
          </div>
          <button
            onClick={addQuestion}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-navy hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        <div className="space-y-2">
          {questions.map((question, index) => (
            <div key={index} className="flex items-center gap-2 group">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveQuestion(index, 'up')}
                  disabled={index === 0}
                  className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20 transition-colors"
                  title="Move up"
                >
                  <GripVertical className="w-3.5 h-3.5 text-navy/30" />
                </button>
              </div>
              <span className="text-sm text-navy/40 w-6 text-center flex-shrink-0">{index + 1}.</span>
              <input
                type="text"
                value={question}
                onChange={(e) => updateQuestion(index, e.target.value)}
                placeholder="e.g., What service are you interested in?"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
              />
              <button
                onClick={() => removeQuestion(index)}
                disabled={questions.length <= 1}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-navy/30 hover:text-impact disabled:opacity-20"
                title="Remove question"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Link */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-navy/50" />
          <div>
            <h3 className="font-semibold text-navy">Calendar / Booking Link</h3>
            <p className="text-sm text-navy/50">The AI will share this when a caller wants to book a meeting</p>
          </div>
        </div>
        <input
          type="url"
          value={calendarLink}
          onChange={(e) => setCalendarLink(e.target.value)}
          placeholder="https://cal.com/your-business/30min"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
        />
      </div>

      {/* Transfer Number */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 text-navy/50" />
          <div>
            <h3 className="font-semibold text-navy">Transfer Number</h3>
            <p className="text-sm text-navy/50">If the caller insists on a human, the AI will transfer to this number</p>
          </div>
        </div>
        <input
          type="tel"
          value={transferNumber}
          onChange={(e) => setTransferNumber(e.target.value)}
          placeholder="+44 7XXX XXXXXX"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
        />
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2 pb-8">
        <p className="text-sm text-navy/40">
          Saving will {setupComplete ? 'update' : 'create'} the Vapi AI assistant.
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-6"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {setupComplete ? 'Update Configuration' : 'Save & Create Assistant'}
        </button>
      </div>
    </div>
  )
}
