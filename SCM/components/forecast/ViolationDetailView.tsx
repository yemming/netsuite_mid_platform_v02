'use client'

import { useMemo } from 'react'
import { ViolationChart } from './ViolationChart'

interface ViolationDetailViewProps {
  violationId: string
  onBack: () => void
}

// 模擬違規詳情數據
const mockViolationDetails = {
  '1': {
    intersectionName: 'Product A @ Store 1',
    violationType: 'TREND_VIOLATION',
    description: '歷史數據顯示上升趨勢，但預測顯示下降趨勢'
  },
  '2': {
    intersectionName: 'Product B @ Store 2',
    violationType: 'LEVEL_VIOLATION',
    description: '預測值超出歷史正常範圍'
  }
}

export function ViolationDetailView({ violationId, onBack }: ViolationDetailViewProps) {
  const violation = mockViolationDetails[violationId as keyof typeof mockViolationDetails] || mockViolationDetails['1']

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
        >
          ← 返回告警列表
        </button>
        <h2 className="text-xl font-semibold text-[#E0E0E0]">
          違規詳情 - {violation.intersectionName}
        </h2>
      </div>

      {/* 圖表區域 */}
      <div className="bg-[#2A2A2A] rounded-lg border border-[#3A3A3A] p-6">
        <h3 className="text-lg font-semibold text-[#E0E0E0] mb-4">預測對比圖</h3>
        <ViolationChart violationId={violationId} violationType={violation.violationType} />
      </div>

      {/* 違規詳情表格 */}
      <div className="bg-[#2A2A2A] rounded-lg border border-[#3A3A3A] p-6">
        <h3 className="text-lg font-semibold text-[#E0E0E0] mb-4">Forecast Alerts</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#333333] border-b border-[#3A3A3A]">
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
                  Actual
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
                  System Forecast
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
                  Alerts
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: '2024-01-15', actual: 150, forecast: 200, hasAlert: true },
                { date: '2024-01-16', actual: 160, forecast: 180, hasAlert: true },
                { date: '2024-01-17', actual: 170, forecast: 160, hasAlert: false },
                { date: '2024-01-18', actual: 180, forecast: 140, hasAlert: true },
              ].map((row, idx) => (
                <tr key={idx} className="border-b border-[#3A3A3A] hover:bg-[#2F2F2F]">
                  <td className="px-4 py-3 text-sm text-[#E0E0E0]">{row.date}</td>
                  <td className="px-4 py-3 text-sm text-[#E0E0E0]">{row.actual}</td>
                  <td className="px-4 py-3 text-sm text-[#E0E0E0]">{row.forecast}</td>
                  <td className="px-4 py-3">
                    {row.hasAlert && (
                      <span className="text-[#EF4444] text-lg" title="告警">▲!</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 違規描述 */}
      <div className="bg-[#2A2A2A] rounded-lg border border-[#3A3A3A] p-6">
        <h3 className="text-lg font-semibold text-[#E0E0E0] mb-2">違規說明</h3>
        <p className="text-[#B0B0B0]">{violation.description}</p>
      </div>
    </div>
  )
}

