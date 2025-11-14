'use client'

import { useMemo } from 'react'

interface EDAChartProps {
  intersectionId: string
}

// 模擬歷史數據
const generateMockData = () => {
  const data = []
  const startDate = new Date('2023-01-01')
  
  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    // 模擬一些異常點
    let quantity = 100 + Math.random() * 50
    
    // 添加一些波峰（Spikes）
    if (i === 50 || i === 150 || i === 250) {
      quantity = 300 + Math.random() * 100
    }
    
    // 添加一些波谷（Dips）
    if (i === 100 || i === 200) {
      quantity = 30 + Math.random() * 20
    }
    
    // 添加潛在缺貨時段
    if (i >= 80 && i <= 90) {
      quantity = 5 + Math.random() * 10
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      quantity: Math.round(quantity)
    })
  }
  
  return data
}

export function EDAChart({ intersectionId }: EDAChartProps) {
  const data = useMemo(() => generateMockData(), [intersectionId])
  
  // 識別異常點
  const anomalies = useMemo(() => {
    const spikes: number[] = []
    const dips: number[] = []
    const stockoutPeriods: { start: number; end: number }[] = []
    
    data.forEach((point, index) => {
      const avg = data
        .slice(Math.max(0, index - 7), Math.min(data.length, index + 7))
        .reduce((sum, p) => sum + p.quantity, 0) / 14
      
      // 波峰檢測
      if (point.quantity > avg * 1.5) {
        spikes.push(index)
      }
      
      // 波谷檢測
      if (point.quantity < avg * 0.5) {
        dips.push(index)
      }
      
      // 缺貨檢測
      if (point.quantity < 20) {
        if (stockoutPeriods.length === 0 || stockoutPeriods[stockoutPeriods.length - 1].end !== index - 1) {
          stockoutPeriods.push({ start: index, end: index })
        } else {
          stockoutPeriods[stockoutPeriods.length - 1].end = index
        }
      }
    })
    
    return { spikes, dips, stockoutPeriods }
  }, [data])

  const maxQuantity = Math.max(...data.map(d => d.quantity))
  const minQuantity = Math.min(...data.map(d => d.quantity))
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
            <div className="w-4 h-0.5 bg-[#F97316]"></div>
            <span className="text-[#E0E0E0]">Spikes Flag</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-[#22C55E]"></div>
            <span className="text-[#E0E0E0]">Dips Flag</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-[#4B5563]"></div>
            <span className="text-[#E0E0E0]">Potential Stockout Period</span>
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

          {/* 潛在缺貨區域 */}
          {anomalies.stockoutPeriods.map((period, idx) => {
            const x1 = (period.start / data.length) * chartWidth
            const x2 = ((period.end + 1) / data.length) * chartWidth
            return (
              <rect
                key={`stockout-${idx}`}
                x={x1}
                y={0}
                width={x2 - x1}
                height={chartHeight}
                fill="#4B5563"
                opacity={0.3}
              />
            )
          })}

          {/* 波峰標記線 */}
          {anomalies.spikes.map((index) => {
            const x = (index / data.length) * chartWidth
            return (
              <line
                key={`spike-${index}`}
                x1={x}
                y1={0}
                x2={x}
                y2={chartHeight}
                stroke="#F97316"
                strokeWidth={2}
              />
            )
          })}

          {/* 波谷標記線 */}
          {anomalies.dips.map((index) => {
            const x = (index / data.length) * chartWidth
            return (
              <line
                key={`dip-${index}`}
                x1={x}
                y1={0}
                x2={x}
                y2={chartHeight}
                stroke="#22C55E"
                strokeWidth={2}
              />
            )
          })}

          {/* 實際數據折線 */}
          <polyline
            points={data.map((point, index) => {
              const x = (index / data.length) * chartWidth
              const y = chartHeight - ((point.quantity - minQuantity) / range) * chartHeight
              return `${x},${y}`
            }).join(' ')}
            fill="none"
            stroke="#EC4899"
            strokeWidth={2}
          />

          {/* 數據點 */}
          {data.map((point, index) => {
            const x = (index / data.length) * chartWidth
            const y = chartHeight - ((point.quantity - minQuantity) / range) * chartHeight
            return (
              <circle
                key={`point-${index}`}
                cx={x}
                cy={y}
                r={2}
                fill="#EC4899"
              />
            )
          })}
        </svg>

        {/* X 軸標籤 */}
        <div className="flex justify-between mt-2 text-xs text-[#B0B0B0]">
          <span>{data[0].date}</span>
          <span>{data[Math.floor(data.length / 2)].date}</span>
          <span>{data[data.length - 1].date}</span>
        </div>
      </div>
    </div>
  )
}

