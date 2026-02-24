// types/database.ts
// Auto-generated types from Supabase schema
// Run `npm run db:generate` to regenerate after schema changes

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          settings: Json
          subscription_tier: 'launch' | 'grow' | 'scale'
          subscription_status: 'active' | 'past_due' | 'cancelled'
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          settings?: Json
          subscription_tier?: 'launch' | 'grow' | 'scale'
          subscription_status?: 'active' | 'past_due' | 'cancelled'
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          settings?: Json
          subscription_tier?: 'launch' | 'grow' | 'scale'
          subscription_status?: 'active' | 'past_due' | 'cancelled'
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'owner' | 'admin' | 'member' | 'viewer'
          organization_id: string | null
          is_agency_user: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          organization_id?: string | null
          is_agency_user?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          organization_id?: string | null
          is_agency_user?: boolean
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          organization_id: string
          email: string | null
          phone: string | null
          first_name: string | null
          last_name: string | null
          company: string | null
          stage: 'new' | 'qualified' | 'contacted' | 'booked' | 'won' | 'lost'
          score: number | null
          temperature: 'hot' | 'warm' | 'cold' | null
          source: string | null
          source_detail: Json | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_content: string | null
          ai_summary: string | null
          buying_signals: string[] | null
          objections: string[] | null
          recommended_action: string | null
          assigned_to: string | null
          created_at: string
          updated_at: string
          qualified_at: string | null
          contacted_at: string | null
          booked_at: string | null
          converted_at: string | null
          lost_at: string | null
          lost_reason: string | null
          invoice_id: string | null
          invoice_status: 'none' | 'draft' | 'sent' | 'viewed' | 'paid' | null
        }
        Insert: {
          id?: string
          organization_id: string
          email?: string | null
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          company?: string | null
          stage?: 'new' | 'qualified' | 'contacted' | 'booked' | 'won' | 'lost'
          score?: number | null
          temperature?: 'hot' | 'warm' | 'cold' | null
          source?: string | null
          source_detail?: Json | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          ai_summary?: string | null
          buying_signals?: string[] | null
          objections?: string[] | null
          recommended_action?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          qualified_at?: string | null
          contacted_at?: string | null
          booked_at?: string | null
          converted_at?: string | null
          lost_at?: string | null
          lost_reason?: string | null
          invoice_id?: string | null
          invoice_status?: 'none' | 'draft' | 'sent' | 'viewed' | 'paid' | null
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string | null
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          company?: string | null
          stage?: 'new' | 'qualified' | 'contacted' | 'booked' | 'won' | 'lost'
          score?: number | null
          temperature?: 'hot' | 'warm' | 'cold' | null
          source?: string | null
          source_detail?: Json | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          ai_summary?: string | null
          buying_signals?: string[] | null
          objections?: string[] | null
          recommended_action?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          qualified_at?: string | null
          contacted_at?: string | null
          booked_at?: string | null
          converted_at?: string | null
          lost_at?: string | null
          lost_reason?: string | null
          invoice_id?: string | null
          invoice_status?: 'none' | 'draft' | 'sent' | 'viewed' | 'paid' | null
        }
      }
      lead_activities: {
        Row: {
          id: string
          lead_id: string
          organization_id: string
          type: string
          direction: 'inbound' | 'outbound' | null
          channel: 'email' | 'sms' | 'whatsapp' | 'call' | 'manychat' | null
          subject: string | null
          content: string | null
          metadata: Json | null
          performed_by: string | null
          is_automated: boolean
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          organization_id: string
          type: string
          direction?: 'inbound' | 'outbound' | null
          channel?: 'email' | 'sms' | 'whatsapp' | 'call' | 'manychat' | null
          subject?: string | null
          content?: string | null
          metadata?: Json | null
          performed_by?: string | null
          is_automated?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          organization_id?: string
          type?: string
          direction?: 'inbound' | 'outbound' | null
          channel?: 'email' | 'sms' | 'whatsapp' | 'call' | 'manychat' | null
          subject?: string | null
          content?: string | null
          metadata?: Json | null
          performed_by?: string | null
          is_automated?: boolean
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          lead_id: string
          organization_id: string
          channel: 'email' | 'sms' | 'whatsapp'
          status: 'open' | 'closed' | 'snoozed'
          last_message_at: string | null
          unread_count: number
          ai_handling: 'off' | 'active' | 'paused' | 'handed_off'
          ai_message_count: number
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          organization_id: string
          channel: 'email' | 'sms' | 'whatsapp'
          status?: 'open' | 'closed' | 'snoozed'
          last_message_at?: string | null
          unread_count?: number
          ai_handling?: 'off' | 'active' | 'paused' | 'handed_off'
          ai_message_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          organization_id?: string
          channel?: 'email' | 'sms' | 'whatsapp'
          status?: 'open' | 'closed' | 'snoozed'
          last_message_at?: string | null
          unread_count?: number
          ai_handling?: 'off' | 'active' | 'paused' | 'handed_off'
          ai_message_count?: number
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          organization_id: string
          direction: 'inbound' | 'outbound'
          content: string
          status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
          external_id: string | null
          error_message: string | null
          is_ai_generated: boolean
          ai_confidence: number | null
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          organization_id: string
          direction: 'inbound' | 'outbound'
          content: string
          status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
          external_id?: string | null
          error_message?: string | null
          is_ai_generated?: boolean
          ai_confidence?: number | null
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          organization_id?: string
          direction?: 'inbound' | 'outbound'
          content?: string
          status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
          external_id?: string | null
          error_message?: string | null
          is_ai_generated?: boolean
          ai_confidence?: number | null
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          lead_id: string | null
          organization_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          timezone: string
          status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          google_event_id: string | null
          outlook_event_id: string | null
          reminder_sent_24h: boolean
          reminder_sent_1h: boolean
          created_at: string
          cancelled_at: string | null
          cancel_reason: string | null
        }
        Insert: {
          id?: string
          lead_id?: string | null
          organization_id: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          timezone?: string
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          google_event_id?: string | null
          outlook_event_id?: string | null
          reminder_sent_24h?: boolean
          reminder_sent_1h?: boolean
          created_at?: string
          cancelled_at?: string | null
          cancel_reason?: string | null
        }
        Update: {
          id?: string
          lead_id?: string | null
          organization_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          timezone?: string
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          google_event_id?: string | null
          outlook_event_id?: string | null
          reminder_sent_24h?: boolean
          reminder_sent_1h?: boolean
          created_at?: string
          cancelled_at?: string | null
          cancel_reason?: string | null
        }
      }
      integrations: {
        Row: {
          id: string
          organization_id: string
          provider: 'meta_ads' | 'google_ads' | 'tiktok_ads' | 'manychat' | 'xero' | 'vapi' | 'slack' | 'calcom' | 'zapier'
          status: 'pending' | 'connected' | 'error' | 'disconnected'
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          account_id: string | null
          account_name: string | null
          metadata: Json | null
          last_sync_at: string | null
          sync_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          provider: 'meta_ads' | 'google_ads' | 'tiktok_ads' | 'manychat' | 'xero' | 'vapi' | 'slack' | 'calcom' | 'zapier'
          status?: 'pending' | 'connected' | 'error' | 'disconnected'
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          account_id?: string | null
          account_name?: string | null
          metadata?: Json | null
          last_sync_at?: string | null
          sync_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          provider?: 'meta_ads' | 'google_ads' | 'tiktok_ads' | 'manychat' | 'xero' | 'vapi' | 'slack' | 'calcom' | 'zapier'
          status?: 'pending' | 'connected' | 'error' | 'disconnected'
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          account_id?: string | null
          account_name?: string | null
          metadata?: Json | null
          last_sync_at?: string | null
          sync_error?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ad_campaigns: {
        Row: {
          id: string
          organization_id: string
          integration_id: string
          platform: 'meta' | 'google' | 'tiktok'
          external_id: string
          name: string
          status: string | null
          objective: string | null
          budget_daily: number | null
          budget_lifetime: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          integration_id: string
          platform: 'meta' | 'google' | 'tiktok'
          external_id: string
          name: string
          status?: string | null
          objective?: string | null
          budget_daily?: number | null
          budget_lifetime?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          integration_id?: string
          platform?: 'meta' | 'google' | 'tiktok'
          external_id?: string
          name?: string
          status?: string | null
          objective?: string | null
          budget_daily?: number | null
          budget_lifetime?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          type: 'lead' | 'message' | 'appointment' | 'ai' | 'alert' | 'system'
          title: string
          body: string | null
          is_read: boolean
          metadata: Json | null
          organization_id: string
          created_at: string
        }
        Insert: {
          id?: string
          type: 'lead' | 'message' | 'appointment' | 'ai' | 'alert' | 'system'
          title: string
          body?: string | null
          is_read?: boolean
          metadata?: Json | null
          organization_id: string
          created_at?: string
        }
        Update: {
          id?: string
          type?: 'lead' | 'message' | 'appointment' | 'ai' | 'alert' | 'system'
          title?: string
          body?: string | null
          is_read?: boolean
          metadata?: Json | null
          organization_id?: string
          created_at?: string
        }
      }
      ad_performance: {
        Row: {
          id: string
          organization_id: string
          campaign_id: string
          date: string
          impressions: number
          clicks: number
          spend: number
          leads: number
          conversions: number
          revenue: number
          ctr: number
          cpc: number
          cpl: number
          roas: number
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          campaign_id: string
          date: string
          impressions?: number
          clicks?: number
          spend?: number
          leads?: number
          conversions?: number
          revenue?: number
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          campaign_id?: string
          date?: string
          impressions?: number
          clicks?: number
          spend?: number
          leads?: number
          conversions?: number
          revenue?: number
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          organization_id: string
          report_type: 'weekly' | 'monthly' | 'custom'
          period_start: string
          period_end: string
          metrics: Json
          ai_summary: string | null
          ai_recommendations: string[] | null
          sent_at: string | null
          pdf_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          report_type?: 'weekly' | 'monthly' | 'custom'
          period_start: string
          period_end: string
          metrics: Json
          ai_summary?: string | null
          ai_recommendations?: string[] | null
          sent_at?: string | null
          pdf_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          report_type?: 'weekly' | 'monthly' | 'custom'
          period_start?: string
          period_end?: string
          metrics?: Json
          ai_summary?: string | null
          ai_recommendations?: string[] | null
          sent_at?: string | null
          pdf_url?: string | null
          created_at?: string
        }
      }
      calls: {
        Row: {
          id: string
          organization_id: string
          lead_id: string | null
          vapi_call_id: string
          phone_number: string | null
          caller_name: string | null
          direction: 'inbound' | 'outbound'
          duration_seconds: number | null
          status: 'in_progress' | 'completed' | 'missed' | 'failed'
          transcript: string | null
          recording_url: string | null
          summary: string | null
          metadata: Json | null
          created_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          lead_id?: string | null
          vapi_call_id: string
          phone_number?: string | null
          caller_name?: string | null
          direction?: 'inbound' | 'outbound'
          duration_seconds?: number | null
          status?: 'in_progress' | 'completed' | 'missed' | 'failed'
          transcript?: string | null
          recording_url?: string | null
          summary?: string | null
          metadata?: Json | null
          created_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          lead_id?: string | null
          vapi_call_id?: string
          phone_number?: string | null
          caller_name?: string | null
          direction?: 'inbound' | 'outbound'
          duration_seconds?: number | null
          status?: 'in_progress' | 'completed' | 'missed' | 'failed'
          transcript?: string | null
          recording_url?: string | null
          summary?: string | null
          metadata?: Json | null
          created_at?: string
          ended_at?: string | null
        }
      }
      automations: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          trigger_type: 'lead_created' | 'lead_scored' | 'lead_qualified' | 'appointment_booked' | 'appointment_cancelled' | 'form_submitted' | 'tag_added'
          trigger_config: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          trigger_type: 'lead_created' | 'lead_scored' | 'lead_qualified' | 'appointment_booked' | 'appointment_cancelled' | 'form_submitted' | 'tag_added'
          trigger_config?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          trigger_type?: 'lead_created' | 'lead_scored' | 'lead_qualified' | 'appointment_booked' | 'appointment_cancelled' | 'form_submitted' | 'tag_added'
          trigger_config?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      automation_actions: {
        Row: {
          id: string
          automation_id: string
          action_type: 'send_email' | 'send_whatsapp' | 'send_sms' | 'send_slack' | 'add_tag' | 'assign_user' | 'create_task' | 'wait' | 'webhook'
          action_config: Json
          action_order: number
          created_at: string
        }
        Insert: {
          id?: string
          automation_id: string
          action_type: 'send_email' | 'send_whatsapp' | 'send_sms' | 'send_slack' | 'add_tag' | 'assign_user' | 'create_task' | 'wait' | 'webhook'
          action_config?: Json
          action_order: number
          created_at?: string
        }
        Update: {
          id?: string
          automation_id?: string
          action_type?: 'send_email' | 'send_whatsapp' | 'send_sms' | 'send_slack' | 'add_tag' | 'assign_user' | 'create_task' | 'wait' | 'webhook'
          action_config?: Json
          action_order?: number
          created_at?: string
        }
      }
      automation_runs: {
        Row: {
          id: string
          automation_id: string
          lead_id: string | null
          status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          started_at: string
          completed_at: string | null
          error: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          automation_id: string
          lead_id?: string | null
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          started_at?: string
          completed_at?: string | null
          error?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          automation_id?: string
          lead_id?: string | null
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          started_at?: string
          completed_at?: string | null
          error?: string | null
          metadata?: Json | null
        }
      }
    }
  }
}

// Convenience types
export type Organization = Database['public']['Tables']['organizations']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Lead = Database['public']['Tables']['leads']['Row']
export type LeadActivity = Database['public']['Tables']['lead_activities']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type Integration = Database['public']['Tables']['integrations']['Row']
export type AdCampaign = Database['public']['Tables']['ad_campaigns']['Row']
export type AdPerformance = Database['public']['Tables']['ad_performance']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Call = Database['public']['Tables']['calls']['Row']

// Insert types
export type LeadInsert = Database['public']['Tables']['leads']['Insert']
export type LeadUpdate = Database['public']['Tables']['leads']['Update']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type ActivityInsert = Database['public']['Tables']['lead_activities']['Insert']

// Automation types
export type Automation = Database['public']['Tables']['automations']['Row']
export type AutomationInsert = Database['public']['Tables']['automations']['Insert']
export type AutomationUpdate = Database['public']['Tables']['automations']['Update']
export type AutomationAction = Database['public']['Tables']['automation_actions']['Row']
export type AutomationActionInsert = Database['public']['Tables']['automation_actions']['Insert']
export type AutomationActionUpdate = Database['public']['Tables']['automation_actions']['Update']
export type AutomationRun = Database['public']['Tables']['automation_runs']['Row']
