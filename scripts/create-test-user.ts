// scripts/create-test-user.ts
// Run with: npx tsx scripts/create-test-user.ts

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestUser() {
  const email = process.env.TEST_USER_EMAIL || 'test@impactengine.io'
  const password = process.env.TEST_USER_PASSWORD || 'TestUser123!'

  console.log('Creating test user...')
  console.log('Email:', email)
  console.log('Password:', password)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Test User',
      },
    },
  })

  if (error) {
    console.error('Error creating user:', error.message)

    // If user already exists, try to sign in
    if (error.message.includes('already registered')) {
      console.log('\nUser already exists. Credentials:')
      console.log('Email:', email)
      console.log('Password:', password)
    }
    return
  }

  console.log('\nUser created successfully!')
  console.log('User ID:', data.user?.id)
  console.log('\nCredentials:')
  console.log('Email:', email)
  console.log('Password:', password)

  if (data.user?.identities?.length === 0) {
    console.log('\nNote: User already exists. Use the credentials above to log in.')
  }
}

createTestUser()
