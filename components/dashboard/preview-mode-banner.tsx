'use client'

import { Eye, MessageCircle } from 'lucide-react'

export function PreviewModeBanner(): JSX.Element {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-amber-800">
        <Eye className="w-4 h-4 flex-shrink-0" />
        <span>
          <strong>Preview Mode</strong> — You&apos;re exploring :Impact! Contact AM:PM Media to activate your account.
        </span>
      </div>
      <a
        href="https://wa.me/64212345678?text=Hi%2C%20I%27d%20like%20to%20activate%20my%20Impact%20account"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#25D366] text-white text-xs font-semibold hover:bg-[#20BD5A] transition-colors flex-shrink-0"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        WhatsApp
      </a>
    </div>
  )
}

interface PreviewModeGateProps {
  feature: string
  children: React.ReactNode
}

export function PreviewModeGate({ feature, children }: PreviewModeGateProps): JSX.Element {
  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none opacity-50 select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px] rounded-lg">
        <div className="bg-white p-6 rounded-xl shadow-xl text-center max-w-sm border">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Activate Your Account</h3>
          <p className="text-gray-600 text-sm mb-4">
            Access to {feature} requires an active membership.
          </p>
          <a
            href="https://wa.me/64212345678?text=Hi%2C%20I%27d%20like%20to%20activate%20my%20Impact%20account%20to%20access%20all%20features"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] text-white text-sm font-semibold hover:bg-[#20BD5A] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Contact AM:PM Media
          </a>
        </div>
      </div>
    </div>
  )
}
