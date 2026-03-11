import * as Sentry from '@sentry/nextjs'

const isProduction = process.env.NODE_ENV === 'production'

async function initSentry() {
  const integrations: Sentry.Integration[] = []

  if (isProduction) {
    try {
      const { nodeProfilingIntegration } = await import('@sentry/profiling-node')
      integrations.push(nodeProfilingIntegration())
    } catch {
      // Native profiler not available — skip
    }
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

    integrations,

    // Performance monitoring
    tracesSampleRate: 0.1,

    // Profiling (only effective when profiling integration loads)
    profileSessionSampleRate: isProduction ? 1.0 : 0,
    profileLifecycle: 'trace',

    environment: process.env.NODE_ENV,
  })
}

initSentry()
