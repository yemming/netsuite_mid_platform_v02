'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DemandAssumptionsView } from '@/components/scm/demand-assumptions/DemandAssumptionsView'
import { ForecastLayersDashboard } from '@/components/scm/demand-assumptions/ForecastLayersDashboard'

type ViewMode = 'assumptions' | 'layers'

export default function DemandAssumptionsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('assumptions')

  return (
    <div className="min-h-screen bg-[#1F1F1F]">
      <div className="border-b border-[#3A3A3A] px-6 py-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/scm" 
            className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
          >
            ← 返回首頁
          </Link>
          <h1 className="text-2xl font-semibold text-[#E0E0E0]">需求假設與預測層</h1>
        </div>
      </div>

      {/* Tab 導航 */}
      <div className="border-b border-[#3A3A3A] px-6">
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('assumptions')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'assumptions'
                ? 'text-[#3B82F6] border-b-2 border-[#3B82F6]'
                : 'text-[#B0B0B0] hover:text-[#E0E0E0]'
            }`}
          >
            需求假設
          </button>
          <button
            onClick={() => setViewMode('layers')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'layers'
                ? 'text-[#3B82F6] border-b-2 border-[#3B82F6]'
                : 'text-[#B0B0B0] hover:text-[#E0E0E0]'
            }`}
          >
            預測圖層
          </button>
        </div>
      </div>

      <div className="p-6">
        {viewMode === 'assumptions' ? (
          <DemandAssumptionsView />
        ) : (
          <ForecastLayersDashboard />
        )}
      </div>
    </div>
  )
}

