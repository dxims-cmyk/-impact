// scripts/test-login.ts
// Run with: npx tsx scripts/test-login.ts

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  const email = process.env.TEST_USER_EMAIL || 'test@impactengine.io'
  const password = process.env.TEST_USER_PASSWORD || 'TestUser123!'

  console.log('Testing login...')
  console.log('Email:', email)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('\nLogin failed:', error.message)
    console.error('Error code:', error.status)

    if (error.message.includes('Email not confirmed')) {
      console.log('\nThe email needs to be confirmed. Supabase requires email verification.')
      console.log('Options:')
      console.log('1. Check email inbox for confirmation link')
      console.log('2. Disable email confirmation in Supabase dashboard')
      console.log('3. Use service role key to auto-confirm user')
    }
    return
  }

  console.log('\nLogin successful!')
  console.log('User ID:', data.user?.id)
  console.log('Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No')
}

testLogin()
