// components/dashboard/pipeline.tsx
'use client'

import { cn } from '@/lib/utils'
import { Lead } from '@/types/database'
import { ChevronRight } from 'lucide-react'

interface PipelineStage {
  id: string
  name: string
  count: number
  color: string
}

interface PipelineProps {
  stages: PipelineStage[]
  onStageClick?: (stageId: string) => void
}

export function Pipeline({ stages, onStageClick }: PipelineProps) {
  const total = stages.reduce((sum, stage) => sum + stage.count, 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Snapshot</h3>
      
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center">
            <button
              onClick={() => onStageClick?.(stage.id)}
              className={cn(
                "flex flex-col items-center px-4 py-3 rounded-lg min-w-[100px] transition-all",
                "hover:bg-gray-50 cursor-pointer"
              )}
            >
              <span 
                className="text-2xl font-bold"
                style={{ color: stage.color }}
              >
                {stage.count}
              </span>
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {stage.name}
              </span>
            </button>
            
            {index < stages.length - 1 && (
              <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden flex">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="h-full transition-all"
            style={{
              width: `${total > 0 ? (stage.count / total) * 100 : 0}%`,
              backgroundColor: stage.color
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Default pipeline stages
export const defaultPipelineStages = [
  { id: 'new', name: 'New', color: '#6366f1' },
  { id: 'qualified', name: 'Qualified', color: '#8b5cf6' },
  { id: 'contacted', name: 'Contacted', color: '#a855f7' },
  { id: 'booked', name: 'Booked', color: '#22c55e' },
  { id: 'won', name: 'Won', color: '#10b981' },
  { id: 'lost', name: 'Lost', color: '#ef4444' },
]

// Helper to calculate pipeline from leads
export function calculatePipelineCounts(leads: Lead[]): PipelineStage[] {
  const counts = leads.reduce((acc, lead) => {
    acc[lead.stage] = (acc[lead.stage] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return defaultPipelineStages.map(stage => ({
    ...stage,
    count: counts[stage.id] || 0
  }))
}

// Mini pipeline for compact display
interface MiniPipelineProps {
  stages: { name: string; count: number; color: string }[]
}

export function MiniPipeline({ stages }: MiniPipelineProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {stages.slice(0, 4).map((stage, i) => (
        <div key={i} className="flex items-center gap-1">
          <span 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <span className="text-gray-600">{stage.name}</span>
          <span className="font-medium">{stage.count}</span>
        </div>
      ))}
    </div>
  )
}
