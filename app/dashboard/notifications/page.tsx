'use client'

import { useState } from 'react'
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
import Link from 'next/link'
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationsRead,
} from '@/lib/hooks'
import { formatRelativeTime } from '@/lib/utils'

export default function NotificationsPage(): JSX.Element {
  const { data, isLoading } = useNotifications(50)
  const markAllMutation = useMarkAllNotificationsRead()
  const markReadMutation = useMarkNotificationsRead()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  const markAllAsRead = async (): Promise<void> => {
    await markAllMutation.mutateAsync()
  }

  const getIcon = (type: string) => {
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

  const getIconStyle = (type: string) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Notifications</h1>
          <p className="text-navy/60">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/settings?tab=notifications"
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-impact text-ivory' 
                  : 'text-navy/60 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread' 
                  ? 'bg-impact text-ivory' 
                  : 'text-navy/60 hover:bg-gray-100'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markAllMutation.isPending}
                className="text-sm font-medium text-impact hover:text-impact-light flex items-center gap-1 disabled:opacity-50"
              >
                {markAllMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCheck className="w-4 h-4" />
                )}
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-50">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <h3 className="text-lg font-semibold text-navy mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-navy/50 max-w-sm mx-auto">
                {filter === 'unread'
                  ? "You're all caught up! Check back later for new updates."
                  : "When you receive leads, messages, or important updates, they'll appear here."
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = getIcon(notification.type)
              const href = (notification.metadata as Record<string, unknown> | null)?.href as string | undefined
              return (
                <Link
                  key={notification.id}
                  href={href || '#'}
                  onClick={() => {
                    if (!notification.is_read) {
                      markReadMutation.mutate([notification.id])
                    }
                  }}
                  className={`block p-4 hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-impact/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconStyle(notification.type)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-semibold ${!notification.is_read ? 'text-navy' : 'text-navy/70'}`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="w-2 h-2 rounded-full bg-impact flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-navy/60">{notification.body}</p>
                      <p className="text-xs text-navy/40 mt-2">{formatRelativeTime(notification.created_at)}</p>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
