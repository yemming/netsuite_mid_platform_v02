'use client'

import { useState } from 'react'

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

interface EDATableProps {
  data: Intersection[]
  selectedIntersection: Intersection | null
  onSelectIntersection: (id: string) => void
  onDrillDown: (id: string) => void
  onFilter: (filters: Record<string, any>) => void
  onSort: (key: string) => void
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null
}

export function EDATable({
  data,
  selectedIntersection,
  onSelectIntersection,
  onDrillDown,
  onSort,
  sortConfig
}: EDATableProps) {
  const [filters, setFilters] = useState<Record<string, string>>({})

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    // 這裡可以觸發父組件的過濾邏輯
  }

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return '↕️'
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-[#333333] border-b border-[#3A3A3A]">
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
              <button
                onClick={() => onSort('name')}
                className="flex items-center gap-2 hover:text-[#3B82F6] transition-colors"
              >
                Segment Item {getSortIcon('name')}
              </button>
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
              <button
                onClick={() => onSort('productSku')}
                className="flex items-center gap-2 hover:text-[#3B82F6] transition-colors"
              >
                Product SKU {getSortIcon('productSku')}
              </button>
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
              <button
                onClick={() => onSort('locationCode')}
                className="flex items-center gap-2 hover:text-[#3B82F6] transition-colors"
              >
                Location {getSortIcon('locationCode')}
              </button>
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
              <button
                onClick={() => onSort('totalSpikes')}
                className="flex items-center gap-2 hover:text-[#3B82F6] transition-colors"
              >
                Total Spikes {getSortIcon('totalSpikes')}
              </button>
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
              Holiday Spikes
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
              Promo Spikes
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
              <button
                onClick={() => onSort('potentialStockout')}
                className="flex items-center gap-2 hover:text-[#3B82F6] transition-colors"
              >
                Potential Stockout {getSortIcon('potentialStockout')}
              </button>
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              onClick={() => onSelectIntersection(item.id)}
              className={`
                border-b border-[#3A3A3A] cursor-pointer transition-colors
                ${selectedIntersection?.id === item.id 
                  ? 'bg-[#1E3A5F]' 
                  : 'hover:bg-[#2F2F2F]'
                }
              `}
            >
              <td className="px-4 py-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDrillDown(item.id)
                  }}
                  className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
                >
                  {item.name}
                </button>
              </td>
              <td className="px-4 py-3 text-sm text-[#E0E0E0]">{item.productSku}</td>
              <td className="px-4 py-3 text-sm text-[#E0E0E0]">{item.locationCode}</td>
              <td className="px-4 py-3 text-sm text-[#E0E0E0]">{item.totalSpikes}</td>
              <td className="px-4 py-3">
                <div className="w-24 h-4 bg-[#333333] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#22C55E] transition-all"
                    style={{ width: `${item.holidaySpikesPercent}%` }}
                  />
                </div>
                <span className="text-xs text-[#B0B0B0] ml-2">{item.holidaySpikesPercent}%</span>
              </td>
              <td className="px-4 py-3">
                <div className="w-24 h-4 bg-[#333333] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#22C55E] transition-all"
                    style={{ width: `${item.promoSpikesPercent}%` }}
                  />
                </div>
                <span className="text-xs text-[#B0B0B0] ml-2">{item.promoSpikesPercent}%</span>
              </td>
              <td className="px-4 py-3 text-sm text-[#E0E0E0]">{item.potentialStockout}</td>
              <td className="px-4 py-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDrillDown(item.id)
                  }}
                  className="text-[#E0E0E0] hover:text-[#3B82F6] transition-colors"
                  title="下鑽查看詳情"
                >
                  ⋯
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

