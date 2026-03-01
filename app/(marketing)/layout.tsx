import type { Metadata } from 'next'
import Link from 'next/link'

const siteUrl = 'https://driveimpact.io'

export const metadata: Metadata = {
  title: {
    default: ':Impact | Stop Losing Leads You Paid For',
    template: '%s | :Impact by AM:PM Media',
  },
  description:
    'WhatsApp alerts in 5 seconds. AI lead scoring. One inbox for WhatsApp, SMS, email, Instagram & Messenger. The lead management platform that turns your ad spend into booked appointments.',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  keywords: [
    'lead management',
    'speed to lead',
    'WhatsApp lead alerts',
    'AI lead scoring',
    'lead management software',
    'CRM for small business',
    'unified inbox',
    'lead response time',
    'Meta ads lead management',
    'Google Ads leads',
    'appointment booking',
    'lead qualification',
    'AM:PM Media',
  ],
  authors: [{ name: 'AM:PM Media', url: 'https://www.mediampm.com' }],
  creator: 'AM:PM Media',
  publisher: 'AM:PM Media',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: siteUrl,
    siteName: ':Impact by AM:PM Media',
    title: ':Impact | Stop Losing the Leads You Paid For',
    description:
      'WhatsApp alerts in 5 seconds. AI lead scoring. One inbox for everything. Turn your ad spend into booked appointments.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: ':Impact — Lead management platform by AM:PM Media',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: ':Impact | Stop Losing the Leads You Paid For',
    description:
      'WhatsApp alerts in 5 seconds. AI lead scoring. One inbox for everything. The growth platform that pays for itself.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
        publisher: { '@id': 'https://driveimpact.io/#organization' },
      },
      {
        '@type': 'SoftwareApplication',
        name: ':Impact',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description:
          'AI-powered lead management platform with WhatsApp alerts, lead scoring, and unified inbox for businesses running paid ads.',
        offers: {
          '@type': 'Offer',
          price: '1500',
          priceCurrency: 'GBP',
          priceValidUntil: '2026-12-31',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '12',
        },
        featureList: [
          '5-second WhatsApp lead alerts',
          'AI lead scoring and qualification',
          'Unified inbox (WhatsApp, SMS, email, Instagram, Messenger)',
          'Calendar sync and booking',
          'Follow-up automations',
          'ROI tracking and reports',
          'Meta & Google Ads integration',
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img src="/ampm-logo.png" alt="AM:PM" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover" />
              <span className="text-[#0B1220] font-semibold text-lg sm:text-xl tracking-tight">
                <span className="text-[#E8642C]">:</span>Impact
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-[#0B1220] transition-colors">
                How It Works
              </a>
              <a href="#features" className="text-sm text-gray-600 hover:text-[#0B1220] transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-[#0B1220] transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-[#0B1220] transition-colors">
                FAQ
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline-flex text-sm text-gray-600 hover:text-[#0B1220] transition-colors px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#E8642C] text-white text-sm font-medium hover:bg-[#d55a25] transition-all shadow-sm hover:shadow-md"
              >
                Book a Demo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-[#0B1220] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <img src="/ampm-logo.png" alt="AM:PM" className="w-9 h-9 rounded-lg object-cover" />
                <span className="font-semibold text-xl tracking-tight">
                  <span className="text-[#E8642C]">:</span>Impact
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                The lead management platform that turns your ad spend into booked appointments.
                WhatsApp alerts, AI scoring, one unified inbox.
              </p>
              <p className="text-gray-500 text-xs mt-6">
                A product by <a href="https://www.mediampm.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">AM:PM Media</a>
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/demo" className="text-sm text-gray-400 hover:text-white transition-colors">Book a Demo</Link></li>
                <li><Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 text-center">
            <p className="text-gray-500 text-xs">&copy; 2026 :Impact. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
