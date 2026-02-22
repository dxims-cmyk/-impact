// app/api/team/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/integrations/resend'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']),
})

// GET /api/team - List team members
export async function GET(request: NextRequest) {
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

  // Get team members
  const { data: members, error } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url, role, created_at')
    .eq('organization_id', userData.organization_id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(members)
}

// POST /api/team - Invite team member
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

  // Check permissions
  if (userData.role !== 'owner' && userData.role !== 'admin') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  // Parse and validate body
  const body = await request.json()
  const validation = inviteSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', validation.data.email)
    .eq('organization_id', userData.organization_id)
    .single()

  if (existingUser) {
    return NextResponse.json({
      error: 'User already exists in organization'
    }, { status: 409 })
  }

  // Get organization name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', userData.organization_id)
    .single()

  // Generate invite link (in production, you'd create an invite token)
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite?org=${userData.organization_id}&email=${encodeURIComponent(validation.data.email)}&role=${validation.data.role}`

  // Send invite email
  try {
    await sendEmail({
      to: validation.data.email,
      subject: `You've been invited to ${org?.name || ': Impact'}`,
      html: `
        <p>You've been invited to join <strong>${org?.name || ': Impact'}</strong>.</p>
        <p>Click the link below to accept the invitation:</p>
        <p><a href="${inviteLink}">Accept Invitation</a></p>
        <p>This invitation will expire in 7 days.</p>
      `
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation sent'
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to send invite:', error)
    return NextResponse.json({
      error: 'Failed to send invitation email'
    }, { status: 500 })
  }
}
