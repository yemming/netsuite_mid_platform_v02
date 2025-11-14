import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#1F1F1F] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#E0E0E0] mb-8">o9 需求規劃平台</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* M1: EDA 模組 */}
          <Link 
            href="/eda" 
            className="block p-6 bg-[#2A2A2A] rounded-lg border border-[#3A3A3A] hover:border-[#3B82F6] transition-colors"
          >
            <h2 className="text-xl font-semibold text-[#3B82F6] mb-2">M1: 探索性數據分析</h2>
            <p className="text-[#B0B0B0] text-sm">
              識別歷史數據的異常並歸因
            </p>
          </Link>

          {/* M2: 預測分析駕駛艙 */}
          <Link 
            href="/forecast-analysis" 
            className="block p-6 bg-[#2A2A2A] rounded-lg border border-[#3A3A3A] hover:border-[#3B82F6] transition-colors"
          >
            <h2 className="text-xl font-semibold text-[#3B82F6] mb-2">M2: 預測分析駕駛艙</h2>
            <p className="text-[#B0B0B0] text-sm">
              評估和修正統計預測的合理性
            </p>
          </Link>

          {/* M3: 需求假設 */}
          <Link 
            href="/demand-assumptions" 
            className="block p-6 bg-[#2A2A2A] rounded-lg border border-[#3A3A3A] hover:border-[#3B82F6] transition-colors"
          >
            <h2 className="text-xl font-semibold text-[#3B82F6] mb-2">M3: 需求假設與預測層</h2>
            <p className="text-[#B0B0B0] text-sm">
              結構化地管理和疊加業務調整
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}

