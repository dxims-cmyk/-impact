'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  X,
  Check,
  Building2,
  MessageSquare,
  Calendar,
  Code2,
  Send,
  ChevronRight,
  Plug,
  Phone,
} from 'lucide-react'

interface ChecklistStep {
  id: string
  label: string
  description: string
  href: string
  icon: React.ElementType
}

const steps: ChecklistStep[] = [
  {
    id: 'business_details',
    label: 'Add your business details',
    description: 'Set up your business name, logo, and contact info',
    href: '/dashboard/settings',
    icon: Building2,
  },
  {
    id: 'connect_meta',
    label: 'Connect Meta Ads',
    description: 'Sync leads and campaigns from Facebook & Instagram Ads',
    href: '/dashboard/integrations',
    icon: Plug,
  },
  {
    id: 'add_whatsapp',
    label: 'Add WhatsApp number for alerts',
    description: 'Get instant notifications when new leads arrive',
    href: '/dashboard/settings',
    icon: Phone,
  },
  {
    id: 'connect_calendar',
    label: 'Connect your calendar (optional)',
    description: 'Let leads book directly into your availability',
    href: '/dashboard/integrations',
    icon: Calendar,
  },
  {
    id: 'test_lead',
    label: 'Send a test lead',
    description: 'Submit a test lead to see the full flow in action',
    href: '',
    icon: Send,
  },
]

const STORAGE_KEY = 'impact_onboarding'

interface OnboardingState {
  dismissed: boolean
  completedSteps: string[]
  completed: boolean
}

function getStoredState(): OnboardingState {
  if (typeof window === 'undefined') return { dismissed: false, completedSteps: [], completed: false }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return { dismissed: false, completedSteps: [], completed: false }
}

function saveState(state: OnboardingState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

export function OnboardingChecklist({ forceOpen = false, onClose }: { forceOpen?: boolean; onClose?: () => void }) {
  const [state, setState] = useState<OnboardingState>(getStoredState)
  const [showTestInstructions, setShowTestInstructions] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const stored = getStoredState()
    setState(stored)
    setIsVisible(forceOpen || (!stored.dismissed && !stored.completed))
  }, [forceOpen])

  if (!isVisible) return null

  const completedCount = state.completedSteps.length
  const progress = (completedCount / steps.length) * 100
  const allDone = completedCount === steps.length

  const toggleStep = (stepId: string): void => {
    setState(prev => {
      const isCompleted = prev.completedSteps.includes(stepId)
      const completedSteps = isCompleted
        ? prev.completedSteps.filter(s => s !== stepId)
        : [...prev.completedSteps, stepId]
      const next = { ...prev, completedSteps }
      saveState(next)
      return next
    })
  }

  const dismiss = (): void => {
    const next = { ...state, dismissed: true }
    saveState(next)
    setState(next)
    setIsVisible(false)
    onClose?.()
  }

  const complete = (): void => {
    const next = { ...state, completed: true, dismissed: true }
    saveState(next)
    setState(next)
    setIsVisible(false)
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy to-navy-light p-6 text-ivory">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Welcome to : Impact</h2>
            <button
              onClick={dismiss}
              className="p-1.5 rounded-lg hover:bg-ivory/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-ivory/70 text-sm mb-4">
            Complete these steps to get the most out of your lead management system.
          </p>
          {/* Progress bar */}
          <div className="w-full bg-ivory/20 rounded-full h-2">
            <div
              className="bg-impact h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-ivory/60 text-xs mt-2">{completedCount} of {steps.length} completed</p>
        </div>

        {/* Steps */}
        <div className="p-4 space-y-1 max-h-[400px] overflow-y-auto">
          {steps.map((step) => {
            const isCompleted = state.completedSteps.includes(step.id)
            const Icon = step.icon
            const isTest = step.id === 'test_lead'

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isCompleted ? 'bg-studio/5' : 'hover:bg-gray-50'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleStep(step.id)}
                  className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? 'bg-studio border-studio text-white'
                      : 'border-gray-300 hover:border-impact'
                  }`}
                >
                  {isCompleted && <Check className="w-4 h-4" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isCompleted ? 'text-navy/50 line-through' : 'text-navy'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-navy/50">{step.description}</p>
                </div>

                {/* Action */}
                {isTest ? (
                  <button
                    onClick={() => setShowTestInstructions(!showTestInstructions)}
                    className="text-xs text-impact font-medium hover:text-impact-light transition-colors"
                  >
                    How?
                  </button>
                ) : (
                  <Link
                    href={step.href}
                    onClick={dismiss}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-navy/40" />
                  </Link>
                )}
              </div>
            )
          })}

          {/* Test lead instructions */}
          {showTestInstructions && (
            <div className="ml-10 p-3 rounded-lg bg-camel/10 border border-camel/20 text-sm text-navy/70">
              <p className="font-medium text-navy mb-1">How to send a test lead:</p>
              <ol className="list-decimal ml-4 space-y-1 text-xs">
                <li>Go to Settings and copy your form embed code</li>
                <li>Open the form URL in a new tab</li>
                <li>Fill in test details and submit</li>
                <li>Check your Leads page — it should appear within seconds</li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={dismiss}
            className="text-sm text-navy/50 hover:text-navy transition-colors"
          >
            Skip for now
          </button>
          {allDone ? (
            <button
              onClick={complete}
              className="btn-primary text-sm px-6 py-2"
            >
              Complete Setup
            </button>
          ) : (
            <p className="text-xs text-navy/40">{steps.length - completedCount} steps remaining</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function useOnboardingChecklist() {
  const reopen = (): void => {
    const state = getStoredState()
    saveState({ ...state, dismissed: false, completed: false })
    window.dispatchEvent(new Event('onboarding-reopen'))
  }

  return { reopen }
}
