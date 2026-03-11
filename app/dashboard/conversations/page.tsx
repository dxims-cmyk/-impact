'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Search,
  Phone,
  Mail,
  MessageSquare,
  Send,
  Sparkles,
  Clock,
  CheckCheck,
  Check,
  ChevronDown,
  User,
  Building2,
  Trash2,
  Loader2,
  RefreshCw,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import { useConversations, useMessages, useSendMessage, useGenerateAIReply, useMarkAsRead, useRealtimeMessages } from '@/lib/hooks'
import type { ConversationFilters } from '@/lib/hooks/use-conversations'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { Conversation, Message } from '@/types/database'

const channels = [
  { value: 'all', label: 'All', icon: MessageSquare },
  { value: 'sms', label: 'SMS', icon: MessageSquare },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'whatsapp', label: 'WhatsApp', icon: Phone },
  { value: 'instagram_dm', label: 'Instagram', icon: MessageSquare },
  { value: 'messenger', label: 'Messenger', icon: MessageSquare },
]

// Conversation list item skeleton
function ConversationSkeleton() {
  return (
    <div className="w-full p-4 border-b border-gray-50 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-200" />
        <div className="flex-1">
          <div className="w-32 h-4 bg-gray-200 rounded mb-2" />
          <div className="w-24 h-3 bg-gray-200 rounded mb-2" />
          <div className="w-48 h-3 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
}

// Message skeleton
function MessageSkeleton({ outbound }: { outbound: boolean }) {
  return (
    <div className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] rounded-2xl px-4 py-3 animate-pulse ${
        outbound ? 'bg-gray-200 rounded-br-md' : 'bg-gray-100 rounded-bl-md'
      }`}>
        <div className="w-48 h-4 bg-gray-300 rounded mb-2" />
        <div className="w-32 h-4 bg-gray-300 rounded" />
      </div>
    </div>
  )
}

// Status icon for outbound messages
function MessageStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'read':
      return <CheckCheck className="w-3 h-3 text-ivory/90" />
    case 'delivered':
      return <CheckCheck className="w-3 h-3" />
    case 'sent':
      return <Check className="w-3 h-3" />
    case 'pending':
      return <Clock className="w-3 h-3" />
    case 'failed':
      return <AlertCircle className="w-3 h-3 text-red-300" />
    default:
      return <Check className="w-3 h-3" />
  }
}

export default function ConversationsPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState('all')
  const [messageInput, setMessageInput] = useState('')
  const [replyChannel, setReplyChannel] = useState<string | null>(null)
  const [showAiSuggestion, setShowAiSuggestion] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading, isFetching: conversationsFetching, refetch: refetchConversations } = useConversations({
    channel: channelFilter !== 'all' ? channelFilter as ConversationFilters['channel'] : undefined,
  })
  const conversations = conversationsData?.conversations || []

  // Selected conversation
  const selectedConversation = conversations.find(c => c.id === selectedConversationId)

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useMessages(selectedConversationId || '')

  // Mutations
  const sendMessage = useSendMessage()
  const generateAIReply = useGenerateAIReply()
  const markAsRead = useMarkAsRead()

  // Realtime: auto-refresh when new messages arrive
  useRealtimeMessages(selectedConversationId)

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    const leadName = `${conv.lead?.first_name || ''} ${conv.lead?.last_name || ''}`.toLowerCase()
    const company = (conv.lead?.company || '').toLowerCase()
    const phone = (conv.lead?.phone || '').toLowerCase()
    const email = (conv.lead?.email || '').toLowerCase()
    const q = searchQuery.toLowerCase()
    return leadName.includes(q) || company.includes(q) || phone.includes(q) || email.includes(q)
  })

  // Auto-select first conversation on desktop
  useEffect(() => {
    if (!selectedConversationId && filteredConversations.length > 0 && window.innerWidth >= 1024) {
      setSelectedConversationId(filteredConversations[0].id)
    }
  }, [filteredConversations, selectedConversationId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark as read when selecting conversation
  useEffect(() => {
    if (selectedConversationId && selectedConversation?.unread_count && selectedConversation.unread_count > 0) {
      markAsRead.mutate(selectedConversationId)
    }
  }, [selectedConversationId])

  // Reset reply channel when selecting a new conversation
  useEffect(() => {
    setReplyChannel(null)
    setShowAiSuggestion(false)
    setAiSuggestion('')
    setMessageInput('')
  }, [selectedConversationId])

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms': return MessageSquare
      case 'email': return Mail
      case 'whatsapp': return Phone
      case 'instagram_dm': return MessageSquare
      case 'messenger': return MessageSquare
      default: return MessageSquare
    }
  }

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'sms': return 'SMS'
      case 'email': return 'Email'
      case 'whatsapp': return 'WhatsApp'
      case 'instagram_dm': return 'Instagram'
      case 'messenger': return 'Messenger'
      default: return channel
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'sms': return 'bg-studio/10 text-studio'
      case 'email': return 'bg-vision/10 text-vision'
      case 'whatsapp': return 'bg-green-100 text-green-700'
      case 'instagram_dm': return 'bg-pink-100 text-pink-700'
      case 'messenger': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getTempColor = (temp: string | null) => {
    switch (temp) {
      case 'hot': return 'bg-impact'
      case 'warm': return 'bg-camel'
      case 'cold': return 'bg-vision'
      default: return 'bg-gray-400'
    }
  }

  // Get last message preview from the messages array returned by API
  const getLastMessagePreview = (conv: typeof conversations[0]): string => {
    if (conv.messages && conv.messages.length > 0) {
      const lastMsg = conv.messages[conv.messages.length - 1]
      const prefix = lastMsg.direction === 'outbound' ? 'You: ' : ''
      return prefix + (lastMsg.content?.substring(0, 80) || '')
    }
    return 'No messages yet'
  }

  // Determine which channel to send on
  const getActiveChannel = (): string => {
    if (replyChannel) return replyChannel
    return selectedConversation?.channel || 'whatsapp'
  }

  // Check if lead has the contact info for a channel
  const canUseChannel = (channel: string): boolean => {
    if (!selectedConversation?.lead) return false
    if (channel === 'email') return !!selectedConversation.lead.email
    if (channel === 'instagram_dm' || channel === 'messenger') {
      // These channels are available when the conversation was opened on that channel
      return selectedConversation.channel === channel
    }
    return !!selectedConversation.lead.phone
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversationId) return

    const activeChannel = getActiveChannel()
    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId,
        content: messageInput,
        channel: replyChannel || undefined,
      })
      setMessageInput('')
      setShowAiSuggestion(false)
      refetchMessages()
    } catch (error) {
      toast.error('Failed to send message')
    }
  }

  const handleGenerateAI = async () => {
    if (!selectedConversationId) return

    try {
      const result = await generateAIReply.mutateAsync(selectedConversationId)
      setAiSuggestion(result.suggestion)
      setShowAiSuggestion(true)
    } catch (error) {
      toast.error('Failed to generate AI reply')
    }
  }

  const handleUseAiSuggestion = () => {
    setMessageInput(aiSuggestion)
    setShowAiSuggestion(false)
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-0 lg:gap-6">
      {/* Conversations List */}
      <div className={`w-full lg:w-96 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden ${selectedConversationId ? 'hidden lg:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy">Conversations</h2>
            <button
              onClick={() => refetchConversations()}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-navy/60 ${conversationsFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
            />
          </div>

          {/* Channel Filter */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1 scroll-smooth">
            {channels.map((ch) => {
              const isActive = channelFilter === ch.value
              const Icon = ch.icon
              return (
                <button
                  key={ch.value}
                  onClick={() => setChannelFilter(ch.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                    isActive
                      ? 'bg-impact text-ivory shadow-md scale-105'
                      : 'bg-gray-100 text-navy/40 hover:bg-gray-200 hover:text-navy/60'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {ch.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <>
              <ConversationSkeleton />
              <ConversationSkeleton />
              <ConversationSkeleton />
            </>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-navy/40">
              <div className="w-14 h-14 rounded-2xl bg-navy/5 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-7 h-7 text-navy/30" />
              </div>
              <p className="font-medium text-navy/60 mb-1">No conversations yet</p>
              <p className="text-xs text-navy/40">Conversations start when leads are contacted via WhatsApp, SMS, or email.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const ChannelIcon = getChannelIcon(conv.channel)
              const isSelected = selectedConversationId === conv.id
              const leadName = `${conv.lead?.first_name || ''} ${conv.lead?.last_name || ''}`.trim() || 'Unknown'
              const initials = leadName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
              const lastPreview = getLastMessagePreview(conv)

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`w-full p-4 text-left border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-impact/5 border-l-4 border-l-impact' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center text-sm font-semibold text-navy">
                        {initials}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${getTempColor(conv.lead?.temperature || null)} border-2 border-white`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-navy truncate">{leadName}</span>
                          <span className={`p-1 rounded ${getChannelColor(conv.channel)}`}>
                            <ChannelIcon className="w-3 h-3" />
                          </span>
                        </div>
                        <span className="text-xs text-navy/40 flex-shrink-0">
                          {formatRelativeTime(conv.last_message_at || conv.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-navy/50 mb-1">{conv.lead?.company || 'No company'}</p>
                      <p className="text-sm text-navy/70 truncate">
                        {lastPreview}
                      </p>
                    </div>

                    {/* Unread Badge */}
                    {conv.unread_count && conv.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full bg-impact text-ivory text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Conversation Detail */}
      <div className={`flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex-col overflow-hidden ${selectedConversationId ? 'flex' : 'hidden lg:flex'}`}>
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile back button */}
                <button
                  onClick={() => setSelectedConversationId(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
                >
                  <ChevronDown className="w-5 h-5 text-navy rotate-90" />
                </button>
                <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center text-sm font-semibold text-navy">
                  {`${selectedConversation.lead?.first_name || ''}${selectedConversation.lead?.last_name || ''}`.slice(0, 2).toUpperCase() || '?'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-navy">
                      {`${selectedConversation.lead?.first_name || ''} ${selectedConversation.lead?.last_name || ''}`.trim() || 'Unknown'}
                    </h3>
                    <span className={`w-2 h-2 rounded-full ${getTempColor(selectedConversation.lead?.temperature || null)}`} />
                    {selectedConversation.ai_handling === 'active' && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-impact/10 text-impact text-xs font-medium">
                        <Sparkles className="w-3 h-3" />
                        AI Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-navy/50 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {selectedConversation.lead?.company || 'No company'}
                    <span className="text-navy/30 mx-1">|</span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${getChannelColor(selectedConversation.channel)}`}>
                      {getChannelLabel(selectedConversation.channel)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedConversation.lead?.phone && (
                  <a href={`tel:${selectedConversation.lead.phone}`} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Call">
                    <Phone className="w-4 h-4 text-navy/60" />
                  </a>
                )}
                <Link href={`/dashboard/leads/${selectedConversation.lead_id}`} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="View Lead">
                  <User className="w-4 h-4 text-navy/60" />
                </Link>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <>
                  <MessageSkeleton outbound={false} />
                  <MessageSkeleton outbound={true} />
                  <MessageSkeleton outbound={false} />
                </>
              ) : messages && messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.direction === 'outbound'
                          ? msg.status === 'failed'
                            ? 'bg-red-500 text-white rounded-br-md'
                            : 'bg-impact text-ivory rounded-br-md'
                          : 'bg-gray-100 text-navy rounded-bl-md'
                      }`}
                    >
                      {msg.is_ai_generated && msg.direction === 'outbound' && (
                        <div className="flex items-center gap-1 text-xs text-ivory/70 mb-1">
                          <Sparkles className="w-3 h-3" />
                          AI Generated
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                        msg.direction === 'outbound' ? 'text-ivory/60' : 'text-navy/40'
                      }`}>
                        <span>{formatRelativeTime(msg.created_at)}</span>
                        {msg.direction === 'outbound' && (
                          <MessageStatusIcon status={msg.status} />
                        )}
                      </div>
                      {msg.status === 'failed' && (
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-red-200">
                          <div className="flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            {msg.error_message || 'Send failed'}
                          </div>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              try {
                                const res = await fetch(`/api/messages/${msg.id}/retry`, { method: 'POST' })
                                if (!res.ok) throw new Error('Retry failed')
                                toast.success('Message retrying...')
                              } catch {
                                toast.error('Retry failed')
                              }
                            }}
                            className="text-white/80 hover:text-white underline font-medium"
                          >
                            Retry
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-navy/40">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Suggestion */}
            {showAiSuggestion && aiSuggestion && (
              <div className="px-4 py-3 border-t border-gray-100 bg-impact/5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-impact flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-ivory" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-impact mb-1">AI Suggested Reply</p>
                    <p className="text-sm text-navy/80 whitespace-pre-wrap">{aiSuggestion}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handleUseAiSuggestion}
                      className="px-3 py-1.5 rounded-lg bg-impact text-ivory text-xs font-medium hover:bg-impact-light transition-colors"
                    >
                      Use
                    </button>
                    <button
                      onClick={() => setShowAiSuggestion(false)}
                      className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-navy/40" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-100">
              {/* Channel Switcher */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-navy/40">Reply via:</span>
                {(['whatsapp', 'sms', 'email', ...(selectedConversation?.channel === 'instagram_dm' ? ['instagram_dm'] : []), ...(selectedConversation?.channel === 'messenger' ? ['messenger'] : [])] as string[]).map((ch) => {
                  const Icon = getChannelIcon(ch)
                  const active = getActiveChannel() === ch
                  const available = canUseChannel(ch)
                  return (
                    <button
                      key={ch}
                      onClick={() => setReplyChannel(ch)}
                      disabled={!available}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        active
                          ? 'bg-impact text-ivory'
                          : available
                            ? 'bg-gray-100 text-navy/60 hover:bg-gray-200'
                            : 'bg-gray-50 text-navy/20 cursor-not-allowed'
                      }`}
                      title={!available ? `Lead has no ${ch === 'email' ? 'email' : 'phone number'}` : `Reply via ${getChannelLabel(ch)}`}
                    >
                      <Icon className="w-3 h-3" />
                      {getChannelLabel(ch)}
                    </button>
                  )
                })}
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={`Message via ${getChannelLabel(getActiveChannel())}...`}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessage.isPending}
                  className="p-3 rounded-xl bg-impact text-ivory hover:bg-impact-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <button
                  onClick={handleGenerateAI}
                  disabled={generateAIReply.isPending}
                  className="text-xs text-navy/50 hover:text-impact flex items-center gap-1 disabled:opacity-50"
                >
                  {generateAIReply.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Generate AI Reply
                </button>
                <span className="text-xs text-navy/30">Shift+Enter for new line</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-navy/40">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No conversation selected</p>
              <p className="text-sm">Select a conversation from the list to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
