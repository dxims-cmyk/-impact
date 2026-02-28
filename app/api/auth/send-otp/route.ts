import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, two_factor_enabled')
      .eq('email', email)
      .single()

    if (!user) {
      return NextResponse.json({ success: true })
    }

    if (user.two_factor_enabled === false) {
      return NextResponse.json({ twoFactorRequired: false })
    }

    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await supabase.from('otp_codes').delete().eq('email', email)

    await supabase.from('otp_codes').insert({
      user_id: user.id,
      email,
      code,
      expires_at: expiresAt.toISOString()
    })

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Impact <noreply@mediampm.com>',
      to: email,
      subject: 'Your verification code',
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 40px; text-align: center;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #E8642C, #D94E1A); border-radius: 12px; margin: 0 auto 24px;"></div>
          <h1 style="margin: 0 0 8px; font-size: 24px;">Verification Code</h1>
          <p style="margin: 0 0 32px; color: #666;">Enter this code to sign in to :Impact</p>
          <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${code}</span>
          </div>
          <p style="color: #999; font-size: 14px;">This code expires in 10 minutes</p>
        </div>
      `
    })

    return NextResponse.json({ success: true, twoFactorRequired: true })
  } catch (error) {
    console.error('OTP send error:', error)
    return NextResponse.json({ error: 'Failed to send code' }, { status: 500 })
  }
}
