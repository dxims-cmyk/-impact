// scripts/test-rls-security.ts
// Run with: npx tsx scripts/test-rls-security.ts
//
// Tests that the RLS fix in 20260310_secure_users_rls.sql is working.
// Requires a non-admin test user (TEST_USER_EMAIL / TEST_USER_PASSWORD).

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const email = process.env.TEST_USER_EMAIL
const password = process.env.TEST_USER_PASSWORD

if (!email || !password) {
  console.error('Missing TEST_USER_EMAIL or TEST_USER_PASSWORD')
  process.exit(1)
}

async function testRLSSecurity() {
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: email!,
    password: password!,
  })

  if (authError || !auth.user) {
    console.error('Could not sign in as test user:', authError?.message)
    process.exit(1)
  }

  console.log(`Signed in as: ${auth.user.email} (${auth.user.id})`)
  console.log('Testing RLS security...\n')

  let passed = 0
  let failed = 0

  // Test 1: Try to escalate to agency user
  const { error: agencyError } = await supabase
    .from('users')
    .update({ is_agency_user: true })
    .eq('id', auth.user.id)

  if (agencyError) {
    console.log('1. Escalate is_agency_user:    BLOCKED')
    passed++
  } else {
    console.log('1. Escalate is_agency_user:    VULNERABLE')
    failed++
    // Revert
    await supabase.from('users').update({ is_agency_user: false }).eq('id', auth.user.id)
  }

  // Test 2: Try to change role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', auth.user.id)
    .single()

  const { error: roleError } = await supabase
    .from('users')
    .update({ role: 'owner' })
    .eq('id', auth.user.id)

  if (roleError) {
    console.log('2. Escalate role to owner:     BLOCKED')
    passed++
  } else {
    console.log('2. Escalate role to owner:     VULNERABLE')
    failed++
    // Revert
    if (currentUser?.role) {
      await supabase.from('users').update({ role: currentUser.role }).eq('id', auth.user.id)
    }
  }

  // Test 3: Try to switch organization
  const { error: orgError } = await supabase
    .from('users')
    .update({ organization_id: '00000000-0000-0000-0000-000000000000' })
    .eq('id', auth.user.id)

  if (orgError) {
    console.log('3. Switch organization_id:     BLOCKED')
    passed++
  } else {
    console.log('3. Switch organization_id:     VULNERABLE')
    failed++
  }

  // Test 4: Ensure safe fields still work
  const { error: safeError } = await supabase
    .from('users')
    .update({ full_name: 'RLS Test - Safe Update' })
    .eq('id', auth.user.id)

  if (!safeError) {
    console.log('4. Update full_name (safe):    ALLOWED')
    passed++
    // Revert
    await supabase.from('users').update({ full_name: 'Test User' }).eq('id', auth.user.id)
  } else {
    console.log('4. Update full_name (safe):    BLOCKED (should be allowed!)')
    failed++
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`)
  if (failed > 0) {
    console.log('\nWARNING: RLS vulnerabilities detected! Run the migration immediately.')
  } else {
    console.log('\nAll security checks passed.')
  }

  await supabase.auth.signOut()
}

testRLSSecurity()
