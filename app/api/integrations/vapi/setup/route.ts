// app/api/integrations/vapi/setup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import {
  createAssistant,
  updateAssistant,
  buildReceptionistSystemPrompt,
  isWithinBusinessHours,
  type BusinessHours,
} from '@/lib/integrations/vapi'

const businessHoursSchema = z.object({
  enabled: z.boolean(),
  timezone: z.string().default('Europe/London'),
  days: z.array(z.number().min(0).max(6)),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
}).optional()

const setupSchema = z.object({
  greeting: z.string().min(1, 'Greeting is required').max(500),
  questions: z.array(z.string().min(1)).min(1, 'At least one qualifying question is required'),
  calendarLink: z.string().url().optional().or(z.literal('')),
  transferNumber: z.string().optional().or(z.literal('')),
  greetingStyle: z.enum(['formal', 'casual']).default('formal'),
  businessHours: businessHoursSchema,
})

// POST /api/integrations/vapi/setup — Create or update a Vapi assistant for the org
export async function POST(request: NextRequest) {
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

  // Permission check — owner or admin only
  if (userData.role !== 'owner' && userData.role !== 'admin') {
    return NextResponse.json({ error: 'Permission denied. Only owners and admins can configure the AI Receptionist.' }, { status: 403 })
  }

  // Parse and validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = setupSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten(),
    }, { status: 400 })
  }

  const { greeting, questions, calendarLink, transferNumber, greetingStyle, businessHours } = validation.data

  // Get current org to read existing settings and name
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, settings')
    .eq('id', userData.organization_id)
    .single()

  if (orgError || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const orgSettings = (org.settings || {}) as Record<string, any>
  const existingAssistantId = orgSettings.ai_receptionist_assistant_id as string | undefined

  // Build the system prompt
  const systemPrompt = buildReceptionistSystemPrompt({
    businessName: org.name,
    greeting,
    questions,
    calendarLink: calendarLink || undefined,
    transferNumber: transferNumber || undefined,
    greetingStyle: greetingStyle || 'formal',
    isWithinHours: businessHours ? isWithinBusinessHours(businessHours as BusinessHours) : true,
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driveimpact.io'
  const serverUrl = `${appUrl}/api/webhooks/vapi?org_id=${org.id}`

  const assistantConfig = {
    name: `${org.name} AI Receptionist`,
    firstMessage: greeting,
    model: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250514',
      messages: [{ role: 'system' as const, content: systemPrompt }],
    },
    voice: {
      provider: '11labs',
      voiceId: 'paula',
    },
    serverUrl,
    ...(transferNumber ? { forwardingPhoneNumber: transferNumber } : {}),
    metadata: {
      organization_id: org.id,
      managed_by: 'impact-engine',
    },
  }

  try {
    let assistantId: string

    if (existingAssistantId) {
      // Update existing assistant
      const updated = await updateAssistant(existingAssistantId, assistantConfig)
      assistantId = updated.id
    } else {
      // Create new assistant
      const created = await createAssistant(assistantConfig)
      assistantId = created.id
    }

    // Save config to org settings
    const newSettings = {
      ...orgSettings,
      ai_receptionist_assistant_id: assistantId,
      ai_receptionist_enabled: true,
      ai_receptionist_greeting: greeting,
      ai_receptionist_questions: questions,
      ai_receptionist_calendar_link: calendarLink || null,
      ai_receptionist_transfer_number: transferNumber || null,
      ai_receptionist_greeting_style: greetingStyle || 'formal',
      ai_receptionist_business_hours: businessHours || null,
    }

    await supabase
      .from('organizations')
      .update({
        settings: newSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', org.id)

    // Upsert integrations row for provider='vapi'
    const { data: existingIntegration } = await supabase
      .from('integrations')
      .select('id')
      .eq('organization_id', org.id)
      .eq('provider', 'vapi')
      .single()

    if (existingIntegration) {
      await supabase
        .from('integrations')
        .update({
          status: 'connected',
          account_id: assistantId,
          account_name: `${org.name} AI Receptionist`,
          metadata: {
            assistant_id: assistantId,
            greeting,
            questions,
            calendar_link: calendarLink || null,
            transfer_number: transferNumber || null,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingIntegration.id)
    } else {
      await supabase
        .from('integrations')
        .insert({
          organization_id: org.id,
          provider: 'vapi',
          status: 'connected',
          account_id: assistantId,
          account_name: `${org.name} AI Receptionist`,
          metadata: {
            assistant_id: assistantId,
            greeting,
            questions,
            calendar_link: calendarLink || null,
            transfer_number: transferNumber || null,
          },
        })
    }

    return NextResponse.json({
      success: true,
      assistantId,
      message: existingAssistantId ? 'AI Receptionist updated' : 'AI Receptionist created',
    })
  } catch (error) {
    console.error('Vapi setup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to set up AI Receptionist' },
      { status: 500 }
    )
  }
}
