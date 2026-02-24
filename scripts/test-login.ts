// scripts/test-login.ts
// Run with: npx tsx scripts/test-login.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://btdghcmiqkgcnuzintgr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0ZGdoY21pcWtnY251emludGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNjkyMDUsImV4cCI6MjA4NTg0NTIwNX0.-_beYwU5H_Kf8f8-eeKhKSozipkCgdxDSZx0_KLo_8k'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  const email = 'test@impactengine.io'
  const password = 'TestUser123!'

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
