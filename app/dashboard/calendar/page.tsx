'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Video,
  Phone,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  Building2,
  Mail,
  Loader2,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'
import { useAppointments, useCreateAppointment, useUpdateAppointment, useDeleteAppointment } from '@/lib/hooks'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { Appointment } from '@/types/database'

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
]

export default function CalendarPage(): JSX.Element {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'week' | 'day' | 'list'>('week')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)

  // New appointment form state
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newStartTime, setNewStartTime] = useState('09:00')
  const [newEndTime, setNewEndTime] = useState('09:30')
  const [newDescription, setNewDescription] = useState('')

  // Get date range for query based on view
  const dateRange = useMemo(() => {
    if (view === 'day') {
      const start = new Date(currentDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      return { start, end }
    }
    // week + list
    const start = new Date(currentDate)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1)
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return { start, end }
  }, [currentDate, view])

  // Fetch appointments
  const { data: appointmentsData, isLoading, isFetching, refetch } = useAppointments({
    startDate: dateRange.start.toISOString(),
    endDate: dateRange.end.toISOString(),
  })
  const appointments = appointmentsData?.appointments || []

  // Mutations
  const createAppointment = useCreateAppointment()
  const updateAppointment = useUpdateAppointment()
  const deleteAppointment = useDeleteAppointment()

  // Get week dates
  const weekDates = useMemo(() => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(dateRange.start)
      date.setDate(dateRange.start.getDate() + i)
      dates.push(date)
    }
    return dates
  }, [dateRange.start])

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getAppointmentsForSlot = (date: Date, time: string): typeof appointments => {
    const dateStr = formatDate(date)
    return appointments.filter(apt => {
      const aptTime = formatTime(apt.start_time)
      return apt.start_time.startsWith(dateStr) && aptTime === time
    })
  }

  const getStatusStyle = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'bg-studio/10 text-studio border-studio/20'
      case 'scheduled': return 'bg-camel/10 text-camel border-camel/20'
      case 'cancelled': return 'bg-gray-100 text-gray-500 border-gray-200'
      case 'completed': return 'bg-navy/10 text-navy border-navy/20'
      case 'no_show': return 'bg-impact/10 text-impact border-impact/20'
      default: return 'bg-gray-100 text-gray-500 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return CheckCircle2
      case 'scheduled': return AlertCircle
      case 'cancelled': return XCircle
      case 'no_show': return XCircle
      default: return CheckCircle2
    }
  }

  const navigate = (direction: 'prev' | 'next'): void => {
    const newDate = new Date(currentDate)
    const offset = view === 'day' ? 1 : 7
    newDate.setDate(newDate.getDate() + (direction === 'next' ? offset : -offset))
    setCurrentDate(newDate)
  }

  const goToToday = (): void => {
    setCurrentDate(new Date())
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return formatDate(date) === formatDate(today)
  }

  const handleStatusChange = async (id: string, status: string): Promise<void> => {
    try {
      await updateAppointment.mutateAsync({ id, data: { status: status as Appointment['status'] } })
      toast.success('Appointment updated')
      refetch()
      if (selectedAppointment?.id === id) {
        setSelectedAppointment({ ...selectedAppointment, status: status as Appointment['status'] })
      }
    } catch {
      toast.error('Failed to update appointment')
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this appointment?')) return
    try {
      await deleteAppointment.mutateAsync(id)
      toast.success('Appointment deleted')
      setSelectedAppointment(null)
      refetch()
    } catch {
      toast.error('Failed to delete appointment')
    }
  }

  const handleCreateAppointment = async (): Promise<void> => {
    if (!newTitle.trim() || !newDate) {
      toast.error('Title and date are required')
      return
    }
    try {
      await createAppointment.mutateAsync({
        title: newTitle,
        description: newDescription || undefined,
        startTime: new Date(`${newDate}T${newStartTime}:00`).toISOString(),
        endTime: new Date(`${newDate}T${newEndTime}:00`).toISOString(),
      })
      toast.success('Appointment created')
      setShowNewModal(false)
      setNewTitle('')
      setNewDate('')
      setNewStartTime('09:00')
      setNewEndTime('09:30')
      setNewDescription('')
      refetch()
    } catch {
      toast.error('Failed to create appointment')
    }
  }

  // Get today's appointments for sidebar
  const todayAppointments = useMemo(() => {
    const today = formatDate(new Date())
    return appointments
      .filter(apt => apt.start_time.startsWith(today))
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [appointments])

  // Header title
  const headerTitle = useMemo(() => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }
    return weekDates[0]?.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) || ''
  }, [view, currentDate, weekDates])

  // Day view appointments
  const dayAppointments = useMemo(() => {
    const dateStr = formatDate(currentDate)
    return appointments
      .filter(apt => apt.start_time.startsWith(dateStr))
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [appointments, currentDate])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Calendar</h1>
          <p className="text-navy/60">Manage your appointments and calls</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-navy/60 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setNewDate(formatDate(currentDate))
              setShowNewModal(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Navigation */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('prev')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-navy" />
              </button>
              <button
                onClick={() => navigate('next')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-navy" />
              </button>
            </div>
            <h2 className="text-lg font-semibold text-navy">{headerTitle}</h2>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-navy hover:bg-gray-50 transition-colors"
            >
              Today
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(['week', 'day', 'list'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  view === v
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-navy/60 hover:text-navy'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Calendar Grid */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 text-navy/40 animate-spin" />
            </div>
          ) : view === 'week' ? (
            <>
              {/* Week Header */}
              <div className="grid grid-cols-8 border-b border-gray-100">
                <div className="p-3 text-center border-r border-gray-100">
                  <span className="text-xs font-medium text-navy/40">GMT</span>
                </div>
                {weekDates.map((date, i) => (
                  <div
                    key={i}
                    className={`p-3 text-center border-r border-gray-100 last:border-r-0 cursor-pointer hover:bg-gray-50 ${
                      isToday(date) ? 'bg-impact/5' : ''
                    }`}
                    onClick={() => { setCurrentDate(date); setView('day') }}
                  >
                    <p className="text-xs font-medium text-navy/50">{weekDays[i]}</p>
                    <p className={`text-lg font-bold ${
                      isToday(date) ? 'text-impact' : 'text-navy'
                    }`}>
                      {date.getDate()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              <div className="max-h-[600px] overflow-y-auto">
                {timeSlots.map((time) => (
                  <div key={time} className="grid grid-cols-8 border-b border-gray-50 min-h-[80px]">
                    <div className="p-2 text-right border-r border-gray-100 text-xs text-navy/40">
                      {time}
                    </div>
                    {weekDates.map((date, i) => {
                      const slotAppointments = getAppointmentsForSlot(date, time)
                      return (
                        <div
                          key={i}
                          className={`p-1 border-r border-gray-50 last:border-r-0 ${
                            isToday(date) ? 'bg-impact/5' : ''
                          }`}
                        >
                          {slotAppointments.map((apt) => (
                            <button
                              key={apt.id}
                              onClick={() => setSelectedAppointment(apt)}
                              className={`w-full p-2 rounded-lg text-left transition-colors ${
                                apt.status === 'cancelled'
                                  ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                  : 'bg-impact text-ivory hover:bg-impact-light'
                              }`}
                            >
                              <div className="flex items-center gap-1 mb-1">
                                <Video className="w-3 h-3" />
                                <span className="text-xs font-semibold truncate">{apt.title}</span>
                              </div>
                              <p className={`text-xs truncate ${apt.status === 'cancelled' ? 'text-gray-500' : 'text-ivory/80'}`}>
                                {apt.lead?.first_name} {apt.lead?.last_name}
                              </p>
                              <p className={`text-xs ${apt.status === 'cancelled' ? 'text-gray-400' : 'text-ivory/60'}`}>
                                {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                              </p>
                            </button>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </>
          ) : view === 'day' ? (
            <>
              {/* Day Header */}
              <div className="p-4 border-b border-gray-100 bg-impact/5">
                <p className="text-lg font-bold text-navy">
                  {currentDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {isToday(currentDate) && <span className="ml-2 text-sm font-medium text-impact">(Today)</span>}
                </p>
                <p className="text-sm text-navy/50">{dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}</p>
              </div>

              {/* Day Time Slots */}
              <div className="max-h-[600px] overflow-y-auto">
                {timeSlots.map((time) => {
                  const slotAppointments = getAppointmentsForSlot(currentDate, time)
                  return (
                    <div key={time} className="flex border-b border-gray-50 min-h-[80px]">
                      <div className="w-20 p-3 text-right border-r border-gray-100 text-sm text-navy/40 flex-shrink-0">
                        {time}
                      </div>
                      <div className="flex-1 p-2 space-y-2">
                        {slotAppointments.map((apt) => (
                          <button
                            key={apt.id}
                            onClick={() => setSelectedAppointment(apt)}
                            className={`w-full p-3 rounded-xl text-left transition-colors ${
                              apt.status === 'cancelled'
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                : 'bg-impact text-ivory hover:bg-impact-light'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                <span className="font-semibold">{apt.title}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                                apt.status === 'cancelled' ? 'bg-gray-200 text-gray-500' : 'bg-ivory/20 text-ivory'
                              }`}>
                                {apt.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className={`text-sm ${apt.status === 'cancelled' ? 'text-gray-500' : 'text-ivory/80'}`}>
                              {apt.lead?.first_name} {apt.lead?.last_name}
                              {apt.lead?.company && ` • ${apt.lead.company}`}
                            </p>
                            <p className={`text-sm ${apt.status === 'cancelled' ? 'text-gray-400' : 'text-ivory/60'}`}>
                              {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : view === 'list' ? (
            <div className="divide-y divide-gray-100">
              {appointments.length === 0 ? (
                <div className="p-12 text-center text-navy/40">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No appointments this week</p>
                </div>
              ) : (
                appointments
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((apt) => {
                    const StatusIcon = getStatusIcon(apt.status)
                    return (
                      <button
                        key={apt.id}
                        onClick={() => setSelectedAppointment(apt)}
                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-impact/10 flex items-center justify-center flex-shrink-0">
                            <Video className="w-6 h-6 text-impact" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-navy">{apt.title}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize border ${getStatusStyle(apt.status)}`}>
                                {apt.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-sm text-navy/60 mb-1">
                              {apt.lead?.first_name} {apt.lead?.last_name}
                              {apt.lead?.company && ` • ${apt.lead.company}`}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-navy/50">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4" />
                                {new Date(apt.start_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })
              )}
            </div>
          ) : null}
        </div>

        {/* Appointment Detail Sidebar */}
        <div className="w-80">
          {selectedAppointment ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-navy text-lg">{selectedAppointment.title}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize border mt-2 ${getStatusStyle(selectedAppointment.status)}`}>
                    {(() => {
                      const StatusIcon = getStatusIcon(selectedAppointment.status)
                      return <StatusIcon className="w-3 h-3" />
                    })()}
                    {selectedAppointment.status.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4 text-navy/60" />
                </button>
              </div>

              {/* Date & Time */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4 text-navy/60" />
                  </div>
                  <div>
                    <p className="text-xs text-navy/40">Date</p>
                    <p className="text-sm font-medium text-navy">
                      {new Date(selectedAppointment.start_time).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-navy/60" />
                  </div>
                  <div>
                    <p className="text-xs text-navy/40">Time</p>
                    <p className="text-sm font-medium text-navy">
                      {formatTime(selectedAppointment.start_time)} - {formatTime(selectedAppointment.end_time)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lead Info */}
              {selectedAppointment.lead && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-navy/40 uppercase mb-3">Lead</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center text-sm font-semibold text-navy">
                      {`${selectedAppointment.lead.first_name?.[0] || ''}${selectedAppointment.lead.last_name?.[0] || ''}`.toUpperCase()}
                    </div>
                    <div>
                      <Link href={`/dashboard/leads/${selectedAppointment.lead_id}`} className="font-semibold text-navy hover:text-impact transition-colors">
                        {selectedAppointment.lead.first_name} {selectedAppointment.lead.last_name}
                      </Link>
                      {selectedAppointment.lead.company && (
                        <p className="text-sm text-navy/50">{selectedAppointment.lead.company}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {selectedAppointment.lead.email && (
                      <a href={`mailto:${selectedAppointment.lead.email}`} className="flex items-center gap-2 text-sm text-navy/60 hover:text-impact">
                        <Mail className="w-4 h-4" />
                        {selectedAppointment.lead.email}
                      </a>
                    )}
                    {selectedAppointment.lead.phone && (
                      <a href={`tel:${selectedAppointment.lead.phone}`} className="flex items-center gap-2 text-sm text-navy/60 hover:text-impact">
                        <Phone className="w-4 h-4" />
                        {selectedAppointment.lead.phone}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedAppointment.description && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-navy/40 uppercase mb-2">Notes</p>
                  <p className="text-sm text-navy/70">{selectedAppointment.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedAppointment.id, 'confirmed')}
                    disabled={updateAppointment.isPending || selectedAppointment.status === 'confirmed'}
                    className="py-2 rounded-xl border border-studio/30 text-studio font-medium text-sm hover:bg-studio/5 transition-colors disabled:opacity-50"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedAppointment.id, 'completed')}
                    disabled={updateAppointment.isPending || selectedAppointment.status === 'completed'}
                    className="py-2 rounded-xl border border-navy/20 text-navy font-medium text-sm hover:bg-navy/5 transition-colors disabled:opacity-50"
                  >
                    Complete
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedAppointment.id, 'cancelled')}
                    disabled={updateAppointment.isPending || selectedAppointment.status === 'cancelled'}
                    className="py-2 rounded-xl border border-gray-200 text-navy/60 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(selectedAppointment.id)}
                    disabled={deleteAppointment.isPending}
                    className="py-2 rounded-xl border border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="text-center text-navy/40">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select an appointment to view details</p>
              </div>
            </div>
          )}

          {/* Upcoming Today */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mt-4">
            <h4 className="font-semibold text-navy mb-3">Upcoming Today</h4>
            <div className="space-y-2">
              {todayAppointments.length === 0 ? (
                <p className="text-sm text-navy/40 text-center py-4">No appointments today</p>
              ) : (
                todayAppointments.map((apt) => (
                  <button
                    key={apt.id}
                    onClick={() => setSelectedAppointment(apt)}
                    className="w-full p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <p className="font-medium text-navy text-sm">{apt.title}</p>
                    <p className="text-xs text-navy/50">
                      {formatTime(apt.start_time)} • {apt.lead?.first_name} {apt.lead?.last_name}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Appointment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-navy">New Appointment</h3>
              <button onClick={() => setShowNewModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-navy/60" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy/70 mb-1">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Discovery Call"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy/70 mb-1">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-navy/70 mb-1">Start Time</label>
                <input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy/70 mb-1">End Time</label>
                <input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy/70 mb-1">Notes (optional)</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Add any notes..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-impact focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-navy font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAppointment}
                disabled={createAppointment.isPending || !newTitle.trim() || !newDate}
                className="flex-1 py-2.5 rounded-xl bg-impact text-ivory font-semibold text-sm hover:bg-impact-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createAppointment.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
