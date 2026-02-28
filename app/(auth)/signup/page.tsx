'use client'

import { Mail, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-impact/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-8 h-8 text-impact" />
        </div>
        <h1 className="text-2xl font-bold text-ivory mb-2">Invite Only</h1>
        <p className="text-ivory/70 mb-6">
          : Impact is an invite-only platform. Contact AM:PM Media to get started with your own dashboard.
        </p>
        <a
          href="mailto:hello@mediampm.com?subject=Impact%20Engine%20Access%20Request"
          className="btn-primary inline-flex items-center gap-2 px-6 py-3"
        >
          <Mail className="w-4 h-4" />
          Contact Us
        </a>
        <p className="text-center text-sm text-ivory/50 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-camel hover:text-camel/80 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
