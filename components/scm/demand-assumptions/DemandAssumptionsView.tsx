'use client'

import { useState } from 'react'
import { AssumptionsSummary } from './AssumptionsSummary'
import { AssumptionDetails } from './AssumptionDetails'

interface Assumption {
  id: string
  name: string
  createdBy: string
  status: 'DRAFT' | 'SUBMITTED' | 'REJECTED' | 'CANCELLED'
  assumptionLayerType: string
  createdAt: string
}

// 模擬數據
const mockAssumptions: Assumption[] = [
  {
    id: 'DA-1',
    name: '新品上市促銷',
    createdBy: 'Marketing Team',
    status: 'SUBMITTED',
    assumptionLayerType: 'Marketing',
    createdAt: '2024-01-15'
  },
  {
    id: 'DA-2',
    name: '春節需求調整',
    createdBy: 'Sales Team',
    status: 'DRAFT',
    assumptionLayerType: 'Sales',
    createdAt: '2024-01-20'
  },
  {
    id: 'DA-3',
    name: '庫存優化調整',
    createdBy: 'Planner',
    status: 'SUBMITTED',
    assumptionLayerType: 'Planner_Adj',
    createdAt: '2024-01-22'
  },
  {
    id: 'DA-4',
    name: 'Q2 預測調整',
    createdBy: 'Planner',
    status: 'SUBMITTED',
    assumptionLayerType: 'Planner_Adj',
    createdAt: '2024-01-25'
  }
]

export function DemandAssumptionsView() {
  const [selectedAssumption, setSelectedAssumption] = useState<Assumption | null>(mockAssumptions[3])
  const [assumptions, setAssumptions] = useState<Assumption[]>(mockAssumptions)

  const handleStatusChange = (id: string, newStatus: Assumption['status']) => {
    setAssumptions(assumptions.map(a => 
      a.id === id ? { ...a, status: newStatus } : a
    ))
    if (selectedAssumption?.id === id) {
      setSelectedAssumption({ ...selectedAssumption, status: newStatus })
    }
  }

  return (
    <div className="space-y-6">
      {/* 上半部：主檔頭 (Summary) */}
      <div className="bg-[#2A2A2A] rounded-lg border border-[#3A3A3A]">
        <div className="p-4 border-b border-[#3A3A3A]">
          <h2 className="text-lg font-semibold text-[#E0E0E0]">Summary</h2>
        </div>
        <AssumptionsSummary
          assumptions={assumptions}
          selectedAssumption={selectedAssumption}
          onSelectAssumption={setSelectedAssumption}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* 下半部：明細網格 (Details) */}
      {selectedAssumption && (
        <div className="bg-[#2A2A2A] rounded-lg border border-[#3A3A3A]">
          <div className="p-4 border-b border-[#3A3A3A]">
            <h2 className="text-lg font-semibold text-[#E0E0E0]">Details - {selectedAssumption.name}</h2>
          </div>
          <AssumptionDetails assumptionId={selectedAssumption.id} />
        </div>
      )}
    </div>
  )
}

