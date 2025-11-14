'use client'

import { useState, useMemo } from 'react'

interface AlgorithmStat {
  id: string
  name: string
  runCount: number
  bestFitPercent: number
  trendViolationPercent: number
  levelViolationPercent: number
  rangeViolationPercent: number
  seasonalityViolationPercent: number
  straightLineViolationPercent: number
}

// 模擬數據
const mockAlgorithms: AlgorithmStat[] = [
  {
    id: '1',
    name: 'BestFit Algorithm',
    runCount: 150,
    bestFitPercent: 45,
    trendViolationPercent: 12,
    levelViolationPercent: 8,
    rangeViolationPercent: 5,
    seasonalityViolationPercent: 15,
    straightLineViolationPercent: 3
  },
  {
    id: '2',
    name: 'Growth AFA',
    runCount: 120,
    bestFitPercent: 30,
    trendViolationPercent: 20,
    levelViolationPercent: 15,
    rangeViolationPercent: 10,
    seasonalityViolationPercent: 25,
    straightLineViolationPercent: 8
  },
  {
    id: '3',
    name: 'ARIMA',
    runCount: 200,
    bestFitPercent: 60,
    trendViolationPercent: 5,
    levelViolationPercent: 3,
    rangeViolationPercent: 2,
    seasonalityViolationPercent: 8,
    straightLineViolationPercent: 1
  },
  {
    id: '4',
    name: 'Prophet',
    runCount: 180,
    bestFitPercent: 55,
    trendViolationPercent: 8,
    levelViolationPercent: 5,
    rangeViolationPercent: 4,
    seasonalityViolationPercent: 10,
    straightLineViolationPercent: 2
  }
]

export function AlgorithmInsights() {
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const sortedData = useMemo(() => {
    if (!sortConfig) return mockAlgorithms
    
    return [...mockAlgorithms].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key]
      const bValue = (b as any)[sortConfig.key]
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [sortConfig])

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
        <h2 className="text-lg font-semibold text-[#E0E0E0]">Algo Insights</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#333333] border-b border-[#3A3A3A]">
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 hover:text-[#3B82F6] transition-colors"
                >
                  Stat Algorithm {getSortIcon('name')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
                <button
                  onClick={() => handleSort('runCount')}
                  className="flex items-center gap-2 hover:text-[#3B82F6] transition-colors"
                >
                  Run Count {getSortIcon('runCount')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
                <button
                  onClick={() => handleSort('bestFitPercent')}
                  className="flex items-center gap-2 hover:text-[#3B82F6] transition-colors"
                >
                  BestFit % {getSortIcon('bestFitPercent')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
                Trend Violation %
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
                Level Violation %
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
                Range Violation %
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
                Seasonality Violation %
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
                Straight Line Violation %
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((algo) => (
              <tr
                key={algo.id}
                onClick={() => setSelectedRow(algo.id)}
                className={`
                  border-b border-[#3A3A3A] cursor-pointer transition-colors
                  ${selectedRow === algo.id 
                    ? 'bg-[#1E3A5F]' 
                    : 'hover:bg-[#2F2F2F]'
                  }
                `}
              >
                <td className="px-4 py-3">
                  <span className={`text-sm ${
                    algo.bestFitPercent < 40 || algo.trendViolationPercent > 15
                      ? 'text-[#EF4444]'
                      : 'text-[#E0E0E0]'
                  }`}>
                    {algo.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-[#E0E0E0]">{algo.runCount}</td>
                <td className="px-4 py-3 text-sm text-[#E0E0E0]">{algo.bestFitPercent}%</td>
                <td className="px-4 py-3 text-sm text-[#E0E0E0]">{algo.trendViolationPercent}%</td>
                <td className="px-4 py-3 text-sm text-[#E0E0E0]">{algo.levelViolationPercent}%</td>
                <td className="px-4 py-3 text-sm text-[#E0E0E0]">{algo.rangeViolationPercent}%</td>
                <td className="px-4 py-3 text-sm text-[#E0E0E0]">{algo.seasonalityViolationPercent}%</td>
                <td className="px-4 py-3 text-sm text-[#E0E0E0]">{algo.straightLineViolationPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

