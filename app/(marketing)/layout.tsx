import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: ': Impact | Stop Losing Leads',
  description: 'WhatsApp alerts in 5 seconds. AI lead scoring. One inbox for everything. The growth platform that pays for itself.',
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
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
