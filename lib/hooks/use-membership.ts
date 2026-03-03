// lib/hooks/use-membership.ts
import { useUser } from './use-user'
import type { MembershipStatus, PaymentMethod } from '@/types/database'

interface UseMembershipReturn {
  status: MembershipStatus
  isPreview: boolean
  isActive: boolean
  isPastDue: boolean
  isPaused: boolean
  isSuspended: boolean
  isCancelled: boolean
  isFullAccess: boolean
  paymentMethod: PaymentMethod | null
  paidUntil: string | null
  totalMonthsPaid: number
  daysUntilExpiry: number | null
  isInGrace: boolean
}

export function useMembership(): UseMembershipReturn {
  const { data: user } = useUser()
  const org = user?.organization as Record<string, unknown> | undefined

  const status = (org?.membership_status as MembershipStatus) || 'preview'
  const paymentMethod = (org?.payment_method as PaymentMethod) || null
  const paidUntil = (org?.membership_paid_until as string) || null
  const graceUntil = (org?.membership_grace_until as string) || null
  const totalMonthsPaid = (org?.total_months_paid as number) || 0

  const isPreview = status === 'preview'
  const isActive = status === 'active'
  const isPastDue = status === 'past_due'
  const isPaused = status === 'paused'
  const isSuspended = status === 'suspended'
  const isCancelled = status === 'cancelled'
  const isFullAccess = isActive || isPastDue

  // Days until paid_until expires
  let daysUntilExpiry: number | null = null
  if (paidUntil) {
    const diff = new Date(paidUntil).getTime() - Date.now()
    daysUntilExpiry = Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  // Check if currently in grace period
  let isInGrace = false
  if (isPastDue && graceUntil) {
    isInGrace = new Date(graceUntil).getTime() > Date.now()
  }

  return {
    status,
    isPreview,
    isActive,
    isPastDue,
    isPaused,
    isSuspended,
    isCancelled,
    isFullAccess,
    paymentMethod,
    paidUntil,
    totalMonthsPaid,
    daysUntilExpiry,
    isInGrace,
  }
}
