import * as Sentry from '@sentry/nextjs'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  integrations: [nodeProfilingIntegration()],

  // Performance monitoring
  tracesSampleRate: 0.1,

  // Profiling
  profileSessionSampleRate: 1.0,
  profileLifecycle: 'trace',

  environment: process.env.NODE_ENV,
})
