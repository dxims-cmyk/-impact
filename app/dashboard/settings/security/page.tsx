'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Shield, Smartphone } from 'lucide-react'
import { toast } from 'sonner'

export default function SecuritySettingsPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings/security').then(res => res.json()).then(data => {
      setTwoFactorEnabled(data.twoFactorEnabled ?? true)
    }).catch(() => {})
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/security', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twoFactorEnabled })
      })
      if (res.ok) toast.success('Security settings saved')
      else toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Security Settings</h1>
        <p className="text-gray-500">Manage your account security</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Two-Step Verification
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="2fa-toggle" className="font-medium">Email verification on login</Label>
              <p className="text-sm text-gray-500">Receive a 6-digit code via email when signing in</p>
            </div>
            <Switch id="2fa-toggle" checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
          </div>
          {twoFactorEnabled && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Two-step verification is enabled</p>
                  <p className="text-sm text-green-700">You will receive a verification code at your email address each time you sign in.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Button onClick={saveSettings} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
    </div>
  )
}
