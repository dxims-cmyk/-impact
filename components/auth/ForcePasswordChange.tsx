'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lock, Eye, EyeOff, Shield, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'

interface ForcePasswordChangeProps {
  onComplete: () => void
}

export function ForcePasswordChange({ onComplete }: ForcePasswordChangeProps): JSX.Element | null {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
        data: { must_change_password: false },
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      toast.success('Password changed successfully!')
      onComplete()
    } catch {
      setError('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/95 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-impact to-impact-light p-6 text-ivory text-center">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold">Change Your Password</h2>
          <p className="text-ivory/70 text-sm mt-1">
            You must set a new password before continuing.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-impact/5 border border-impact/20 rounded-lg text-sm text-impact">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy/80 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 text-navy focus:outline-none focus:ring-2 focus:ring-impact/30 focus:border-impact"
                placeholder="Min 8 characters"
                required
                minLength={8}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-navy/30" />
                ) : (
                  <Eye className="w-4 h-4 text-navy/30" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy/80 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-navy focus:outline-none focus:ring-2 focus:ring-impact/30 focus:border-impact"
                placeholder="Re-enter password"
                required
              />
              {confirmPassword && confirmPassword === newPassword && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-studio" />
              )}
            </div>
          </div>

          <div className="text-xs text-navy/40 space-y-1">
            <p className={newPassword.length >= 8 ? 'text-studio' : ''}>
              {newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
            </p>
            <p className={confirmPassword && confirmPassword === newPassword ? 'text-studio' : ''}>
              {confirmPassword && confirmPassword === newPassword ? '✓' : '○'} Passwords match
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Set New Password'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
