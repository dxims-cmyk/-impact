'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Building2,
  Bell,
  Lock,
  Globe,
  CreditCard,
  Users,
  Mail,
  Phone,
  Save,
  ChevronRight,
  Shield,
  Key,
  Smartphone,
  Moon,
  Sun,
  Check,
  AlertCircle,
  Loader2,
  X,
  Trash2,
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
} from '@/lib/hooks'
import { toast } from 'sonner'

const tabs = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'organization', name: 'Organization', icon: Building2 },
  { id: 'team', name: 'Team', icon: Users },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'security', name: 'Security', icon: Lock },
]

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

  // Hooks
  const { data: user, isLoading: userLoading } = useUser()
  const { data: organization, isLoading: orgLoading } = useOrganization()
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
      const settings = (organization.settings || {}) as Record<string, string>
      setIndustry(settings.industry || 'Marketing Agency')
      setTimezone(settings.timezone || 'Europe/London')
      setWebsite(settings.website || '')
      setCurrency(settings.currency || 'GBP')
    }
  }, [organization])

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        fullName: `${firstName} ${lastName}`.trim(),
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

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
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
                  <div className="grid grid-cols-2 gap-4">
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
                    <div className="col-span-2">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
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
                  <div className="grid grid-cols-4 gap-4 pb-3 border-b border-gray-100">
                    <div className="col-span-1"></div>
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
                      <div key={notification.id} className="grid grid-cols-4 gap-4 py-3 border-b border-gray-50">
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

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-studio/10 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-studio" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy">Two-Factor Authentication</h3>
                      <p className="text-sm text-navy/50">Add an extra layer of security</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 rounded-xl bg-navy/5 text-sm font-medium text-navy/40">
                    Coming Soon
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center">
                      <Key className="w-6 h-6 text-navy/60" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy">API Keys</h3>
                      <p className="text-sm text-navy/50">Manage your API access tokens</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 rounded-xl bg-navy/5 text-sm font-medium text-navy/40">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-navy mb-1">Current Plan</h2>
                    <p className="text-sm text-navy/50">
                      You're on the {organization?.subscription_tier || 'Launch'} plan
                    </p>
                  </div>
                  <button className="btn-primary opacity-50 cursor-not-allowed" title="Coming Soon" disabled>Upgrade Plan</button>
                </div>

                <div className="p-4 rounded-xl bg-impact/5 border border-impact/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-navy">{organization?.subscription_tier || 'Launch'} Plan</span>
                    <span className="text-2xl font-bold text-navy">£297<span className="text-sm font-normal text-navy/50">/mo</span></span>
                  </div>
                  <div className="text-sm text-navy/60 space-y-1">
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-studio" /> Up to 1,000 leads/month</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-studio" /> Unlimited team members</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-studio" /> AI lead qualification</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-studio" /> All integrations</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-navy mb-4">Payment Method</h3>
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 rounded bg-navy/10 flex items-center justify-center text-xs font-bold text-navy">
                      VISA
                    </div>
                    <div>
                      <p className="font-medium text-navy">•••• •••• •••• 4242</p>
                      <p className="text-sm text-navy/50">Expires 12/25</p>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-navy/30 cursor-not-allowed" title="Coming Soon" disabled>
                    Update
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-navy mb-4">Billing History</h3>
                <div className="space-y-2">
                  {[
                    { date: 'Jan 1, 2024', amount: '£297.00', status: 'Paid' },
                    { date: 'Dec 1, 2023', amount: '£297.00', status: 'Paid' },
                    { date: 'Nov 1, 2023', amount: '£297.00', status: 'Paid' },
                  ].map((invoice, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="font-medium text-navy text-sm">{invoice.date}</p>
                        <p className="text-xs text-navy/50">{organization?.subscription_tier || 'Launch'} Plan - Monthly</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-navy">{invoice.amount}</span>
                        <span className="px-2 py-0.5 rounded-full bg-studio/10 text-studio text-xs font-medium">
                          {invoice.status}
                        </span>
                        <button className="text-sm text-navy/30 cursor-not-allowed" title="Coming Soon" disabled>
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
