'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

export function MarketingFooter(): React.JSX.Element {
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'

  return (
    <footer className={`border-t transition-colors duration-700 ${
      dark ? 'border-zinc-900 bg-[#070707]' : 'border-gray-200 bg-white'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
          {/* Brand column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/ampm-logo.png" alt="AM:PM" className="w-8 h-8 rounded-lg object-cover" />
              <span className={`font-semibold text-lg tracking-tight font-display transition-colors duration-700 ${
                dark ? 'text-white' : 'text-[#0B1220]'
              }`}>
                <span className="text-[#6E0F1A]">:</span>Impact
              </span>
            </div>
            <p className={`text-sm leading-relaxed max-w-sm mb-6 transition-colors duration-700 ${
              dark ? 'text-zinc-500' : 'text-gray-500'
            }`}>
              AI-powered lead management for service businesses.
              Built by AM:PM Media.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/mediampm"
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs font-medium transition-colors spring-hover ${
                  dark ? 'text-zinc-500 hover:text-white' : 'text-gray-400 hover:text-[#0B1220]'
                }`}
              >
                Instagram
              </a>
              <a
                href="https://www.tiktok.com/@mediampm"
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs font-medium transition-colors spring-hover ${
                  dark ? 'text-zinc-500 hover:text-white' : 'text-gray-400 hover:text-[#0B1220]'
                }`}
              >
                TikTok
              </a>
              <a
                href="https://www.mediampm.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 text-xs font-medium transition-colors spring-hover ${
                  dark ? 'text-zinc-500 hover:text-white' : 'text-gray-400 hover:text-[#0B1220]'
                }`}
              >
                AM:PM Media
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Product column */}
          <div>
            <h4 className={`text-xs font-semibold uppercase tracking-widest mb-4 transition-colors duration-700 ${
              dark ? 'text-zinc-400' : 'text-gray-900'
            }`}>
              Product
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: '#how-it-works', label: 'How It Works' },
                { href: '#features', label: 'Features' },
                { href: '#pricing', label: 'Pricing' },
                { href: '#faq', label: 'FAQ' },
              ].map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={`text-sm transition-colors duration-300 ${
                      dark ? 'text-zinc-500 hover:text-white' : 'text-gray-500 hover:text-[#0B1220]'
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal column */}
          <div>
            <h4 className={`text-xs font-semibold uppercase tracking-widest mb-4 transition-colors duration-700 ${
              dark ? 'text-zinc-400' : 'text-gray-900'
            }`}>
              Company
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: '/privacy', label: 'Privacy Policy', isLink: true },
                { href: '/terms', label: 'Terms of Service', isLink: true },
                { href: '/login', label: 'Sign In', isLink: true },
                { href: '/demo', label: 'Book a Demo', isLink: true },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`text-sm transition-colors duration-300 ${
                      dark ? 'text-zinc-500 hover:text-white' : 'text-gray-500 hover:text-[#0B1220]'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={`border-t mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-700 ${
          dark ? 'border-zinc-900' : 'border-gray-200'
        }`}>
          <p className={`text-xs transition-colors duration-700 ${dark ? 'text-zinc-600' : 'text-gray-400'}`}>
            &copy; 2026 AM:PM Media. All rights reserved.
          </p>
          <p className={`text-xs transition-colors duration-700 ${dark ? 'text-zinc-700' : 'text-gray-300'}`}>
            Designed and built in Glasgow, Scotland.
          </p>
        </div>
      </div>
    </footer>
  )
}
