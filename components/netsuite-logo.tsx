export default function NetSuiteLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      {/* OC Logo - 亮色模式：綠色，暗色模式：紅色 */}
      <div className="flex-shrink-0" style={{ width: '72px', height: '72px', marginLeft: '-4px' }}>
        {/* 亮色模式：綠色 logo */}
        <img
          src="/OC_Logo_Green.png"
          alt="NetSuite交易模擬系統 Logo"
          className="w-full h-full object-contain dark:hidden"
          style={{ width: '72px', height: '72px' }}
        />
        {/* 暗色模式：紅色 logo */}
        <img
          src="/OC_Logo_Red.png"
          alt="NetSuite交易模擬系統 Logo"
          className="w-full h-full object-contain hidden dark:block"
          style={{ width: '72px', height: '72px' }}
        />
      </div>
      
      {/* NetSuite Text - Only show text, no Oracle */}
      <div className="flex flex-col leading-none" style={{ marginLeft: '12px' }}>
        <span className="text-2xl font-semibold text-gray-800 tracking-tight text-left">
          NetSuite交易模擬系統
        </span>
      </div>
    </div>
  )
}

