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
  Filter,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'

// TODO: Replace with real notifications from database
// For now, showing empty state until notifications table is added
interface Notification {
  id: string
  type: 'lead' | 'message' | 'appointment' | 'ai' | 'alert' | 'system'
  title: string
  description: string
  time: string
  read: boolean
  href?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const clearAll = () => {
    setNotifications([])
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
                className="text-sm font-medium text-impact hover:text-impact-light flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-sm font-medium text-navy/50 hover:text-impact flex items-center gap-1 ml-4"
              >
                <Trash2 className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-50">
          {filteredNotifications.length === 0 ? (
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
              return (
                <Link
                  key={notification.id}
                  href={notification.href || '#'}
                  className={`block p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-impact/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconStyle(notification.type)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-semibold ${!notification.read ? 'text-navy' : 'text-navy/70'}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-impact flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-navy/60">{notification.description}</p>
                      <p className="text-xs text-navy/40 mt-2">{notification.time}</p>
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
