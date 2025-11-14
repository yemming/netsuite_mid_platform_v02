'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ForecastViolationsDashboard } from '@/components/scm/forecast/ForecastViolationsDashboard'
import { ViolationDetailView } from '@/components/scm/forecast/ViolationDetailView'
import { AlgorithmInsights } from '@/components/scm/forecast/AlgorithmInsights'
import { AlgorithmSettings } from '@/components/scm/forecast/AlgorithmSettings'

type ViewMode = 'violations' | 'detail' | 'insights' | 'settings'

export default function ForecastAnalysisPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('violations')
  const [selectedViolation, setSelectedViolation] = useState<string | null>(null)

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
          <h1 className="text-2xl font-semibold text-[#E0E0E0]">預測分析駕駛艙</h1>
        </div>
      </div>

      {/* Tab 導航 */}
      <div className="border-b border-[#3A3A3A] px-6">
        <div className="flex gap-1">
          <button
            onClick={() => {
              setViewMode('violations')
              setSelectedViolation(null)
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'violations'
                ? 'text-[#3B82F6] border-b-2 border-[#3B82F6]'
                : 'text-[#B0B0B0] hover:text-[#E0E0E0]'
            }`}
          >
            違規告警
          </button>
          <button
            onClick={() => setViewMode('insights')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'insights'
                ? 'text-[#3B82F6] border-b-2 border-[#3B82F6]'
                : 'text-[#B0B0B0] hover:text-[#E0E0E0]'
            }`}
          >
            算法洞察
          </button>
          <button
            onClick={() => setViewMode('settings')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'settings'
                ? 'text-[#3B82F6] border-b-2 border-[#3B82F6]'
                : 'text-[#B0B0B0] hover:text-[#E0E0E0]'
            }`}
          >
            算法設定
          </button>
        </div>
      </div>

      <div className="p-6">
        {viewMode === 'violations' && selectedViolation ? (
          <ViolationDetailView
            violationId={selectedViolation}
            onBack={() => setSelectedViolation(null)}
          />
        ) : viewMode === 'violations' ? (
          <ForecastViolationsDashboard onSelectViolation={setSelectedViolation} />
        ) : viewMode === 'insights' ? (
          <AlgorithmInsights />
        ) : (
          <AlgorithmSettings />
        )}
      </div>
    </div>
  )
}

