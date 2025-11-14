'use client'

import { useState } from 'react'

interface AssumptionDetailsProps {
  assumptionId: string
}

// 生成月份標籤 (M09-23, M10-23 格式)
const generateMonthLabels = () => {
  const labels = []
  const startDate = new Date('2023-09-01')
  for (let i = 0; i < 12; i++) {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + i)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    labels.push(`M${month}-${year}`)
  }
  return labels
}

// 模擬明細數據
const generateMockDetails = () => {
  const intersections = [
    { id: 'int-1', name: 'Product A @ Store 1' },
    { id: 'int-2', name: 'Product B @ Store 1' },
    { id: 'int-3', name: 'Product A @ Store 2' },
  ]
  
  const months = generateMonthLabels()
  const details: Record<string, Record<string, number>> = {}
  
  intersections.forEach(intersection => {
    details[intersection.id] = {}
    months.forEach(month => {
      // 模擬一些調整值（正數或負數）
      details[intersection.id][month] = Math.floor(Math.random() * 1000) - 500
    })
  })
  
  return { intersections, months, details }
}

export function AssumptionDetails({ assumptionId }: AssumptionDetailsProps) {
  const { intersections, months, details } = generateMockDetails()
  const [editingCell, setEditingCell] = useState<{ intersectionId: string; month: string } | null>(null)
  const [cellValues, setCellValues] = useState<Record<string, Record<string, number>>>(details)

  const handleCellChange = (intersectionId: string, month: string, value: number) => {
    setCellValues(prev => ({
      ...prev,
      [intersectionId]: {
        ...prev[intersectionId],
        [month]: value
      }
    }))
  }

  const formatValue = (value: number) => {
    if (value < 0) {
      return `(${Math.abs(value)})`
    }
    return String(value)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-[#333333] border-b border-[#3A3A3A]">
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0] sticky left-0 bg-[#333333] z-10">
              Intersection
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
          {intersections.map((intersection) => (
            <tr key={intersection.id} className="border-b border-[#3A3A3A] hover:bg-[#2F2F2F]">
              <td className="px-4 py-3 text-sm text-[#E0E0E0] sticky left-0 bg-[#2A2A2A] z-10">
                {intersection.name}
              </td>
              {months.map((month) => {
                const value = cellValues[intersection.id]?.[month] || 0
                const isEditing = editingCell?.intersectionId === intersection.id && editingCell?.month === month
                
                return (
                  <td
                    key={month}
                    className="px-3 py-2 text-center text-sm"
                    onClick={() => setEditingCell({ intersectionId: intersection.id, month })}
                  >
                    {isEditing ? (
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => handleCellChange(intersection.id, month, parseInt(e.target.value) || 0)}
                        onBlur={() => setEditingCell(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingCell(null)
                          }
                        }}
                        autoFocus
                        className="w-full px-2 py-1 bg-[#333333] border border-[#3B82F6] rounded text-[#E0E0E0] text-sm text-center focus:outline-none"
                      />
                    ) : (
                      <span className={`text-[#E0E0E0] ${value < 0 ? 'text-[#EF4444]' : ''}`}>
                        {formatValue(value)}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

