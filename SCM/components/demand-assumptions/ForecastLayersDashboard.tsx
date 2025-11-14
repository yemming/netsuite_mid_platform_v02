'use client'

import { useState, useMemo } from 'react'
import { WaterfallChart } from './WaterfallChart'

// 生成月份標籤
const generateMonthLabels = () => {
  const labels = []
  const startDate = new Date('2024-01-01')
  for (let i = 0; i < 12; i++) {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + i)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    labels.push(`M${month}-${year}`)
  }
  return labels
}

// 模擬圖層數據
const generateLayerData = () => {
  const months = generateMonthLabels()
  const layers = [
    { name: 'Stat Fcst', color: '#3B82F6', values: months.map(() => 1000 + Math.random() * 200) },
    { name: 'Stat Fcst Final', color: '#22C55E', values: months.map(() => 1050 + Math.random() * 150) },
    { name: 'Adjustment 1', color: '#EC4899', values: months.map(() => 100 + Math.random() * 50) },
    { name: 'Adjustment 2', color: '#F97316', values: months.map(() => 50 + Math.random() * 30) },
    { name: 'Adjustment 3', color: '#06B6D4', values: months.map(() => 30 + Math.random() * 20) },
    { name: 'Adjustment 4', color: '#FCD34D', values: months.map(() => 20 + Math.random() * 10) },
    { name: 'Adjustment 5', color: '#A855F7', values: months.map(() => 10 + Math.random() * 5) },
  ]
  
  // 計算共識預測（所有圖層的總和）
  const consensusValues = months.map((_, monthIndex) => {
    return layers.reduce((sum, layer) => sum + layer.values[monthIndex], 0)
  })
  
  layers.push({
    name: 'Consensus Fcst',
    color: '#1E40AF',
    values: consensusValues
  })
  
  return { layers, months }
}

export function ForecastLayersDashboard() {
  const { layers, months } = useMemo(() => generateLayerData(), [])
  const [selectedMonth, setSelectedMonth] = useState<string>(months[0])

  const formatValue = (value: number) => {
    if (value < 0) {
      return `(${Math.abs(Math.round(value))})`
    }
    return String(Math.round(value))
  }

  return (
    <div className="space-y-6">
      {/* 上半部：瀑布圖 */}
      <div className="bg-[#2A2A2A] rounded-lg border border-[#3A3A3A] p-6">
        <div className="flex items-center gap-2 mb-4">
          <button className="px-3 py-1 bg-[#3B82F6] text-white rounded text-sm">
            Waterfall
          </button>
          <button className="px-3 py-1 bg-[#333333] text-[#B0B0B0] rounded text-sm hover:bg-[#3A3A3A]">
            Line
          </button>
        </div>
        <WaterfallChart layers={layers} months={months} />
      </div>

      {/* 下半部：明細網格 (Breakdown) */}
      <div className="bg-[#2A2A2A] rounded-lg border border-[#3A3A3A]">
        <div className="p-4 border-b border-[#3A3A3A]">
          <h2 className="text-lg font-semibold text-[#E0E0E0]">Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#333333] border-b border-[#3A3A3A]">
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
                  Layer
                </th>
                {months.map((month) => (
                  <th
                    key={month}
                    className="px-3 py-3 text-center text-sm font-semibold text-[#1F1F1F] bg-[#FCD34D] min-w-[100px]"
                  >
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {layers.map((layer) => (
                <tr key={layer.name} className="border-b border-[#3A3A3A] hover:bg-[#2F2F2F]">
                  <td className="px-4 py-3 text-sm text-[#E0E0E0]">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: layer.color }}
                      />
                      {layer.name}
                    </div>
                  </td>
                  {layer.values.map((value, idx) => (
                    <td
                      key={idx}
                      className="px-3 py-2 text-center text-sm text-[#E0E0E0]"
                    >
                      {formatValue(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

