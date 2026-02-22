// lib/validations/index.ts
// Central Zod validation schemas for all API inputs

import { z } from 'zod'

// Common schemas
export const uuidSchema = z.string().uuid()
export const emailSchema = z.string().email()
export const phoneSchema = z.string().min(10).max(20)
export const dateTimeSchema = z.string().datetime()
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// Lead schemas
export const leadStageSchema = z.enum(['new', 'qualified', 'contacted', 'booked', 'won', 'lost'])
export const temperatureSchema = z.enum(['hot', 'warm', 'cold'])

export const createLeadSchema = z.object({
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  company: z.string().max(255).optional(),
  source: z.string().max(100).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  utm_content: z.string().max(100).optional(),
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone is required'
})

export const updateLeadSchema = z.object({
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  company: z.string().max(255).optional(),
  stage: leadStageSchema.optional(),
  score: z.number().int().min(1).max(10).optional(),
  temperature: temperatureSchema.optional(),
  source: z.string().max(100).optional(),
  assigned_to: uuidSchema.nullable().optional(),
  lost_reason: z.string().max(500).optional(),
})

export const leadFiltersSchema = paginationSchema.extend({
  stage: leadStageSchema.optional(),
  temperature: temperatureSchema.optional(),
  source: z.string().optional(),
  search: z.string().max(100).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  org: uuidSchema.optional(),
})

// Conversation schemas
export const channelSchema = z.enum(['email', 'sms', 'whatsapp'])
export const conversationStatusSchema = z.enum(['open', 'closed', 'snoozed'])

export const createConversationSchema = z.object({
  leadId: uuidSchema,
  channel: channelSchema,
})

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(1600),
})

// Appointment schemas
export const appointmentStatusSchema = z.enum([
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
])

export const createAppointmentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  start_time: dateTimeSchema,
  end_time: dateTimeSchema,
  timezone: z.string().default('Europe/London'),
  lead_id: uuidSchema.optional(),
}).refine(data => {
  const start = new Date(data.start_time)
  const end = new Date(data.end_time)
  return end > start
}, {
  message: 'End time must be after start time'
})

export const updateAppointmentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  start_time: dateTimeSchema.optional(),
  end_time: dateTimeSchema.optional(),
  status: appointmentStatusSchema.optional(),
  cancel_reason: z.string().max(500).optional(),
})

// Report schemas
export const reportTypeSchema = z.enum(['weekly', 'monthly', 'custom'])

export const createReportSchema = z.object({
  report_type: reportTypeSchema,
  period_start: dateSchema,
  period_end: dateSchema,
}).refine(data => {
  const start = new Date(data.period_start)
  const end = new Date(data.period_end)
  return end >= start
}, {
  message: 'End date must be on or after start date'
})

// Team schemas
export const userRoleSchema = z.enum(['owner', 'admin', 'member', 'viewer'])

export const inviteTeamMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(['admin', 'member', 'viewer']),
})

export const updateTeamMemberSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']),
})

// Settings schemas
export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(255).optional(),
  avatar_url: z.string().url().optional().nullable(),
})

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  logo_url: z.string().url().optional().nullable(),
  settings: z.record(z.unknown()).optional(),
})

export const notificationChannelSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  sms: z.boolean().optional(),
})

export const updateNotificationsSchema = z.record(notificationChannelSchema)

// Integration schemas
export const integrationProviderSchema = z.enum([
  'meta_ads',
  'google_ads',
  'tiktok_ads',
  'manychat'
])

// Activity schemas
export const activityTypeSchema = z.enum([
  'created',
  'stage_changed',
  'note_added',
  'call_logged',
  'email_sent',
  'sms_sent',
  'ai_qualified',
  'appointment_booked',
  'appointment_completed',
  'appointment_cancelled',
])

export const createActivitySchema = z.object({
  type: z.string().min(1).max(50),
  content: z.string().min(1).max(2000),
  subject: z.string().max(255).optional(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  channel: channelSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
})

// Webhook payload schemas
export const leadFormWebhookSchema = z.object({
  organization_id: uuidSchema.optional(),
  organization_slug: z.string().optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
}).refine(data => data.organization_id || data.organization_slug, {
  message: 'Either organization_id or organization_slug is required'
})

// Helper to validate and parse request body
export async function validateBody<T extends z.ZodSchema>(
  request: Request,
  schema: T
): Promise<z.infer<T>> {
  const body = await request.json()
  return schema.parse(body)
}

// Helper to validate query params
export function validateQuery<T extends z.ZodSchema>(
  searchParams: URLSearchParams,
  schema: T
): z.infer<T> {
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  return schema.parse(params)
}
