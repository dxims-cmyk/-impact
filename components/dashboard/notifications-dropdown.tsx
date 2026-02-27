'use client'

import { useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Bell,
  User,
  MessageSquare,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCheck,
  Settings,
  Loader2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNotifications, useMarkNotificationsRead, useMarkAllNotificationsRead } from '@/lib/hooks/use-notifications'
import { useRealtime } from '@/lib/hooks/use-realtime'
import type { Notification } from '@/types/database'

interface NotificationsDropdownProps {
  isOpen: boolean
  onClose: () => void
  onToggle: () => void
}

export function NotificationsDropdown({ isOpen, onClose, onToggle }: NotificationsDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useNotifications()
  const markRead = useMarkNotificationsRead()
  const markAllRead = useMarkAllNotificationsRead()
  const { subscribeToNotifications } = useRealtime()

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  // Subscribe to realtime notifications
  useEffect(() => {
    const unsubscribe = subscribeToNotifications(() => {
      // Query invalidation is handled inside subscribeToNotifications
    })
    return unsubscribe
  }, [subscribeToNotifications])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleMarkAllRead = useCallback((): void => {
    markAllRead.mutate()
  }, [markAllRead])

  const handleMarkAsRead = useCallback((id: string): void => {
    markRead.mutate([id])
  }, [markRead])

  const getIcon = (type: string): typeof Bell => {
    switch (type) {
      case 'lead': return User
      case 'message': return MessageSquare
      case 'appointment': return Calendar
      case 'ai': return Sparkles
      case 'alert': return AlertCircle
      case 'system': return TrendingUp
      default: return Bell
    }
  }

  const getIconStyle = (type: string): string => {
    switch (type) {
      case 'lead': return 'bg-impact/10 text-impact'
      case 'message': return 'bg-studio/10 text-studio'
      case 'appointment': return 'bg-vision/10 text-vision'
      case 'ai': return 'bg-camel/10 text-camel'
      case 'alert': return 'bg-impact/10 text-impact'
      case 'system': return 'bg-navy/10 text-navy'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getNotificationHref = (notification: Notification): string => {
    const meta = notification.metadata as Record<string, string> | null
    if (meta?.lead_id) return `/dashboard/leads/${meta.lead_id}`
    switch (notification.type) {
      case 'lead': return '/dashboard/leads'
      case 'message': return '/dashboard/conversations'
      case 'appointment': return '/dashboard/calendar'
      case 'ai': return '/dashboard/reports'
      case 'alert': return '/dashboard/leads'
      case 'system': return '/dashboard/integrations'
      default: return '/dashboard'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={onToggle}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-impact text-ivory text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-[384px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-navy">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markAllRead.isPending}
                  className="text-xs font-medium text-impact hover:text-impact-light flex items-center gap-1 disabled:opacity-50"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </button>
              )}
              <Link
                href="/dashboard/settings?tab=notifications"
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={onClose}
              >
                <Settings className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin opacity-50" />
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notification) => {
                  const Icon = getIcon(notification.type)
                  return (
                    <Link
                      key={notification.id}
                      href={getNotificationHref(notification)}
                      onClick={() => {
                        if (!notification.is_read) {
                          handleMarkAsRead(notification.id)
                        }
                        onClose()
                      }}
                      className={`block p-4 hover:bg-gray-50 transition-colors ${
                        !notification.is_read ? 'bg-impact/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconStyle(notification.type)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium text-sm ${!notification.is_read ? 'text-navy' : 'text-navy/70'}`}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="w-2 h-2 rounded-full bg-impact flex-shrink-0" />
                            )}
                          </div>
                          {notification.body && (
                            <p className="text-sm text-navy/50 truncate">{notification.body}</p>
                          )}
                          <p className="text-xs text-navy/40 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <Link
              href="/dashboard/notifications"
              onClick={onClose}
              className="block text-center text-sm font-medium text-impact hover:text-impact-light"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
