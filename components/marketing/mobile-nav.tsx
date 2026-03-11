'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useMarketingTheme } from '@/components/marketing/theme-provider'

const navLinks = [
  { href: '#how-it-works', label: 'Product' },
  { href: '#pricing', label: 'Pricing' },
]

export function MobileNav(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const { theme } = useMarketingTheme()
  const dark = theme === 'dark'

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className={`p-2 transition-colors ${dark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-[#0B1220]'}`}
        aria-label="Toggle menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.165, 0.84, 0.44, 1] }}
            className={`absolute top-full left-0 right-0 border-b px-4 py-6 ${
              dark ? 'bg-[#0A0A0A] border-zinc-800' : 'bg-white border-gray-200'
            }`}
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`text-base font-medium py-1 transition-colors ${
                    dark ? 'text-zinc-300 hover:text-white' : 'text-gray-600 hover:text-[#0B1220]'
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <div className={`border-t pt-4 mt-2 flex flex-col gap-3 ${dark ? 'border-zinc-800' : 'border-gray-200'}`}>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className={`text-base font-medium py-1 transition-colors ${
                    dark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-[#0B1220]'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  href="/demo"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-[#E8642C] text-white text-sm font-semibold hover:bg-[#d55a25] transition-colors"
                >
                  Book a Demo
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
