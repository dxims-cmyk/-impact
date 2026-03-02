import { createClient } from '@/lib/supabase/server'

export async function checkAccountActive(orgId: string): Promise<boolean> {
  const supabase = createClient()
  const { data } = await supabase
    .from('organizations')
    .select('account_status')
    .eq('id', orgId)
    .single()

  return data?.account_status === 'active'
}
