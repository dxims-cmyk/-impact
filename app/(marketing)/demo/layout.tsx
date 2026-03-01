import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book a Demo',
  description:
    '15 minutes. See :Impact in action. We\'ll show you how WhatsApp lead alerts, AI scoring, and unified inbox work for your business.',
  alternates: {
    canonical: '/demo',
  },
  openGraph: {
    title: 'Book a Demo | :Impact',
    description:
      '15-minute demo. See how :Impact turns ad leads into booked appointments with WhatsApp alerts in 5 seconds.',
  },
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
