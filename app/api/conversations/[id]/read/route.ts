// app/api/conversations/[id]/read/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/conversations/[id]/read - Mark messages as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Mark all inbound messages as read
  const { error: msgError } = await supabase
    .from('messages')
    .update({
      status: 'read',
      read_at: new Date().toISOString(),
    })
    .eq('conversation_id', id)
    .eq('direction', 'inbound')
    .neq('status', 'read')

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 })
  }

  // Reset unread count
  const { error: convError } = await supabase
    .from('conversations')
    .update({ unread_count: 0 })
    .eq('id', id)

  if (convError) {
    return NextResponse.json({ error: convError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
