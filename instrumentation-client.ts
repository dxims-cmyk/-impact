import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  integrations: [Sentry.browserTracingIntegration(), Sentry.browserProfilingIntegration()],
  tracePropagationTargets: ['localhost', /^https:\/\/impact-full\.vercel\.app\/api/],

  // Performance monitoring
  tracesSampleRate: 0.1,

  // Profiling
  profileSessionSampleRate: 1.0,
  profileLifecycle: 'trace',

  // Session replay for debugging UI errors
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  environment: process.env.NODE_ENV,

  // Filter out noisy errors
  ignoreErrors: [
    'ResizeObserver loop',
    'Non-Error promise rejection',
    'Load failed',
    'Failed to fetch',
    'NetworkError',
    'AbortError',
  ],
})
