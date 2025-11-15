'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EDAOverview } from '@/components/scm/eda/EDAOverview'
import { EDADetailView } from '@/components/scm/eda/EDADetailView'

export default function EDAPage() {
  const [selectedIntersection, setSelectedIntersection] = useState<string | null>(null)

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
          <h1 className="text-2xl font-semibold text-[#E0E0E0]">探索性數據分析 (EDA)</h1>
        </div>
      </div>

      <div className="p-6">
        {selectedIntersection ? (
          <EDADetailView 
            intersectionId={selectedIntersection}
            onBack={() => setSelectedIntersection(null)}
          />
        ) : (
          <EDAOverview onSelectIntersection={setSelectedIntersection} />
        )}
      </div>
    </div>
  )
}


