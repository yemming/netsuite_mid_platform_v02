'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Database, 
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

const menuItems = [
  {
    name: '儀表板',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: '我的訂單',
    href: '/dashboard/orders',
    icon: ShoppingCart,
  },
  {
    name: 'SuiteQL 查詢表',
    href: '/dashboard/db',
    icon: Database,
  },
]

const settingsItem = {
  name: '設定',
  href: '/dashboard/settings',
  icon: Settings,
}

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* Sidebar - NetSuite Dark Blue-Green (#28363F) with subtle camouflage */}
      <div className={`flex flex-col h-screen bg-[#28363F] text-white transition-all duration-300 relative ${
        isCollapsed ? 'w-0 overflow-hidden' : 'w-64'
      }`}>
        {/* Subtle Camouflage Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="sidebarCamouflage" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                {/* Base */}
                <rect width="120" height="120" fill="#28363F"/>
                
                {/* Very faint geometric blobs */}
                <ellipse cx="25" cy="30" rx="35" ry="25" fill="#354a56" opacity="0.15"/>
                <ellipse cx="70" cy="20" rx="30" ry="20" fill="#3a4f5d" opacity="0.12"/>
                <ellipse cx="50" cy="60" rx="40" ry="30" fill="#2d434f" opacity="0.18"/>
                <ellipse cx="90" cy="80" rx="28" ry="22" fill="#354a56" opacity="0.14"/>
                <ellipse cx="30" cy="95" rx="32" ry="24" fill="#3a4f5d" opacity="0.16"/>
                <ellipse cx="100" cy="50" rx="25" ry="18" fill="#2d434f" opacity="0.13"/>
                
                {/* Subtle wavy texture lines */}
                <path d="M 0 20 Q 40 25 80 20 T 120 20" fill="none" stroke="#4a5f6d" strokeWidth="0.5" opacity="0.1"/>
                <path d="M 0 60 Q 45 55 90 60 T 120 60" fill="none" stroke="#5a6f7d" strokeWidth="0.5" opacity="0.08"/>
                <path d="M 0 100 Q 35 95 70 100 T 120 100" fill="none" stroke="#3a4f5d" strokeWidth="0.5" opacity="0.12"/>
                
                {/* Very subtle dots */}
                <circle cx="20" cy="25" r="2" fill="#5a6f7d" opacity="0.1"/>
                <circle cx="85" cy="45" r="1.5" fill="#4a5f6d" opacity="0.08"/>
                <circle cx="45" cy="85" r="1.8" fill="#5a6f7d" opacity="0.12"/>
                <circle cx="105" cy="70" r="1.2" fill="#3a4f5d" opacity="0.09"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#sidebarCamouflage)"/>
          </svg>
        </div>
        
        {/* Sidebar Content - relative to ensure it's above the pattern */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo/Title with Toggle Button */}
          <div className="p-6 border-b border-[#354a56] flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">NetSuite AI 中臺</h1>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded hover:bg-[#354a56] text-white transition-colors"
              aria-label="隱藏側邊欄"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#3a4f5d] text-white'
                      : 'text-gray-300 hover:bg-[#354a56] hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Settings at bottom */}
          <div className="p-4 border-t border-[#354a56]">
            <Link
              href={settingsItem.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                pathname === settingsItem.href
                  ? 'bg-[#3a4f5d] text-white'
                  : 'text-gray-300 hover:bg-[#354a56] hover:text-white'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">{settingsItem.name}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Collapse Button (shown when sidebar is collapsed) */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed left-0 top-4 z-50 p-2 bg-[#28363F] border-r border-[#354a56] text-white rounded-r-lg hover:bg-[#354a56] transition-colors shadow-lg"
          aria-label="顯示側邊欄"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
    </>
  )
}

