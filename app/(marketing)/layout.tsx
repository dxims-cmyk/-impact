import type { Metadata } from 'next'
import { MarketingThemeProvider } from '@/components/marketing/theme-provider'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { ScrollProgress } from '@/components/marketing/scroll-progress'

const siteUrl = 'https://driveimpact.io'

export const metadata: Metadata = {
  title: {
    default: 'Impact | AI Lead Management for Service Businesses',
    template: '%s | :Impact by AM:PM Media',
  },
  description:
    'Stop losing the leads you paid for. Get WhatsApp alerts in 5 seconds when a new lead comes in, AI lead scoring, and a unified inbox for WhatsApp, SMS, email, Instagram and Messenger. Built for restaurants, clinics, and service businesses running paid ads.',
  metadataBase: new URL(siteUrl),
  alternates: { canonical: '/' },
  keywords: [
    'lead management software',
    'speed to lead',
    'WhatsApp lead alerts',
    'AI lead scoring',
    'lead management for restaurants',
    'CRM for small business',
    'unified inbox CRM',
    'lead response time software',
    'Meta ads lead management',
    'Facebook lead ads CRM',
    'Google ads lead management',
    'clinic lead management',
    'best CRM for Meta ads',
    'WhatsApp business alerts',
    'lead qualification software',
    'appointment booking from ads',
    'speed to lead software',
    'lead management platform',
  ],
  authors: [{ name: 'AM:PM Media', url: 'https://www.mediampm.com' }],
  creator: 'AM:PM Media',
  publisher: 'AM:PM Media',
  openGraph: {
    type: 'website',
    locale: 'en',
    url: siteUrl,
    siteName: ':Impact by AM:PM Media',
    title: 'Impact | AI Lead Management for Service Businesses',
    description: 'Get WhatsApp alerts in 5 seconds, AI lead scoring, and a unified inbox for every channel.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: ':Impact | Lead management platform by AM:PM Media' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Impact | AI Lead Management for Service Businesses',
    description: 'WhatsApp alerts in 5 seconds. AI lead scoring. One inbox for everything.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://driveimpact.io/#organization',
        name: 'AM:PM Media',
        url: 'https://www.mediampm.com',
        logo: 'https://driveimpact.io/ampm-logo.png',
        sameAs: [
          'https://www.instagram.com/mediampm',
          'https://www.tiktok.com/@mediampm',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://driveimpact.io/#website',
        url: 'https://driveimpact.io',
        name: ':Impact',
        description: 'AI-powered lead management for service businesses. WhatsApp alerts in 5 seconds, AI lead scoring, unified inbox.',
        publisher: { '@id': 'https://driveimpact.io/#organization' },
      },
      {
        '@type': 'SoftwareApplication',
        name: ':Impact',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: 'AI-powered lead management platform with 5-second WhatsApp alerts, AI lead scoring, and a unified inbox for WhatsApp, SMS, email, Instagram and Messenger.',
        offers: [
          { '@type': 'Offer', name: 'Core', price: '1500', priceCurrency: 'GBP', url: 'https://driveimpact.io/#pricing' },
          { '@type': 'Offer', name: 'Growth', price: '2000', priceCurrency: 'GBP', url: 'https://driveimpact.io/#pricing' },
          { '@type': 'Offer', name: 'Pro', price: '2500', priceCurrency: 'GBP', url: 'https://driveimpact.io/#pricing' },
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '5',
          ratingCount: '3',
          bestRating: '5',
        },
        featureList: [
          '5-second WhatsApp lead alerts',
          'AI lead scoring and qualification',
          'Unified inbox for WhatsApp, SMS, email, Instagram, Messenger',
          'Calendar sync and booking via Cal.com',
          'Follow-up automations',
          'ROI tracking and lead analytics',
          'Meta Ads and Google Ads integration',
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What types of business is Impact for?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Any service business running paid ads. Restaurants, dental clinics, estate agents, gyms, salons, trades. If you get leads from Meta or Google ads, Impact works for you.',
            },
          },
          {
            '@type': 'Question',
            name: 'How fast is setup?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: '48 hours from sign-up to live. We connect your Meta ad account, configure your inbox, and handle all the technical setup.',
            },
          },
          {
            '@type': 'Question',
            name: 'Do I need technical knowledge?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'None. We handle everything. You get a dashboard and WhatsApp alerts.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is the AI Receptionist?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'A voice AI that answers your business calls 24/7, qualifies leads, and books appointments directly into your calendar. Available on Growth and Pro plans.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does the unified inbox work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Every message from WhatsApp, SMS, email, Instagram and Messenger appears in one timeline per lead. No switching between apps.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I cancel anytime?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Monthly billing, no lock-in contracts.',
            },
          },
          {
            '@type': 'Question',
            name: 'How is Impact different from GoHighLevel or HubSpot?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Impact is built for SMBs running paid ads. No bloat, no enterprise pricing, no 6-month onboarding. You are live in 48 hours with WhatsApp-first alerts.',
            },
          },
        ],
      },
    ],
  }

  return (
    <MarketingThemeProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Speculation rules for instant navigation (Acne Studios pattern) */}
      <script
        type="speculationrules"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          prerender: [
            { urls: ['/login', '/demo'] },
          ],
          prefetch: [
            { urls: ['/login', '/demo'] },
          ],
        })}}
      />
      <ScrollProgress />
      <MarketingHeader />
      <main className="monochrome-zone">{children}</main>
      <MarketingFooter />
    </MarketingThemeProvider>
  )
}
