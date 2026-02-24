// app/api/settings/forms/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const fieldSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(100),
  type: z.enum(['text', 'email', 'tel', 'textarea', 'select']),
  required: z.boolean(),
  enabled: z.boolean(),
  placeholder: z.string().max(200).optional(),
  options: z.array(z.string()).optional(), // for select type
  isDefault: z.boolean().optional(),
})

const appearanceSchema = z.object({
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  submitButtonText: z.string().max(100).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  darkMode: z.boolean().optional(),
})

const behaviorSchema = z.object({
  successMessage: z.string().max(500).optional(),
  redirectUrl: z.string().url().or(z.literal('')).optional(),
  enableRecaptcha: z.boolean().optional(),
})

const embedSchema = z.object({
  type: z.enum(['inline', 'popup']).optional(),
  width: z.enum(['full', 'fixed']).optional(),
  fixedWidth: z.number().min(200).max(1200).optional(),
})

const updateFormConfigSchema = z.object({
  fields: z.array(fieldSchema).optional(),
  appearance: appearanceSchema.optional(),
  behavior: behaviorSchema.optional(),
  embed: embedSchema.optional(),
}).refine(
  (data) => data.fields || data.appearance || data.behavior || data.embed,
  { message: 'At least one of fields, appearance, behavior, or embed must be provided' }
)

// GET /api/settings/forms - Get form config
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Read org form_config
  const { data: org, error } = await supabase
    .from('organizations')
    .select('form_config')
    .eq('id', userData.organization_id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return the form_config or default config
  const formConfig = (org as any)?.form_config || getDefaultFormConfig()

  return NextResponse.json(formConfig)
}

// PATCH /api/settings/forms - Update form config
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org and role
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Check permissions
  if (userData.role !== 'owner' && userData.role !== 'admin') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  // Parse and validate body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = updateFormConfigSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten(),
    }, { status: 400 })
  }

  // Get current form_config for shallow merge
  const { data: currentOrg } = await supabase
    .from('organizations')
    .select('form_config')
    .eq('id', userData.organization_id)
    .single()

  const currentConfig = (currentOrg as any)?.form_config || getDefaultFormConfig()

  // Shallow merge at top level (fields, appearance, behavior, embed)
  const mergedConfig = {
    fields: validation.data.fields ?? currentConfig.fields,
    appearance: validation.data.appearance
      ? { ...currentConfig.appearance, ...validation.data.appearance }
      : currentConfig.appearance,
    behavior: validation.data.behavior
      ? { ...currentConfig.behavior, ...validation.data.behavior }
      : currentConfig.behavior,
    embed: validation.data.embed
      ? { ...currentConfig.embed, ...validation.data.embed }
      : currentConfig.embed,
  }

  const { data: org, error } = await supabase
    .from('organizations')
    .update({
      form_config: mergedConfig as any,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', userData.organization_id)
    .select('form_config')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json((org as any)?.form_config || mergedConfig)
}

function getDefaultFormConfig() {
  return {
    fields: [
      { id: 'name', label: 'Name', type: 'text', required: true, enabled: true, placeholder: 'Your full name', isDefault: true },
      { id: 'email', label: 'Email', type: 'email', required: true, enabled: true, placeholder: 'you@example.com', isDefault: true },
      { id: 'phone', label: 'Phone', type: 'tel', required: false, enabled: true, placeholder: '+44 7700 900000', isDefault: true },
      { id: 'company', label: 'Company', type: 'text', required: false, enabled: true, placeholder: 'Your company', isDefault: true },
      { id: 'message', label: 'Message', type: 'textarea', required: false, enabled: true, placeholder: 'How can we help?', isDefault: true },
    ],
    appearance: {
      title: 'Get in Touch',
      subtitle: 'Fill out the form below and we\'ll get back to you shortly.',
      submitButtonText: 'Submit',
      accentColor: '#6E0F1A',
      darkMode: false,
    },
    behavior: {
      successMessage: 'Thank you! We\'ll be in touch soon.',
      redirectUrl: '',
      enableRecaptcha: false,
    },
    embed: {
      type: 'inline',
      width: 'full',
      fixedWidth: 500,
    },
  }
}
