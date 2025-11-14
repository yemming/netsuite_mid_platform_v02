'use client'

import { useMemo } from 'react'

interface ViolationChartProps {
  violationId: string
  violationType: string
}

// 模擬歷史和預測數據
const generateMockData = () => {
  const historical = []
  const forecast = []
  const startDate = new Date('2023-07-01')
  
  // 歷史數據（實際值）- 上升趨勢
  for (let i = 0; i < 180; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    historical.push({
      date: date.toISOString().split('T')[0],
      quantity: 100 + i * 0.5 + Math.random() * 20
    })
  }
  
  // 預測數據 - 下降趨勢（違規）
  for (let i = 180; i < 270; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    forecast.push({
      date: date.toISOString().split('T')[0],
      quantity: 200 - (i - 180) * 0.8 + Math.random() * 15
    })
  }
  
  return { historical, forecast }
}

export function ViolationChart({ violationId, violationType }: ViolationChartProps) {
  const { historical, forecast } = useMemo(() => generateMockData(), [violationId])
  
  // 計算趨勢線（歷史數據的線性回歸）
  const trendLine = useMemo(() => {
    const n = historical.length
    const sumX = historical.reduce((sum, _, i) => sum + i, 0)
    const sumY = historical.reduce((sum, p) => sum + p.quantity, 0)
    const sumXY = historical.reduce((sum, p, i) => sum + i * p.quantity, 0)
    const sumX2 = historical.reduce((sum, _, i) => sum + i * i, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    return historical.map((_, i) => ({
      date: historical[i].date,
      quantity: intercept + slope * i
    }))
  }, [historical])

  const allData = [...historical, ...forecast]
  const maxQuantity = Math.max(...allData.map(d => d.quantity))
  const minQuantity = Math.min(...allData.map(d => d.quantity))
  const range = maxQuantity - minQuantity
  const chartHeight = 400
  const chartWidth = 1000

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1000px]">
        {/* 圖例 */}
        <div className="flex gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-[#EC4899]"></div>
            <span className="text-[#E0E0E0]">Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 border-t-2 border-dashed border-[#EF4444]"></div>
            <span className="text-[#E0E0E0]">System Fcst</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-[#FFFFFF]"></div>
            <span className="text-[#E0E0E0]">Trend Line</span>
          </div>
        </div>

        {/* SVG 圖表 */}
        <svg width={chartWidth} height={chartHeight} className="border border-[#3A3A3A] rounded">
          {/* 背景網格 */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={`grid-${i}`}
              x1={0}
              y1={(chartHeight / 4) * i}
              x2={chartWidth}
              y2={(chartHeight / 4) * i}
              stroke="#2A2A2A"
              strokeWidth={1}
            />
          ))}

          {/* 歷史/實際數據折線 */}
          <polyline
            points={historical.map((point, index) => {
              const x = (index / allData.length) * chartWidth
              const y = chartHeight - ((point.quantity - minQuantity) / range) * chartHeight
              return `${x},${y}`
            }).join(' ')}
            fill="none"
            stroke="#EC4899"
            strokeWidth={2}
          />

          {/* 趨勢線（白色實線） */}
          <polyline
            points={trendLine.map((point, index) => {
              const x = (index / allData.length) * chartWidth
              const y = chartHeight - ((point.quantity - minQuantity) / range) * chartHeight
              return `${x},${y}`
            }).join(' ')}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={2}
            strokeDasharray="5,5"
          />

          {/* 預測數據折線（紅色虛線） */}
          <polyline
            points={forecast.map((point, index) => {
              const x = ((historical.length + index) / allData.length) * chartWidth
              const y = chartHeight - ((point.quantity - minQuantity) / range) * chartHeight
              return `${x},${y}`
            }).join(' ')}
            fill="none"
            stroke="#EF4444"
            strokeWidth={2}
            strokeDasharray="5,5"
          />

          {/* 分隔線（歷史和預測之間） */}
          <line
            x1={(historical.length / allData.length) * chartWidth}
            y1={0}
            x2={(historical.length / allData.length) * chartWidth}
            y2={chartHeight}
            stroke="#3B82F6"
            strokeWidth={2}
            strokeDasharray="10,5"
          />

          {/* 數據點 */}
          {historical.map((point, index) => {
            const x = (index / allData.length) * chartWidth
            const y = chartHeight - ((point.quantity - minQuantity) / range) * chartHeight
            return (
              <circle
                key={`hist-${index}`}
                cx={x}
                cy={y}
                r={2}
                fill="#EC4899"
              />
            )
          })}

          {forecast.map((point, index) => {
            const x = ((historical.length + index) / allData.length) * chartWidth
            const y = chartHeight - ((point.quantity - minQuantity) / range) * chartHeight
            return (
              <circle
                key={`fcst-${index}`}
                cx={x}
                cy={y}
                r={2}
                fill="#EF4444"
              />
            )
          })}
        </svg>

        {/* X 軸標籤 */}
        <div className="flex justify-between mt-2 text-xs text-[#B0B0B0]">
          <span>{historical[0].date}</span>
          <span className="text-[#3B82F6]">預測開始</span>
          <span>{forecast[forecast.length - 1].date}</span>
        </div>
      </div>
    </div>
  )
}

