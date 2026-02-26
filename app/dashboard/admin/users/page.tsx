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
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
  RefreshCw,
  Copy,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'

interface ClientOrg {
  id: string
  name: string
  slug: string
  subscription_tier: string
  subscription_status: string
  plan?: string
  plan_changed_at?: string
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

  const handlePlanChange = async (orgId: string, currentPlan: string): Promise<void> => {
    const newPlan = currentPlan === 'core' ? 'pro' : 'core'
    const action = newPlan === 'pro' ? 'upgrade to Pro' : 'downgrade to Core'

    if (!confirm(`Are you sure you want to ${action} for this client?`)) {
      return
    }

    setChangingPlanFor(orgId)
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      })

      if (res.ok) {
        fetchClients()
        toast.success(`Client ${newPlan === 'pro' ? 'upgraded to Pro' : 'downgraded to Core'}`)
      } else {
        toast.error('Failed to change plan')
      }
    } catch {
      toast.error('Error changing plan')
    } finally {
      setChangingPlanFor(null)
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
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        org.plan === 'pro'
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                          : 'bg-navy/5 text-navy/60'
                      }`}>
                        {org.plan === 'pro' ? '⚡ Pro' : 'Core'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        org.subscription_status === 'active' ? 'bg-green-50 text-green-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {org.subscription_status || 'active'}
                      </span>
                      <button
                        onClick={() => handlePlanChange(org.id, org.plan || 'core')}
                        disabled={changingPlanFor === org.id}
                        className="text-xs px-2.5 py-0.5 rounded-full font-medium border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        {changingPlanFor === org.id ? 'Changing...' : (
                          (org.plan || 'core') === 'core' ? 'Upgrade to Pro' : 'Downgrade to Core'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

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
    </div>
  )
}
