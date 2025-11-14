'use client'

import { useState } from 'react'
import { EDAChart } from './EDAChart'
import { EventAttributionModal } from './EventAttributionModal'

interface EDADetailViewProps {
  intersectionId: string
  onBack: () => void
}

export function EDADetailView({ intersectionId, onBack }: EDADetailViewProps) {
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedAnomaly, setSelectedAnomaly] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
        >
          ← 返回總覽
        </button>
        <h2 className="text-xl font-semibold text-[#E0E0E0]">
          交叉點詳細視圖 - ID: {intersectionId}
        </h2>
      </div>

      {/* 圖表區域 */}
      <div className="bg-[#2A2A2A] rounded-lg border border-[#3A3A3A] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#E0E0E0]">Review Actuals</h3>
          <button
            onClick={() => {
              setSelectedAnomaly('unknown-spike-1')
              setShowEventModal(true)
            }}
            className="px-4 py-2 bg-[#3B82F6] text-white rounded hover:bg-[#2563EB] transition-colors"
          >
            關聯事件
          </button>
        </div>
        <EDAChart intersectionId={intersectionId} />
      </div>

      {/* 異常列表 */}
      <div className="bg-[#2A2A2A] rounded-lg border border-[#3A3A3A] p-6">
        <h3 className="text-lg font-semibold text-[#E0E0E0] mb-4">異常標記列表</h3>
        <div className="space-y-2">
          {[
            { id: '1', type: 'UNKNOWN_SPIKE', date: '2023-06-15', status: 'SYSTEM_DETECTED' },
            { id: '2', type: 'HOLIDAY_IMPACT', date: '2023-12-25', status: 'USER_VERIFIED' },
            { id: '3', type: 'POTENTIAL_STOCKOUT', date: '2023-03-20', status: 'SYSTEM_DETECTED' },
          ].map((anomaly) => (
            <div
              key={anomaly.id}
              className="flex items-center justify-between p-3 bg-[#333333] rounded border border-[#3A3A3A]"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#E0E0E0]">{anomaly.type}</span>
                <span className="text-xs text-[#B0B0B0]">{anomaly.date}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  anomaly.status === 'USER_VERIFIED' 
                    ? 'bg-[#22C55E] text-white' 
                    : 'bg-[#F97316] text-white'
                }`}>
                  {anomaly.status}
                </span>
              </div>
              {anomaly.type === 'UNKNOWN_SPIKE' && (
                <button
                  onClick={() => {
                    setSelectedAnomaly(anomaly.id)
                    setShowEventModal(true)
                  }}
                  className="text-sm text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
                >
                  關聯事件
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 事件歸因彈窗 */}
      {showEventModal && (
        <EventAttributionModal
          anomalyId={selectedAnomaly || ''}
          onClose={() => {
            setShowEventModal(false)
            setSelectedAnomaly(null)
          }}
          onSave={(eventId) => {
            console.log('關聯事件:', eventId)
            setShowEventModal(false)
            setSelectedAnomaly(null)
          }}
        />
      )}
    </div>
  )
}

