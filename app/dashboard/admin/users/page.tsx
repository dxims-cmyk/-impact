'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/use-user'
import {
  Users,
  Plus,
  Building2,
  Mail,
  Phone,
  Lock,
  LockOpen,
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
  RefreshCw,
  Copy,
  Shield,
  AlertTriangle,
  CreditCard,
  Banknote,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { RecordPaymentModal } from '@/components/admin/RecordPaymentModal'
import { MembershipActions } from '@/components/admin/MembershipActions'
import { PaymentHistoryTable } from '@/components/admin/PaymentHistoryTable'
import { AdminAddons } from '@/components/admin/AdminAddons'

interface ClientOrg {
  id: string
  name: string
  slug: string
  subscription_tier: string
  subscription_status: string
  plan?: string
  plan_changed_at?: string
  account_status?: 'active' | 'locked' | 'suspended'
  account_locked_at?: string
  account_lock_reason?: string
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  membership_status?: string
  payment_method?: string | null
  membership_paid_until?: string | null
  total_months_paid?: number
  created_at: string
  settings: Record<string, unknown>
  users: {
    id: string
    email: string
    full_name: string
    role: string
    organization_id: string
    created_at: string
  }[]
}

export default function AdminUsersPage(): JSX.Element {
  const router = useRouter()
  const { data: currentUser, isLoading: userLoading } = useUser()
  const [clients, setClients] = useState<ClientOrg[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createdResult, setCreatedResult] = useState<{
    email: string
    password: string
    orgName: string
  } | null>(null)

  // Form state
  const [businessName, setBusinessName] = useState('')
  const [clientName, setClientName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [autoPassword, setAutoPassword] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true)
  const [changingPlanFor, setChangingPlanFor] = useState<string | null>(null)
  const [lockModal, setLockModal] = useState<{ orgId: string; orgName: string } | null>(null)
  const [lockReason, setLockReason] = useState('')
  const [lockingOrgId, setLockingOrgId] = useState<string | null>(null)
  const [creatingSubFor, setCreatingSubFor] = useState<string | null>(null)
  const [paymentModal, setPaymentModal] = useState<{ orgId: string; orgName: string; plan: string } | null>(null)
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null)

  // Admin guard
  useEffect(() => {
    if (!userLoading && currentUser && !currentUser.is_agency_user) {
      router.push('/dashboard')
    }
  }, [currentUser, userLoading, router])

  // Fetch clients
  const fetchClients = async (): Promise<void> => {
    try {
      const res = await fetch('/api/admin/clients')
      if (!res.ok) throw new Error('Failed to fetch clients')
      const data = await res.json()
      setClients(data)
    } catch (err) {
      console.error('Fetch clients error:', err)
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser?.is_agency_user) {
      fetchClients()
    }
  }, [currentUser])

  const resetForm = (): void => {
    setBusinessName('')
    setClientName('')
    setEmail('')
    setPhone('')
    setPassword('')
    setAutoPassword(true)
    setShowPassword(false)
    setSendWelcomeEmail(true)
  }

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setCreating(true)

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          clientName,
          email,
          phone: phone || undefined,
          password: autoPassword ? undefined : password,
          sendWelcomeEmail,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create client')
      }

      setCreatedResult({
        email: data.user.email,
        password: data.password,
        orgName: data.organization.name,
      })

      toast.success('Client created successfully!')
      resetForm()
      setShowForm(false)
      fetchClients()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create client')
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = (text: string, label: string): void => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied!`)
  }

  const handlePlanChange = async (orgId: string, newPlan: string): Promise<void> => {
    const planNames: Record<string, string> = { core: 'Core', growth: 'Growth', pro: 'Pro' }
    const org = clients?.find((c: any) => c.id === orgId)
    const currentPlan = org?.plan || 'core'

    // Skip if same plan selected
    if (newPlan === currentPlan) return

    const action = `change plan to ${planNames[newPlan] || newPlan}`
    if (!confirm(`Are you sure you want to ${action} for this client?`)) {
      return
    }

    setChangingPlanFor(orgId)
    try {
      // Always use direct plan API — avoids Stripe errors for cancelled/missing subscriptions
      const res = await fetch(`/api/admin/organizations/${orgId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      })

      if (res.ok) {
        fetchClients()
        toast.success(`Client plan changed to ${planNames[newPlan] || newPlan}`)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to change plan')
      }
    } catch {
      toast.error('Error changing plan')
    } finally {
      setChangingPlanFor(null)
    }
  }

  const handleCreateSubscription = async (orgId: string): Promise<void> => {
    if (!confirm('Create a Core subscription for this client? This will set up Stripe billing.')) {
      return
    }

    setCreatingSubFor(orgId)
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'core' }),
      })

      if (res.ok) {
        fetchClients()
        toast.success('Subscription created')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create subscription')
      }
    } catch {
      toast.error('Error creating subscription')
    } finally {
      setCreatingSubFor(null)
    }
  }

  const handleLockAccount = async (orgId: string, reason: string): Promise<void> => {
    setLockingOrgId(orgId)
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'locked', reason: reason || undefined }),
      })
      if (res.ok) {
        toast.success('Account locked')
        fetchClients()
      } else {
        toast.error('Failed to lock account')
      }
    } catch {
      toast.error('Error locking account')
    } finally {
      setLockingOrgId(null)
      setLockModal(null)
      setLockReason('')
    }
  }

  const handleUnlockAccount = async (orgId: string): Promise<void> => {
    setLockingOrgId(orgId)
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })
      if (res.ok) {
        toast.success('Account unlocked')
        fetchClients()
      } else {
        toast.error('Failed to unlock account')
      }
    } catch {
      toast.error('Error unlocking account')
    } finally {
      setLockingOrgId(null)
    }
  }

  const handleDeleteOrg = async (orgId: string, orgName: string): Promise<void> => {
    if (!confirm(`Are you sure you want to permanently delete "${orgName}"? This will remove ALL data (leads, conversations, users, payments) and CANNOT be undone.`)) {
      return
    }
    if (!confirm(`FINAL WARNING: Delete "${orgName}" and all associated data permanently?`)) {
      return
    }

    setDeletingOrgId(orgId)
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success(`${orgName} deleted`)
        fetchClients()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete client')
      }
    } catch {
      toast.error('Error deleting client')
    } finally {
      setDeletingOrgId(null)
    }
  }

  if (userLoading || (!currentUser?.is_agency_user && !userLoading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-navy/30" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Shield className="w-6 h-6 text-impact" />
            Client Management
          </h1>
          <p className="text-navy/60 text-sm mt-1">
            Create and manage client accounts. Admin only.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setLoading(true); fetchClients() }}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-navy/60 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm px-4 py-2.5 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Client
          </button>
        </div>
      </div>

      {/* Created result banner */}
      {createdResult && (
        <div className="bg-studio/5 border border-studio/20 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-navy flex items-center gap-2">
                <Check className="w-5 h-5 text-studio" />
                Client Created: {createdResult.orgName}
              </h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-navy/60 w-20">Email:</span>
                  <code className="bg-white px-2 py-1 rounded border text-navy">{createdResult.email}</code>
                  <button
                    onClick={() => copyToClipboard(createdResult.email, 'Email')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Copy className="w-3.5 h-3.5 text-navy/40" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-navy/60 w-20">Password:</span>
                  <code className="bg-white px-2 py-1 rounded border text-navy font-mono">{createdResult.password}</code>
                  <button
                    onClick={() => copyToClipboard(createdResult.password, 'Password')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Copy className="w-3.5 h-3.5 text-navy/40" />
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setCreatedResult(null)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-navy/40" />
            </button>
          </div>
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-navy to-navy-light p-6 text-ivory">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Create New Client</h2>
                <button
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="p-1.5 rounded-lg hover:bg-ivory/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-ivory/60 text-sm mt-1">
                This creates a Supabase Auth user, organization, and sends login details.
              </p>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-navy/80 mb-1.5">
                  Business Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-navy focus:outline-none focus:ring-2 focus:ring-impact/30 focus:border-impact"
                    placeholder="Acme Marketing"
                    required
                  />
                </div>
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-navy/80 mb-1.5">
                  Client Name *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-navy focus:outline-none focus:ring-2 focus:ring-impact/30 focus:border-impact"
                    placeholder="John Smith"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-navy/80 mb-1.5">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-navy focus:outline-none focus:ring-2 focus:ring-impact/30 focus:border-impact"
                    placeholder="john@acme.com"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-navy/80 mb-1.5">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-navy focus:outline-none focus:ring-2 focus:ring-impact/30 focus:border-impact"
                    placeholder="+64 21 123 4567"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-navy/80">
                    Password
                  </label>
                  <label className="flex items-center gap-2 text-xs text-navy/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoPassword}
                      onChange={(e) => setAutoPassword(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Auto-generate
                  </label>
                </div>
                {!autoPassword && (
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 text-navy focus:outline-none focus:ring-2 focus:ring-impact/30 focus:border-impact"
                      placeholder="Min 6 characters"
                      minLength={6}
                      required={!autoPassword}
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
                )}
              </div>

              {/* Welcome Email */}
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={sendWelcomeEmail}
                  onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <div>
                  <p className="text-sm font-medium text-navy">Send welcome email</p>
                  <p className="text-xs text-navy/50">Email login details to the client</p>
                </div>
              </label>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-navy/60 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Client
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lock account confirmation modal */}
      {lockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Lock Account
                </h2>
                <button
                  onClick={() => { setLockModal(null); setLockReason('') }}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-white/70 text-sm mt-1">
                This will prevent all users in <strong>{lockModal.orgName}</strong> from accessing the dashboard.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy/80 mb-1.5">
                  Reason (optional)
                </label>
                <textarea
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-navy focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 resize-none"
                  placeholder="e.g., Non-payment, trial expired..."
                  rows={3}
                />
                <p className="text-xs text-navy/40 mt-1">
                  This message will be shown to the client on the lockout screen.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setLockModal(null); setLockReason('') }}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-navy/60 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleLockAccount(lockModal.orgId, lockReason)}
                  disabled={lockingOrgId === lockModal.orgId}
                  className="px-6 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {lockingOrgId === lockModal.orgId ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Locking...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Lock Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-navy/30" />
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-14 h-14 bg-navy/5 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-navy/30" />
          </div>
          <h3 className="text-lg font-semibold text-navy mb-1">No clients yet</h3>
          <p className="text-navy/50 text-sm mb-4">Create your first client to get started.</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm px-4 py-2"
          >
            + New Client
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((org) => (
            <div
              key={org.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-impact/10 rounded-xl flex items-center justify-center text-sm font-bold text-impact">
                    {org.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy">{org.name}</h3>
                    <p className="text-xs text-navy/50">
                      {org.slug} &middot; Created {new Date(org.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {/* Plan badge */}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        org.plan === 'pro'
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                          : org.plan === 'growth'
                            ? 'bg-studio/10 text-studio'
                            : 'bg-navy/5 text-navy/60'
                      }`}>
                        {org.plan === 'pro' ? 'Pro' : org.plan === 'growth' ? 'Growth' : 'Core'}
                      </span>
                      {/* Membership status badge */}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        org.membership_status === 'active' ? 'bg-green-50 text-green-700' :
                        org.membership_status === 'preview' ? 'bg-blue-50 text-blue-700' :
                        org.membership_status === 'past_due' ? 'bg-amber-50 text-amber-700' :
                        org.membership_status === 'paused' ? 'bg-yellow-50 text-yellow-700' :
                        org.membership_status === 'suspended' ? 'bg-red-50 text-red-700' :
                        org.membership_status === 'cancelled' ? 'bg-gray-100 text-gray-600' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {org.membership_status === 'active' ? 'Active' :
                         org.membership_status === 'preview' ? 'Preview' :
                         org.membership_status === 'past_due' ? 'Past Due' :
                         org.membership_status === 'paused' ? 'Paused' :
                         org.membership_status === 'suspended' ? 'Suspended' :
                         org.membership_status === 'cancelled' ? 'Cancelled' :
                         'Preview'}
                      </span>
                      {/* Payment method indicator */}
                      {org.payment_method && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-navy/50 font-medium">
                          {org.payment_method === 'stripe_recurring' ? 'Stripe' :
                           org.payment_method === 'card_manual' ? 'Card' :
                           org.payment_method === 'cash' ? 'Cash' :
                           org.payment_method === 'bank_transfer' ? 'Bank' : ''}
                        </span>
                      )}
                      {/* Paid until + months */}
                      {org.membership_paid_until && (
                        <span className="text-xs text-navy/40">
                          Paid until {new Date(org.membership_paid_until).toLocaleDateString()}
                          {org.total_months_paid ? ` (${org.total_months_paid} mo)` : ''}
                        </span>
                      )}
                    </div>

                    {/* Action buttons row */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {/* Record Payment button */}
                      <button
                        onClick={() => setPaymentModal({ orgId: org.id, orgName: org.name, plan: org.plan || 'core' })}
                        className="text-xs px-2.5 py-0.5 rounded-full font-medium border border-studio/30 text-studio hover:bg-studio/5 transition-colors flex items-center gap-1"
                      >
                        <Banknote className="w-3 h-3" />
                        Record Payment
                      </button>
                      {/* Membership actions dropdown */}
                      <MembershipActions
                        orgId={org.id}
                        currentStatus={org.membership_status || 'preview'}
                        onSuccess={fetchClients}
                      />
                      {/* Plan change */}
                      <select
                        value={org.plan || 'core'}
                        onChange={(e) => handlePlanChange(org.id, e.target.value)}
                        disabled={changingPlanFor === org.id}
                        className="text-xs px-2 py-0.5 rounded-full font-medium border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 bg-white cursor-pointer"
                      >
                        <option value="core">Core</option>
                        <option value="growth">Growth</option>
                        <option value="pro">Pro</option>
                      </select>
                      {/* Create Stripe subscription if none exists */}
                      {!org.stripe_subscription_id && (
                        <button
                          onClick={() => handleCreateSubscription(org.id)}
                          disabled={creatingSubFor === org.id}
                          className="text-xs px-2.5 py-0.5 rounded-full font-medium border border-impact/30 text-impact hover:bg-impact/5 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {creatingSubFor === org.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CreditCard className="w-3 h-3" />
                          )}
                          Create Subscription
                        </button>
                      )}
                      {/* Account lock/unlock */}
                      {(!org.account_status || org.account_status === 'active') ? (
                        <button
                          onClick={() => setLockModal({ orgId: org.id, orgName: org.name })}
                          disabled={lockingOrgId === org.id}
                          className="text-xs px-2.5 py-0.5 rounded-full font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" />
                          Lock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnlockAccount(org.id)}
                          disabled={lockingOrgId === org.id}
                          className="text-xs px-2.5 py-0.5 rounded-full font-medium border border-green-200 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {lockingOrgId === org.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <LockOpen className="w-3 h-3" />
                          )}
                          Unlock
                        </button>
                      )}
                      {/* Delete org */}
                      <button
                        onClick={() => handleDeleteOrg(org.id, org.name)}
                        disabled={deletingOrgId === org.id}
                        className="text-xs px-2.5 py-0.5 rounded-full font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {deletingOrgId === org.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        Delete
                      </button>
                    </div>
                    {/* Lock reason display */}
                    {org.account_status && org.account_status !== 'active' && org.account_lock_reason && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {org.account_lock_reason}
                      </p>
                    )}

                  </div>
                </div>
              </div>

              {/* Add-ons */}
              <AdminAddons orgId={org.id} orgPlan={org.plan || 'core'} />

              {/* Payment History */}
              <PaymentHistoryTable orgId={org.id} />

              {/* Users in this org */}
              {org.users.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-navy/50 mb-2">
                    Team ({org.users.length})
                  </p>
                  <div className="space-y-2">
                    {org.users.map((u) => (
                      <div key={u.id} className="flex items-center gap-3 text-sm">
                        <div className="w-7 h-7 bg-camel/10 rounded-lg flex items-center justify-center text-xs font-medium text-camel">
                          {u.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-navy font-medium">{u.full_name || 'Unnamed'}</span>
                          <span className="text-navy/40 ml-2">{u.email}</span>
                        </div>
                        <span className="text-xs text-navy/40 capitalize">{u.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModal && (
        <RecordPaymentModal
          orgId={paymentModal.orgId}
          orgName={paymentModal.orgName}
          plan={paymentModal.plan}
          onClose={() => setPaymentModal(null)}
          onSuccess={fetchClients}
        />
      )}
    </div>
  )
}
