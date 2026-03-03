// lib/system-log.ts
// Centralized system logging for admin alerts dashboard
import { createAdminClient } from '@/lib/supabase/server'

type LogLevel = 'info' | 'warning' | 'error' | 'critical'
type LogCategory = 'webhook' | 'email' | 'whatsapp' | 'sync' | 'billing' | 'auth' | 'leadgen'

export async function systemLog(
  level: LogLevel,
  category: LogCategory,
  message: string,
  organizationId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('system_logs').insert({
      level,
      category,
      message,
      organization_id: organizationId || null,
      metadata: metadata || {},
    })
  } catch (err) {
    // Don't let logging failures break the main flow
    console.error('[system-log] Failed to write log:', err)
  }
}
