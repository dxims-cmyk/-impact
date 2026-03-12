// scripts/reset-admin-password.ts
// Run with: npx tsx scripts/reset-admin-password.ts

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL environment variable is required')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  console.log('\nTo run this script:')
  console.log('1. Get your service role key from Supabase Dashboard > Settings > API')
  console.log('2. Run: $env:SUPABASE_SERVICE_ROLE_KEY="your-key"; npx tsx scripts/reset-admin-password.ts')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function resetPassword() {
  const email = process.env.ADMIN_EMAIL || 'dxims@mediampm.com'
  const newPassword = process.env.ADMIN_PASSWORD || 'Admin123!' // You can change this after logging in

  console.log('Looking up user:', email)

  // First, find the user by email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('Error listing users:', listError.message)
    return
  }

  const user = users.find(u => u.email === email)

  if (!user) {
    console.log('\nUser not found. Creating new admin user...')

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: newPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User',
      },
    })

    if (createError) {
      console.error('Error creating user:', createError.message)
      return
    }

    console.log('\nAdmin user created!')
    console.log('User ID:', newUser.user.id)
    console.log('Email:', email)
    console.log('Password:', newPassword)
    console.log('\nYou can now log in at http://localhost:3002/login')
    return
  }

  console.log('User found! ID:', user.id)
  console.log('Resetting password...')

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
    email_confirm: true, // Ensure email is confirmed
  })

  if (updateError) {
    console.error('Error updating password:', updateError.message)
    return
  }

  console.log('\nPassword reset successful!')
  console.log('Email:', email)
  console.log('New Password:', newPassword)
  console.log('\nYou can now log in at http://localhost:3002/login')
}

resetPassword()
