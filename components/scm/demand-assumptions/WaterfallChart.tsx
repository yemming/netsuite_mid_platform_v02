'use client'

interface Layer {
  name: string
  color: string
  values: number[]
}

interface WaterfallChartProps {
  layers: Layer[]
  months: string[]
}

export function WaterfallChart({ layers, months }: WaterfallChartProps) {
  const chartHeight = 400
  const chartWidth = 1000
  const barWidth = chartWidth / months.length / layers.length * 0.8
  const maxValue = Math.max(...layers.flatMap(l => l.values))

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1000px]">
        {/* 圖例 */}
        <div className="flex flex-wrap gap-3 mb-4 text-sm">
          {layers.map((layer) => (
            <div key={layer.name} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: layer.color }}
              />
              <span className="text-[#E0E0E0]">{layer.name}</span>
            </div>
          ))}
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

          {/* 繪製瀑布圖 */}
          {months.map((month, monthIndex) => {
            const monthX = (monthIndex / months.length) * chartWidth
            let cumulativeY = chartHeight

            return layers.map((layer, layerIndex) => {
              const value = layer.values[monthIndex]
              const barHeight = (value / maxValue) * chartHeight * 0.8
              const x = monthX + (layerIndex * barWidth)
              const y = cumulativeY - barHeight

              // 更新累積位置（下一個圖層從這個圖層的頂部開始）
              cumulativeY = y

              return (
                <rect
                  key={`${month}-${layer.name}`}
                  x={x}
                  y={y}
                  width={barWidth * 0.9}
                  height={barHeight}
                  fill={layer.color}
                  stroke="#1F1F1F"
                  strokeWidth={1}
                />
              )
            })
          })}

          {/* X 軸標籤 */}
          {months.map((month, index) => {
            const x = ((index + 0.5) / months.length) * chartWidth
            return (
              <text
                key={month}
                x={x}
                y={chartHeight - 5}
                textAnchor="middle"
                className="text-xs fill-[#B0B0B0]"
              >
                {month}
              </text>
            )
          })}

          {/* Y 軸標籤 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = Math.round(maxValue * ratio)
            const y = chartHeight - (chartHeight * ratio * 0.8)
            return (
              <text
                key={ratio}
                x={5}
                y={y + 4}
                className="text-xs fill-[#B0B0B0]"
              >
                {value}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

