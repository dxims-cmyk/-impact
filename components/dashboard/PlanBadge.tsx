'use client'

import { usePlan } from '@/lib/hooks/use-plan'
import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

export function PlanBadge(): JSX.Element {
  const { isPro, planName } = usePlan()

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all",
      isPro
        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm"
        : "bg-gray-100 text-gray-600 border"
    )}>
      {isPro && <Zap className="w-3 h-3" />}
      {planName}
    </div>
  )
}
