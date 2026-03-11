// lib/env.ts — Centralized environment variable validation
// Import this instead of using process.env directly for required secrets

function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const env = {
  // --- Core ---
  supabase: {
    url: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },
  app: {
    url: getRequiredEnv('NEXT_PUBLIC_APP_URL'),
    encryptionKey: getRequiredEnv('ENCRYPTION_KEY'),
    adminEmails: (process.env.ADMIN_EMAILS || 'dxims@mediampm.com').split(',').map(e => e.trim()),
  },
  anthropic: {
    apiKey: getRequiredEnv('ANTHROPIC_API_KEY'),
  },

  // --- Notifications ---
  resend: {
    apiKey: getRequiredEnv('RESEND_API_KEY'),
    fromEmail: getRequiredEnv('RESEND_FROM_EMAIL'),
  },
  whatsapp: {
    phoneNumberId: getRequiredEnv('WHATSAPP_PHONE_NUMBER_ID'),
    accessToken: getRequiredEnv('WHATSAPP_ACCESS_TOKEN'),
  },

  // --- Payments ---
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    clientId: process.env.STRIPE_CLIENT_ID,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    billingWebhookSecret: process.env.STRIPE_BILLING_WEBHOOK_SECRET,
    priceCore: process.env.STRIPE_PRICE_CORE,
    priceGrowth: process.env.STRIPE_PRICE_GROWTH,
    pricePro: process.env.STRIPE_PRICE_PRO,
  },

  // --- Meta ---
  meta: {
    appId: process.env.META_APP_ID,
    appSecret: process.env.META_APP_SECRET,
    webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN,
    pageAccessToken: process.env.META_PAGE_ACCESS_TOKEN,
    instagramAccessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
  },

  // --- Optional integrations ---
  vapi: {
    apiKey: process.env.VAPI_API_KEY,
    webhookSecret: process.env.VAPI_WEBHOOK_SECRET,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    adsClientId: process.env.GOOGLE_ADS_CLIENT_ID,
    adsClientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    adsDeveloperToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  },
  calendly: {
    clientId: process.env.CALENDLY_CLIENT_ID,
    clientSecret: process.env.CALENDLY_CLIENT_SECRET,
  },
  slack: {
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
  },
  tiktok: {
    appId: process.env.TIKTOK_APP_ID,
    appSecret: process.env.TIKTOK_APP_SECRET,
  },
  xero: {
    clientId: process.env.XERO_CLIENT_ID,
    clientSecret: process.env.XERO_CLIENT_SECRET,
    webhookKey: process.env.XERO_WEBHOOK_KEY,
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
}
