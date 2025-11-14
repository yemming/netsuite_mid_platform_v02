'use client'

import { useState, useMemo } from 'react'
import { EDAChart } from './EDAChart'
import { EDATable } from './EDATable'

interface Intersection {
  id: string
  name: string
  productSku: string
  locationCode: string
  totalSpikes: number
  holidaySpikesPercent: number
  promoSpikesPercent: number
  potentialStockout: number
  flagTypes: string[]
}

// 模擬數據
const mockIntersections: Intersection[] = [
  {
    id: '1',
    name: 'Alcohol',
    productSku: 'PROD-001',
    locationCode: 'LOC-001',
    totalSpikes: 5,
    holidaySpikesPercent: 100,
    promoSpikesPercent: 60,
    potentialStockout: 2,
    flagTypes: ['HOLIDAY_IMPACT', 'PROMO_IMPACT', 'POTENTIAL_STOCKOUT']
  },
  {
    id: '2',
    name: 'Beverage',
    productSku: 'PROD-002',
    locationCode: 'LOC-002',
    totalSpikes: 3,
    holidaySpikesPercent: 80,
    promoSpikesPercent: 40,
    potentialStockout: 1,
    flagTypes: ['HOLIDAY_IMPACT', 'UNKNOWN_SPIKE']
  },
  {
    id: '3',
    name: 'Snacks',
    productSku: 'PROD-003',
    locationCode: 'LOC-001',
    totalSpikes: 8,
    holidaySpikesPercent: 50,
    promoSpikesPercent: 100,
    potentialStockout: 3,
    flagTypes: ['PROMO_IMPACT', 'POTENTIAL_STOCKOUT', 'UNKNOWN_DIP']
  }
]

interface EDAOverviewProps {
  onSelectIntersection: (id: string) => void
}

export function EDAOverview({ onSelectIntersection }: EDAOverviewProps) {
  const [selectedIntersection, setSelectedIntersection] = useState<Intersection | null>(mockIntersections[0])
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const filteredAndSortedData = useMemo(() => {
    let result = [...mockIntersections]

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

  return (
    <div className="space-y-6">
      {/* 上半部：圖表（當有選中項目時顯示） */}
      {selectedIntersection && (
        <div className="bg-[#2A2A2A] rounded-lg border border-[#3A3A3A] p-6">
          <h2 className="text-lg font-semibold text-[#E0E0E0] mb-4">
            Review Actuals - {selectedIntersection.name}
          </h2>
          <EDAChart intersectionId={selectedIntersection.id} />
        </div>
      )}

      {/* 下半部：總覽表格 */}
      <div className="bg-[#2A2A2A] rounded-lg border border-[#3A3A3A]">
        <div className="p-4 border-b border-[#3A3A3A]">
          <h2 className="text-lg font-semibold text-[#E0E0E0]">EDA 總覽</h2>
        </div>
        <EDATable
          data={filteredAndSortedData}
          selectedIntersection={selectedIntersection}
          onSelectIntersection={(id) => {
            const intersection = mockIntersections.find(i => i.id === id)
            if (intersection) {
              setSelectedIntersection(intersection)
            }
          }}
          onDrillDown={onSelectIntersection}
          onFilter={setFilters}
          onSort={handleSort}
          sortConfig={sortConfig}
        />
      </div>
    </div>
  )
}

