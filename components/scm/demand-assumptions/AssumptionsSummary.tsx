'use client'

interface Assumption {
  id: string
  name: string
  createdBy: string
  status: 'DRAFT' | 'SUBMITTED' | 'REJECTED' | 'CANCELLED'
  assumptionLayerType: string
  createdAt: string
}

interface AssumptionsSummaryProps {
  assumptions: Assumption[]
  selectedAssumption: Assumption | null
  onSelectAssumption: (assumption: Assumption) => void
  onStatusChange: (id: string, status: Assumption['status']) => void
}

const statusLabels: Record<string, string> = {
  DRAFT: '草稿',
  SUBMITTED: 'Submitted To Forecast',
  REJECTED: '已拒絕',
  CANCELLED: '已取消'
}

export function AssumptionsSummary({
  assumptions,
  selectedAssumption,
  onSelectAssumption,
  onStatusChange
}: AssumptionsSummaryProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-[#333333] border-b border-[#3A3A3A]">
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
              ID
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
              Name
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
              Created By
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
              Layer Type
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
              Created At
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#E0E0E0]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {assumptions.map((assumption) => (
            <tr
              key={assumption.id}
              onClick={() => onSelectAssumption(assumption)}
              className={`
                border-b border-[#3A3A3A] cursor-pointer transition-colors
                ${selectedAssumption?.id === assumption.id 
                  ? 'bg-[#1E3A5F]' 
                  : 'hover:bg-[#2F2F2F]'
                }
              `}
            >
              <td className="px-4 py-3 text-sm text-[#E0E0E0]">{assumption.id}</td>
              <td className="px-4 py-3 text-sm text-[#E0E0E0]">{assumption.name}</td>
              <td className="px-4 py-3 text-sm text-[#E0E0E0]">{assumption.createdBy}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 rounded ${
                  assumption.status === 'SUBMITTED'
                    ? 'bg-[#22C55E] text-white'
                    : assumption.status === 'DRAFT'
                    ? 'bg-[#F97316] text-white'
                    : 'bg-[#6B7280] text-white'
                }`}>
                  {statusLabels[assumption.status] || assumption.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-[#E0E0E0]">{assumption.assumptionLayerType}</td>
              <td className="px-4 py-3 text-sm text-[#E0E0E0]">{assumption.createdAt}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {assumption.status === 'DRAFT' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onStatusChange(assumption.id, 'SUBMITTED')
                        }}
                        className="text-xs px-2 py-1 bg-[#3B82F6] text-white rounded hover:bg-[#2563EB] transition-colors"
                      >
                        Submit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onStatusChange(assumption.id, 'CANCELLED')
                        }}
                        className="text-xs px-2 py-1 bg-[#6B7280] text-white rounded hover:bg-[#4B5563] transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {assumption.status === 'SUBMITTED' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onStatusChange(assumption.id, 'REJECTED')
                      }}
                      className="text-xs px-2 py-1 bg-[#EF4444] text-white rounded hover:bg-[#DC2626] transition-colors"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // Copy functionality
                    }}
                    className="text-xs px-2 py-1 bg-[#6B7280] text-white rounded hover:bg-[#4B5563] transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

