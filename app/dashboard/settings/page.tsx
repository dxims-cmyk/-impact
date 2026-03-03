'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  User,
  Building2,
  Bell,
  Lock,
  Globe,
  Users,
  Mail,
  Phone,
  Save,
  ChevronRight,
  Smartphone,
  Loader2,
  X,
  Trash2,
  CreditCard,
  ExternalLink,
  Receipt,
  MessageCircle,
  Plus,
  Sparkles,
  Play,
} from 'lucide-react'
import {
  useUser,
  useUpdateProfile,
  useChangePassword,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useOrganization,
  useUpdateOrganization,
  useTeamMembers,
  useInviteTeamMember,
  useUpdateTeamMember,
  useRemoveTeamMember,
  useMembership,
} from '@/lib/hooks'
import { toast } from 'sonner'

const baseTabs = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'organization', name: 'Organization', icon: Building2 },
  { id: 'team', name: 'Team', icon: Users },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'security', name: 'Security', icon: Lock },
]

const billingTab = { id: 'billing', name: 'Billing', icon: CreditCard }

const defaultNotificationSettings = [
  { id: 'new_lead', label: 'New lead captured', description: 'Get notified when a new lead is added' },
  { id: 'hot_lead', label: 'Hot lead detected', description: 'Alert when AI scores a lead 8+' },
  { id: 'message', label: 'New message', description: 'Inbound SMS, email, or WhatsApp' },
  { id: 'appointment', label: 'Appointment reminder', description: 'Upcoming call or meeting' },
  { id: 'report', label: 'Weekly report', description: 'Performance summary every Monday' },
  { id: 'system', label: 'System alerts', description: 'Integration issues, sync failures' },
]

// Loading skeleton
function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 w-32 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-10 bg-gray-200 rounded-xl" />
        <div className="h-10 bg-gray-200 rounded-xl" />
        <div className="h-10 bg-gray-200 rounded-xl" />
        <div className="h-10 bg-gray-200 rounded-xl" />
      </div>
    </div>
  )
}

function TeamMemberSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-200" />
        <div>
          <div className="w-32 h-4 bg-gray-200 rounded mb-1" />
          <div className="w-48 h-3 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="w-24 h-8 bg-gray-200 rounded-lg" />
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')

  // Profile form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [jobTitle, setJobTitle] = useState('')

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Organization form state
  const [orgName, setOrgName] = useState('')
  const [industry, setIndustry] = useState('')
  const [timezone, setTimezone] = useState('')
  const [website, setWebsite] = useState('')
  const [currency, setCurrency] = useState('')

  // Nurture pipeline state
  const [nurtureEnabled, setNurtureEnabled] = useState(false)
  const [nurtureTriggering, setNurtureTriggering] = useState(false)

  // WhatsApp notification numbers state
  const [waNumbers, setWaNumbers] = useState<string[]>([])
  const [waNewNumber, setWaNewNumber] = useState('')
  const [waLoading, setWaLoading] = useState(false)
  const [waSaving, setWaSaving] = useState(false)
  const [waLoaded, setWaLoaded] = useState(false)

  // Billing state
  const [billingLoading, setBillingLoading] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false)
  const [paymentHistoryLoaded, setPaymentHistoryLoaded] = useState(false)

  // Hooks
  const { data: user, isLoading: userLoading } = useUser()
  const { data: organization, isLoading: orgLoading } = useOrganization()

  // Show billing tab for non-agency (client) users only
  const isAgencyUser = (user as any)?.is_agency_user === true
  const tabs = isAgencyUser ? baseTabs : [...baseTabs, billingTab]
  const { status: membershipStatus, isPreview, isActive, isPastDue, paymentMethod, paidUntil, totalMonthsPaid } = useMembership()
  const { data: teamMembers, isLoading: teamLoading } = useTeamMembers()
  const { data: notificationPrefs, isLoading: notifLoading } = useNotificationPreferences()

  // Mutations
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const updateOrganization = useUpdateOrganization()
  const updateNotifications = useUpdateNotificationPreferences()
  const inviteTeamMember = useInviteTeamMember()
  const updateTeamMember = useUpdateTeamMember()
  const removeTeamMember = useRemoveTeamMember()

  // Initialize form values from user data
  useEffect(() => {
    if (user) {
      const nameParts = (user.full_name || '').split(' ')
      setFirstName(nameParts[0] || '')
      setLastName(nameParts.slice(1).join(' ') || '')
      setEmail(user.email || '')
      setPhone((user as any).phone || '')
      setJobTitle((user as any).job_title || '')
    }
  }, [user])

  // Initialize org form values
  useEffect(() => {
    if (organization) {
      setOrgName(organization.name || '')
      const settings = (organization.settings || {}) as Record<string, any>
      setIndustry(settings.industry || 'Marketing Agency')
      setTimezone(settings.timezone || 'Europe/London')
      setWebsite(settings.website || '')
      setCurrency(settings.currency || 'GBP')
      setNurtureEnabled(!!settings.nurture_enabled)
    }
  }, [organization])

  // Load WhatsApp notification numbers when notifications tab is active
  useEffect(() => {
    if (activeTab === 'notifications' && !waLoaded) {
      setWaLoading(true)
      fetch('/api/settings/notifications/whatsapp')
        .then(res => res.json())
        .then(data => {
          setWaNumbers(Array.isArray(data.numbers) ? data.numbers : [])
          setWaLoaded(true)
        })
        .catch(() => setWaNumbers([]))
        .finally(() => setWaLoading(false))
    }
  }, [activeTab, waLoaded])

  // Load payment history when billing tab is active
  useEffect(() => {
    if (activeTab === 'billing' && !paymentHistoryLoaded) {
      setPaymentHistoryLoading(true)
      fetch('/api/billing/payments')
        .then(res => res.json())
        .then(data => {
          setPaymentHistory(Array.isArray(data) ? data : [])
          setPaymentHistoryLoaded(true)
        })
        .catch(() => setPaymentHistory([]))
        .finally(() => setPaymentHistoryLoading(false))
    }
  }, [activeTab, paymentHistoryLoaded])

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        fullName: `${firstName} ${lastName}`.trim(),
        phone: phone || undefined,
        jobTitle: jobTitle || undefined,
      })
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    try {
      await changePassword.mutateAsync({
        currentPassword,
        newPassword,
      })
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password')
    }
  }

  const handleSaveOrganization = async () => {
    try {
      await updateOrganization.mutateAsync({
        name: orgName,
        settings: { industry, timezone, website, currency },
      })
      toast.success('Organization settings updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update organization')
    }
  }

  const handleToggleNurture = async () => {
    const newEnabled = !nurtureEnabled
    setNurtureEnabled(newEnabled)
    try {
      await updateOrganization.mutateAsync({
        settings: { nurture_enabled: newEnabled },
      })
      toast.success(newEnabled ? 'Pipeline nurture enabled' : 'Pipeline nurture disabled')
    } catch (error) {
      setNurtureEnabled(!newEnabled)
      toast.error('Failed to update setting')
    }
  }

  const handleTriggerNurture = async () => {
    setNurtureTriggering(true)
    try {
      const res = await fetch('/api/leads/nurture', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to trigger nurture')
      toast.success('Pipeline nurture started — check your leads shortly')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to trigger nurture')
    } finally {
      setNurtureTriggering(false)
    }
  }

  const handleToggleNotification = async (id: string, channel: 'email' | 'push' | 'sms') => {
    if (!notificationPrefs) return
    const current = notificationPrefs[id as keyof typeof notificationPrefs]
    if (!current) return

    try {
      await updateNotifications.mutateAsync({
        [id]: { [channel]: !current[channel] },
      })
    } catch (error) {
      toast.error('Failed to update notification preference')
    }
  }

  const handleInviteMember = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address')
      return
    }
    try {
      await inviteTeamMember.mutateAsync({
        email: inviteEmail,
        role: inviteRole,
      })
      toast.success('Invitation sent successfully')
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('member')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation')
    }
  }

  const handleUpdateRole = async (memberId: string, role: 'admin' | 'member' | 'viewer') => {
    try {
      await updateTeamMember.mutateAsync({ id: memberId, role })
      toast.success('Role updated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return
    try {
      await removeTeamMember.mutateAsync(memberId)
      toast.success('Team member removed')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member')
    }
  }

  const handleAddWaNumber = () => {
    const num = waNewNumber.trim()
    if (!num) return
    if (!/^\+[1-9]\d{6,14}$/.test(num)) {
      toast.error('Invalid format. Use +44XXXXXXXXXX (E.164)')
      return
    }
    if (waNumbers.includes(num)) {
      toast.error('Number already added')
      return
    }
    if (waNumbers.length >= 5) {
      toast.error('Maximum 5 numbers allowed')
      return
    }
    setWaNumbers([...waNumbers, num])
    setWaNewNumber('')
  }

  const handleRemoveWaNumber = (num: string) => {
    setWaNumbers(waNumbers.filter(n => n !== num))
  }

  const handleSaveWaNumbers = async () => {
    setWaSaving(true)
    try {
      const res = await fetch('/api/settings/notifications/whatsapp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers: waNumbers }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      toast.success('WhatsApp numbers saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setWaSaving(false)
    }
  }

  const handleManageBilling = async () => {
    setBillingLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to open billing portal')
        return
      }
      window.location.href = data.url
    } catch {
      toast.error('Failed to open billing portal')
    } finally {
      setBillingLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy">Settings</h1>
        <p className="text-navy/60">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar — horizontal scrollable tabs on mobile, vertical on desktop */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 flex lg:flex-col gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 lg:gap-3 px-4 py-2.5 lg:py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 lg:w-full ${
                    activeTab === tab.id
                      ? 'bg-impact text-ivory'
                      : 'text-navy/70 hover:bg-gray-50 hover:text-navy'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-navy mb-1">Profile Settings</h2>
                <p className="text-sm text-navy/50">Update your personal information</p>
              </div>

              {userLoading ? (
                <FormSkeleton />
              ) : (
                <>
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-camel/20 flex items-center justify-center text-2xl font-semibold text-camel">
                      {user?.full_name ? getInitials(user.full_name) : 'U'}
                    </div>
                  </div>

                  {/* Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1.5">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1.5">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1.5">Email</label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 text-navy/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1.5">Phone</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-navy mb-1.5">Job Title</label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                      onClick={handleSaveProfile}
                      disabled={updateProfile.isPending}
                      className="btn-primary flex items-center gap-2"
                    >
                      {updateProfile.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'organization' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-navy mb-1">Organization Settings</h2>
                <p className="text-sm text-navy/50">Manage your organization details</p>
              </div>

              {orgLoading ? (
                <FormSkeleton />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-navy mb-1.5">Organization Name</label>
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1.5">Industry</label>
                      <select
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                      >
                        <option value="Marketing Agency">Marketing Agency</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Financial Services">Financial Services</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Technology">Technology</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1.5">Timezone</label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                      >
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1.5">Website</label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1.5">Currency</label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                      >
                        <option value="GBP">GBP (£)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                  </div>

                  {/* Pipeline Nurture */}
                  <div className="pt-4 border-t border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${nurtureEnabled ? 'bg-impact/10' : 'bg-navy/5'}`}>
                          <Sparkles className={`w-6 h-6 ${nurtureEnabled ? 'text-impact' : 'text-navy/40'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-navy">Pipeline Nurture</h3>
                          <p className="text-sm text-navy/50">
                            {nurtureEnabled
                              ? 'Active — AI follows up with stale leads daily at 9 AM'
                              : 'Disabled — leads in your pipeline won\'t be auto-followed up'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleToggleNurture}
                        disabled={updateOrganization.isPending}
                        className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
                          nurtureEnabled ? 'bg-impact' : 'bg-gray-200'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                            nurtureEnabled ? 'translate-x-7' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {nurtureEnabled && (
                      <>
                        <div className="bg-navy/[0.02] rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <Sparkles className="w-4 h-4 text-impact mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-navy/70 space-y-1">
                              <p>Leads in <strong>Qualified</strong>, <strong>Contacted</strong>, and <strong>Booked</strong> stages that haven't been reached in 48+ hours will receive an AI-generated follow-up via email (or WhatsApp if no email).</p>
                              <p>Up to 20 leads per run. You'll get a WhatsApp summary after each run.</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-navy/40">Runs daily at 9:00 AM UTC, or trigger manually.</p>
                          <button
                            onClick={handleTriggerNurture}
                            disabled={nurtureTriggering}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-impact/20 text-sm font-medium text-impact hover:bg-impact/5 transition-colors disabled:opacity-50"
                          >
                            {nurtureTriggering ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            Run Now
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                      onClick={handleSaveOrganization}
                      disabled={updateOrganization.isPending}
                      className="btn-primary flex items-center gap-2"
                    >
                      {updateOrganization.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'team' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-navy mb-1">Team Members</h2>
                  <p className="text-sm text-navy/50">Manage your team and permissions</p>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Invite Member
                </button>
              </div>

              <div className="space-y-3">
                {teamLoading ? (
                  <>
                    <TeamMemberSkeleton />
                    <TeamMemberSkeleton />
                    <TeamMemberSkeleton />
                  </>
                ) : !teamMembers || teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-navy/50">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No team members yet</p>
                  </div>
                ) : (
                  teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-impact/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center text-sm font-semibold text-navy">
                          {member.full_name ? getInitials(member.full_name) : member.email?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-navy">{member.full_name || 'Pending User'}</p>
                          <p className="text-sm text-navy/50">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {!member.full_name && (
                          <span className="px-2 py-0.5 rounded-full bg-camel/20 text-camel text-xs font-medium">
                            Pending
                          </span>
                        )}
                        <select
                          value={member.role || 'member'}
                          onChange={(e) => handleUpdateRole(member.id, e.target.value as 'admin' | 'member' | 'viewer')}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-navy bg-white focus:outline-none focus:ring-2 focus:ring-impact"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-navy/40 hover:text-impact"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Invite Modal */}
              {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-navy/50" onClick={() => setShowInviteModal(false)} />
                  <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-navy">Invite Team Member</h3>
                      <button onClick={() => setShowInviteModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-navy/50" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1.5">Email Address</label>
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="colleague@company.com"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1.5">Role</label>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member' | 'viewer')}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                        >
                          <option value="admin">Admin - Full access</option>
                          <option value="member">Member - Standard access</option>
                          <option value="viewer">Viewer - Read-only access</option>
                        </select>
                      </div>
                      <button
                        onClick={handleInviteMember}
                        disabled={inviteTeamMember.isPending}
                        className="w-full btn-primary flex items-center justify-center gap-2"
                      >
                        {inviteTeamMember.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                        Send Invitation
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-navy mb-1">Notification Preferences</h2>
                <p className="text-sm text-navy/50">Choose how you want to be notified</p>
              </div>

              {notifLoading ? (
                <FormSkeleton />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2 sm:gap-4 pb-3 border-b border-gray-100">
                    <div></div>
                    <div className="text-center">
                      <Mail className="w-5 h-5 text-navy/40 mx-auto mb-1" />
                      <span className="text-xs font-medium text-navy/50">Email</span>
                    </div>
                    <div className="text-center">
                      <Bell className="w-5 h-5 text-navy/40 mx-auto mb-1" />
                      <span className="text-xs font-medium text-navy/50">Push</span>
                    </div>
                    <div className="text-center">
                      <Smartphone className="w-5 h-5 text-navy/40 mx-auto mb-1" />
                      <span className="text-xs font-medium text-navy/50">SMS</span>
                    </div>
                  </div>

                  {defaultNotificationSettings.map((notification) => {
                    const prefs = notificationPrefs?.[notification.id as keyof typeof notificationPrefs] || { email: false, push: false, sms: false }
                    return (
                      <div key={notification.id} className="grid grid-cols-4 gap-2 sm:gap-4 py-3 border-b border-gray-50">
                        <div>
                          <p className="font-medium text-navy text-sm">{notification.label}</p>
                          <p className="text-xs text-navy/50">{notification.description}</p>
                        </div>
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleNotification(notification.id, 'email')}
                            className={`w-10 h-6 rounded-full transition-colors ${
                              prefs.email ? 'bg-impact' : 'bg-gray-200'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                              prefs.email ? 'translate-x-4' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </div>
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleNotification(notification.id, 'push')}
                            className={`w-10 h-6 rounded-full transition-colors ${
                              prefs.push ? 'bg-impact' : 'bg-gray-200'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                              prefs.push ? 'translate-x-4' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </div>
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleNotification(notification.id, 'sms')}
                            className={`w-10 h-6 rounded-full transition-colors ${
                              prefs.sms ? 'bg-impact' : 'bg-gray-200'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                              prefs.sms ? 'translate-x-4' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* WhatsApp Alert Numbers */}
              <div className="pt-4 border-t border-gray-100">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-navy flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-[#25D366]" />
                    WhatsApp Alert Numbers
                  </h3>
                  <p className="text-sm text-navy/50 mt-1">
                    Get instant WhatsApp notifications when new leads arrive. Add up to 5 numbers.
                  </p>
                </div>

                {waLoading ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-navy/40">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Current numbers */}
                    {waNumbers.map((num) => (
                      <div key={num} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-navy/40" />
                          <span className="text-sm font-mono text-navy">{num}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveWaNumber(num)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-navy/30 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Add number input */}
                    {waNumbers.length < 5 && (
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={waNewNumber}
                          onChange={(e) => setWaNewNumber(e.target.value)}
                          placeholder="+44XXXXXXXXXX"
                          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddWaNumber() }}
                        />
                        <button
                          onClick={handleAddWaNumber}
                          className="px-4 py-2.5 rounded-xl border border-gray-200 text-navy hover:bg-gray-50 transition-colors flex items-center gap-1 text-sm font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                    )}

                    {/* Save button */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSaveWaNumbers}
                        disabled={waSaving}
                        className="btn-primary flex items-center gap-2"
                      >
                        {waSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Numbers
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-navy mb-1">Password</h2>
                  <p className="text-sm text-navy/50">Update your password</p>
                </div>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={changePassword.isPending}
                    className="btn-primary flex items-center gap-2"
                  >
                    {changePassword.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Update Password
                  </button>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'billing' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-navy mb-1">Billing & Membership</h2>
                <p className="text-sm text-navy/50">Your membership and payment details</p>
              </div>

              {orgLoading ? (
                <FormSkeleton />
              ) : (
                <>
                  {/* Membership overview */}
                  <div className="p-4 rounded-xl border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-navy/50">Current Plan</p>
                        <p className="text-lg font-bold text-navy">
                          {(organization as any)?.plan === 'pro' ? ': Impact Pro' : ': Impact Core'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm px-3 py-1 rounded-full font-semibold ${
                          (organization as any)?.plan === 'pro'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                            : 'bg-navy/5 text-navy/60'
                        }`}>
                          {(organization as any)?.plan === 'pro' ? 'Pro' : 'Core'}
                        </span>
                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                          membershipStatus === 'active' ? 'bg-green-50 text-green-700' :
                          membershipStatus === 'preview' ? 'bg-blue-50 text-blue-700' :
                          membershipStatus === 'past_due' ? 'bg-amber-50 text-amber-700' :
                          membershipStatus === 'paused' ? 'bg-yellow-50 text-yellow-700' :
                          membershipStatus === 'suspended' ? 'bg-red-50 text-red-700' :
                          membershipStatus === 'cancelled' ? 'bg-gray-100 text-gray-600' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {membershipStatus === 'active' ? 'Active' :
                           membershipStatus === 'preview' ? 'Preview' :
                           membershipStatus === 'past_due' ? 'Past Due' :
                           membershipStatus === 'paused' ? 'Paused' :
                           membershipStatus === 'suspended' ? 'Suspended' :
                           membershipStatus === 'cancelled' ? 'Cancelled' : 'Preview'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-gray-50">
                      <div>
                        <p className="text-xs text-navy/40">Monthly Price</p>
                        <p className="text-sm font-semibold text-navy">
                          {(organization as any)?.plan === 'pro' ? '£2,500' : '£1,500'}/mo
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-navy/40">Payment Method</p>
                        <p className="text-sm font-semibold text-navy">
                          {paymentMethod === 'stripe_recurring' ? 'Stripe' :
                           paymentMethod === 'card_manual' ? 'Card' :
                           paymentMethod === 'cash' ? 'Cash' :
                           paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                           'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-navy/40">Paid Until</p>
                        <p className="text-sm font-semibold text-navy">
                          {paidUntil ? new Date(paidUntil).toLocaleDateString() : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-navy/40">Months Paid</p>
                        <p className="text-sm font-semibold text-navy">{totalMonthsPaid}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment History */}
                  <div>
                    <h3 className="text-sm font-semibold text-navy flex items-center gap-2 mb-3">
                      <Receipt className="w-4 h-4 text-navy/40" />
                      Payment History
                    </h3>
                    {paymentHistoryLoading ? (
                      <div className="flex items-center gap-2 py-4 text-sm text-navy/40">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </div>
                    ) : paymentHistory.length === 0 ? (
                      <p className="text-sm text-navy/40 py-4">No payments recorded yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-navy/40 border-b border-gray-100">
                              <th className="text-left py-2 pr-4 font-medium">Date</th>
                              <th className="text-left py-2 pr-4 font-medium">Amount</th>
                              <th className="text-left py-2 pr-4 font-medium">Method</th>
                              <th className="text-left py-2 pr-4 font-medium">Period</th>
                              <th className="text-left py-2 font-medium">Reference</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paymentHistory.map((p: any) => (
                              <tr key={p.id} className="border-b border-gray-50">
                                <td className="py-2 pr-4 text-navy/70">{new Date(p.created_at).toLocaleDateString()}</td>
                                <td className="py-2 pr-4 text-navy font-medium">
                                  {p.currency === 'GBP' ? '£' : p.currency === 'USD' ? '$' : '€'}
                                  {Number(p.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2 pr-4 text-navy/60">
                                  {p.payment_method === 'stripe_recurring' ? 'Stripe' :
                                   p.payment_method === 'card_manual' ? 'Card' :
                                   p.payment_method === 'cash' ? 'Cash' :
                                   p.payment_method === 'bank_transfer' ? 'Bank Transfer' : p.payment_method}
                                </td>
                                <td className="py-2 pr-4 text-navy/60 whitespace-nowrap">
                                  {new Date(p.period_start).toLocaleDateString()} – {new Date(p.period_end).toLocaleDateString()}
                                </td>
                                <td className="py-2 text-navy/50">{p.reference || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    {paymentMethod === 'stripe_recurring' ? (
                      <>
                        <button
                          onClick={handleManageBilling}
                          disabled={billingLoading}
                          className="btn-primary flex items-center gap-2"
                        >
                          {billingLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ExternalLink className="w-4 h-4" />
                          )}
                          Manage Billing
                        </button>
                        <p className="text-xs text-navy/40 mt-2">
                          Update payment method, view invoices, and manage your subscription via Stripe.
                        </p>
                      </>
                    ) : (
                      <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                        <p className="text-sm text-navy/70 mb-3">
                          For billing inquiries, plan changes, or payment questions:
                        </p>
                        <a
                          href="https://wa.me/64212345678?text=Hi%2C%20I%20have%20a%20billing%20question%20about%20my%20Impact%20account"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] text-white text-sm font-semibold hover:bg-[#20BD5A] transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Contact AM:PM Media
                        </a>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
