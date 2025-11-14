'use client'

import { useState } from 'react'

interface EventAttributionModalProps {
  anomalyId: string
  onClose: () => void
  onSave: (eventId: string) => void
}

// 模擬事件列表
const mockEvents = [
  { id: '1', name: '聖誕節促銷', startDate: '2023-12-20', endDate: '2023-12-27' },
  { id: '2', name: '春節假期', startDate: '2023-01-20', endDate: '2023-01-27' },
  { id: '3', name: '雙十一促銷', startDate: '2023-11-01', endDate: '2023-11-11' },
]

export function EventAttributionModal({ anomalyId, onClose, onSave }: EventAttributionModalProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>('')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#2A2A2A] rounded-lg border border-[#3A3A3A] p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-[#E0E0E0] mb-4">
          將異常關聯到事件
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#B0B0B0] mb-2">
              選擇事件
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 bg-[#333333] border border-[#3A3A3A] rounded text-[#E0E0E0] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="">請選擇事件</option>
              {mockEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} ({event.startDate} - {event.endDate})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#333333] text-[#E0E0E0] rounded hover:bg-[#3A3A3A] transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => {
                if (selectedEventId) {
                  onSave(selectedEventId)
                }
              }}
              disabled={!selectedEventId}
              className="px-4 py-2 bg-[#3B82F6] text-white rounded hover:bg-[#2563EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              確認
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

