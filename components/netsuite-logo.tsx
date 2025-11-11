export default function NetSuiteLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      {/* Infinity Symbol Logo from NAN_Logo.svg */}
      <div className="flex-shrink-0" style={{ width: '96px', height: '96px' }}>
        <img
          src="/NAN_Logo.svg"
          alt="Netsuite AI Nexus Logo"
          className="w-full h-full object-contain"
          style={{ width: '96px', height: '96px' }}
        />
      </div>
      
      {/* NetSuite Text - Only show text, no Oracle */}
      <div className="flex flex-col leading-none" style={{ marginLeft: '-4px' }}>
        <span className="text-2xl font-semibold text-gray-800 tracking-tight text-left">
          Netsuite AI Nexus
        </span>
      </div>
    </div>
  )
}

