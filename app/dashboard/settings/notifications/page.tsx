'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Bell, MessageSquare, Mail } from 'lucide-react'
import { toast } from 'sonner'

const DEFAULT_PREFS = {
  email_new_lead: true,
  email_lead_scored: false,
  email_appointment_booked: true,
  email_appointment_reminder: true,
  email_weekly_report: true,
  whatsapp_new_lead: true,
  whatsapp_high_score_lead: true,
  whatsapp_appointment_booked: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00'
}

type PrefsKey = keyof typeof DEFAULT_PREFS

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings/notifications')
      .then(res => res.json())
      .then(data => {
        if (data.preferences) {
          setPrefs({ ...DEFAULT_PREFS, ...data.preferences })
        }
      })
      .catch(() => {})
  }, [])

  const savePrefs = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs)
      })
      if (res.ok) {
        toast.success('Notification preferences saved')
      } else {
        toast.error('Failed to save preferences')
      }
    } finally {
      setSaving(false)
    }
  }

  const toggle = (key: PrefsKey) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Notification Settings</h1>
        <p className="text-gray-500">Control how and when you receive notifications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            WhatsApp Notifications
          </CardTitle>
          <CardDescription>Instant alerts to your phone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="wa-new-lead">New lead received</Label>
            <Switch
              id="wa-new-lead"
              checked={prefs.whatsapp_new_lead}
              onCheckedChange={() => toggle('whatsapp_new_lead')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="wa-high-score">High-score lead (8+)</Label>
            <Switch
              id="wa-high-score"
              checked={prefs.whatsapp_high_score_lead}
              onCheckedChange={() => toggle('whatsapp_high_score_lead')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="wa-appointment">Appointment booked</Label>
            <Switch
              id="wa-appointment"
              checked={prefs.whatsapp_appointment_booked}
              onCheckedChange={() => toggle('whatsapp_appointment_booked')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Email Notifications
          </CardTitle>
          <CardDescription>Summaries and updates via email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-new-lead">New lead received</Label>
            <Switch
              id="email-new-lead"
              checked={prefs.email_new_lead}
              onCheckedChange={() => toggle('email_new_lead')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email-appointment">Appointment booked</Label>
            <Switch
              id="email-appointment"
              checked={prefs.email_appointment_booked}
              onCheckedChange={() => toggle('email_appointment_booked')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email-reminder">Appointment reminders</Label>
            <Switch
              id="email-reminder"
              checked={prefs.email_appointment_reminder}
              onCheckedChange={() => toggle('email_appointment_reminder')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email-weekly">Weekly report</Label>
            <Switch
              id="email-weekly"
              checked={prefs.email_weekly_report}
              onCheckedChange={() => toggle('email_weekly_report')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-600" />
            Quiet Hours
          </CardTitle>
          <CardDescription>Pause notifications during set times</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quiet-enabled">Enable quiet hours</Label>
            <Switch
              id="quiet-enabled"
              checked={prefs.quiet_hours_enabled}
              onCheckedChange={() => toggle('quiet_hours_enabled')}
            />
          </div>
          {prefs.quiet_hours_enabled && (
            <div className="flex items-center gap-4">
              <div>
                <Label>From</Label>
                <input
                  type="time"
                  value={prefs.quiet_hours_start}
                  onChange={(e) => setPrefs(p => ({ ...p, quiet_hours_start: e.target.value }))}
                  className="block mt-1 border rounded px-2 py-1"
                />
              </div>
              <div>
                <Label>To</Label>
                <input
                  type="time"
                  value={prefs.quiet_hours_end}
                  onChange={(e) => setPrefs(p => ({ ...p, quiet_hours_end: e.target.value }))}
                  className="block mt-1 border rounded px-2 py-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={savePrefs} disabled={saving}>
        {saving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </div>
  )
}
