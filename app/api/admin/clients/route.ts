// app/api/admin/clients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import crypto from 'crypto'
import { createCustomer, createSubscription } from '@/lib/integrations/stripe-billing'

// GET /api/admin/clients - List all clients/orgs (admin only)
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin check
  const { data: userData } = await (supabase
    .from('users') as any)
    .select('is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.is_agency_user) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Fetch all orgs with their owners
  const admin = createAdminClient()
  const { data: orgs, error } = await (admin
    .from('organizations') as any)
    .select('id, name, slug, subscription_tier, subscription_status, plan, plan_changed_at, created_at, settings, account_status, account_locked_at, account_lock_reason, stripe_customer_id, stripe_subscription_id')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get users for each org
  const orgIds = (orgs || []).map((o: any) => o.id)
  const { data: users } = await (admin
    .from('users') as any)
    .select('id, email, full_name, role, organization_id, created_at')
    .in('organization_id', orgIds)

  // Combine
  const enriched = (orgs || []).map((org: any) => ({
    ...org,
    users: (users || []).filter((u: any) => u.organization_id === org.id),
  }))

  return NextResponse.json(enriched)
}

// POST /api/admin/clients - Create new client (admin only)
const createClientSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  clientName: z.string().min(1, 'Client name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  sendWelcomeEmail: z.boolean().default(true),
})

function generatePassword(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  const bytes = crypto.randomBytes(12)
  for (let i = 0; i < 12; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin check
  const { data: userData } = await (supabase
    .from('users') as any)
    .select('is_agency_user')
    .eq('id', user.id)
    .single()

  if (!userData?.is_agency_user) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await request.json()
  const validation = createClientSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 })
  }

  const { businessName, clientName, email, phone, sendWelcomeEmail } = validation.data
  const password = validation.data.password || generatePassword()

  const admin = createAdminClient()

  try {
    // 1. Create user in Supabase Auth
    const { data: authData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: clientName,
        must_change_password: true,
      },
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // 2. Create organization
    const slug = slugify(businessName)
    const { data: org, error: orgError } = await (admin
      .from('organizations') as any)
      .insert({
        name: businessName,
        slug: `${slug}-${Date.now().toString(36)}`,
        settings: {
          phone: phone || null,
          created_by: user.id,
        },
      })
      .select('id, name, slug')
      .single()

    if (orgError) {
      // Cleanup: delete the auth user
      await admin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: orgError.message }, { status: 500 })
    }

    // 3. Create user row linked to org
    const { error: userError } = await (admin
      .from('users') as any)
      .insert({
        id: authData.user.id,
        email,
        full_name: clientName,
        role: 'owner',
        organization_id: org.id,
        is_agency_user: false,
      })

    if (userError) {
      // Cleanup
      await admin.from('organizations').delete().eq('id', org.id)
      await admin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // 4. Create Stripe customer + subscription (non-blocking — don't fail client creation)
    let stripeCustomerId: string | null = null
    let stripeSubscriptionId: string | null = null
    try {
      if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_CORE) {
        const customer = await createCustomer(businessName, email)
        stripeCustomerId = customer.id

        const subscription = await createSubscription(customer.id, 'core')
        stripeSubscriptionId = subscription.id

        await (admin
          .from('organizations') as any)
          .update({
            stripe_customer_id: customer.id,
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
          })
          .eq('id', org.id)
      }
    } catch (stripeErr) {
      console.error('Stripe setup failed (client still created):', stripeErr)
      // Store partial customer ID if we got that far
      if (stripeCustomerId) {
        await (admin
          .from('organizations') as any)
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', org.id)
      }
    }

    // 5. Send welcome email (optional)
    if (sendWelcomeEmail && process.env.RESEND_API_KEY) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'AM:PM Media <noreply@mediampm.com>',
            to: [email],
            subject: 'Welcome to : Impact - Your Login Details',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #1a1a2e; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
                  <h1 style="color: #faf8f5; margin: 0;">Welcome to <span style="color: #6E0F1A;">: Impact</span></h1>
                </div>
                <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                  <p>Hi ${clientName},</p>
                  <p>Your lead management dashboard is ready. Here are your login details:</p>
                  <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 4px 0;"><strong>Login URL:</strong> <a href="${appUrl}/login">${appUrl}/login</a></p>
                    <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 4px 0;"><strong>Temporary Password:</strong> ${password}</p>
                  </div>
                  <p style="color: #6E0F1A; font-weight: 600;">Please change your password on first login.</p>
                  <a href="${appUrl}/login" style="display: inline-block; background: #6E0F1A; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
                    Sign In Now
                  </a>
                  <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
                    Need help? Email us at <a href="mailto:support@mediampm.com">support@mediampm.com</a>
                  </p>
                </div>
              </div>
            `,
          }),
        })
      } catch (emailErr) {
        console.error('Welcome email failed:', emailErr)
        // Don't fail the whole operation for email
      }
    }

    return NextResponse.json({
      user: {
        id: authData.user.id,
        email,
        full_name: clientName,
      },
      organization: org,
      password,
      welcomeEmailSent: sendWelcomeEmail,
    }, { status: 201 })

  } catch (err) {
    console.error('Create client error:', err)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
