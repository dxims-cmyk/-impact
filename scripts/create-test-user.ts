// scripts/create-test-user.ts
// Run with: npx tsx scripts/create-test-user.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://btdghcmiqkgcnuzintgr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0ZGdoY21pcWtnY251emludGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNjkyMDUsImV4cCI6MjA4NTg0NTIwNX0.-_beYwU5H_Kf8f8-eeKhKSozipkCgdxDSZx0_KLo_8k'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestUser() {
  const email = 'test@impactengine.io'
  const password = 'TestUser123!'

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
