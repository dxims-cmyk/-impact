'use client'

import { useRef } from 'react'
import { ChevronDown } from 'lucide-react'

export function FaqItem({ question, answer }: { question: string; answer: string }) {
  const ref = useRef<HTMLDetailsElement>(null)

  return (
    <details ref={ref} className="group border-b border-gray-100 last:border-0">
      <summary className="flex items-center justify-between py-5 cursor-pointer list-none text-left">
        <span className="text-base sm:text-lg font-medium text-[#0B1220] pr-4">{question}</span>
        <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-5 text-gray-600 text-sm sm:text-base leading-relaxed">{answer}</div>
    </details>
  )
}
