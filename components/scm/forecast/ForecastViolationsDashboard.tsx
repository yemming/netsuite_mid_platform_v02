'use client'

import { useState, useMemo } from 'react'

interface Violation {
  id: string
  intersectionId: string
  intersectionName: string
  violationType: string
  runId: string
  details: Record<string, any>
}

// 模擬數據
const mockViolations: Violation[] = [
  {
    id: '1',
    intersectionId: 'int-1',
    intersectionName: 'Product A @ Store 1',
    violationType: 'TREND_VIOLATION',
    runId: 'run-001',
    details: { severity: 'high' }
  },
  {
    id: '2',
    intersectionId: 'int-2',
    intersectionName: 'Product B @ Store 2',
    violationType: 'LEVEL_VIOLATION',
    runId: 'run-001',
    details: { severity: 'medium' }
  },
  {
    id: '3',
    intersectionId: 'int-3',
    intersectionName: 'Product C @ Store 1',
    violationType: 'SEASONALITY_VIOLATION',
    runId: 'run-001',
    details: { severity: 'high' }
  },
  {
    id: '4',
    intersectionId: 'int-4',
    intersectionName: 'Product D @ Store 3',
    violationType: 'RANGE_VIOLATION',
    runId: 'run-001',
    details: { severity: 'low' }
  },
  {
    id: '5',
    intersectionId: 'int-5',
    intersectionName: 'Product E @ Store 2',
    violationType: 'STRAIGHT_LINE_VIOLATION',
    runId: 'run-001',
    details: { severity: 'medium' }
  }
]

interface ForecastViolationsDashboardProps {
  onSelectViolation: (id: string) => void
}

const violationTypeLabels: Record<string, string> = {
  TREND_VIOLATION: '趨勢違規',
  LEVEL_VIOLATION: '水平違規',
  RANGE_VIOLATION: '範圍違規',
  SEASONALITY_VIOLATION: '季節性違規',
  STRAIGHT_LINE_VIOLATION: '直線違規'
}

export function ForecastViolationsDashboard({ onSelectViolation }: ForecastViolationsDashboardProps) {
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const filteredAndSortedData = useMemo(() => {
    let result = [...mockViolations]

    // 應用過濾
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        result = result.filter(item => {
          const itemValue = (item as any)[key]
          if (typeof itemValue === 'string') {
            return itemValue.toLowerCase().includes(value.toLowerCase())
          }
          return itemValue === value
        })
      }
    })

    // 應用排序
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = (a as any)[sortConfig.key]
        const bValue = (b as any)[sortConfig.key]
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [filters, sortConfig])

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null
      }
      return { key, direction: 'asc' }
    })
  }

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return '↕️'
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="bg-[#2A2A2A] rounded-lg border border-[#3A3A3A]">
      <div className="p-4 border-b border-[#3A3A3A]">
        <h2 className="text-lg font-semibold text-[#E0E0E0]">違規告警儀表板</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#333333] border-b border-[#3A3A3A]">
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
                <button
                  onClick={() => handleSort('intersectionName')}
                  className="flex items-center gap-2 hover:text-[#3B82F6] transition-colors"
                >
                  交叉點 {getSortIcon('intersectionName')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
                <button
                  onClick={() => handleSort('violationType')}
                  className="flex items-center gap-2 hover:text-[#3B82F6] transition-colors"
                >
                  違規類型 {getSortIcon('violationType')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
                嚴重程度
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.map((violation) => (
              <tr
                key={violation.id}
                className="border-b border-[#3A3A3A] hover:bg-[#2F2F2F] transition-colors cursor-pointer"
                onClick={() => onSelectViolation(violation.id)}
              >
                <td className="px-4 py-3 text-sm text-[#E0E0E0]">
                  {violation.intersectionName}
                </td>
                <td className="px-4 py-3 text-sm text-[#E0E0E0]">
                  {violationTypeLabels[violation.violationType] || violation.violationType}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded ${
                    violation.details.severity === 'high'
                      ? 'bg-[#EF4444] text-white'
                      : violation.details.severity === 'medium'
                      ? 'bg-[#F97316] text-white'
                      : 'bg-[#22C55E] text-white'
                  }`}>
                    {violation.details.severity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectViolation(violation.id)
                    }}
                    className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors text-sm"
                  >
                    查看詳情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

