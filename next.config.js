const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TODO: Remove after regenerating Supabase types to match actual schema
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

module.exports = withSentryConfig(nextConfig, {
  // Sentry build options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps for better stack traces
  silent: !process.env.CI,
  widenClientFileUpload: true,

  // Disable Sentry telemetry
  telemetry: false,

  // Hide source maps from client bundles
  hideSourceMaps: true,

  // Tree-shake unused Sentry code
  disableLogger: true,

  // Skip source map upload if no auth token (e.g. local dev)
  ...(process.env.SENTRY_AUTH_TOKEN ? {} : { dryRun: true }),
})
