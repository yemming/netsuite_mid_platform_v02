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
      {/* Sidebar - NetSuite Dark Ink Green */}
      <div className={`flex flex-col h-screen bg-[#1a3d2e] text-white transition-all duration-300 ${
        isCollapsed ? 'w-0 overflow-hidden' : 'w-64'
      }`}>
        {/* Logo/Title with Toggle Button */}
        <div className="p-6 border-b border-[#2a4d3e] flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">NetSuite AI 中臺</h1>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded hover:bg-[#2a4d3e] text-white transition-colors"
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
                  ? 'bg-[#2a5d4e] text-white'
                  : 'text-gray-300 hover:bg-[#2a4d3e] hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="p-4 border-t border-[#2a4d3e]">
        <Link
          href={settingsItem.href}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            pathname === settingsItem.href
              ? 'bg-[#2a5d4e] text-white'
              : 'text-gray-300 hover:bg-[#2a4d3e] hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">{settingsItem.name}</span>
        </Link>
      </div>
      </div>

      {/* Collapse Button (shown when sidebar is collapsed) */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed left-0 top-4 z-50 p-2 bg-[#1a3d2e] border-r border-[#2a4d3e] text-white rounded-r-lg hover:bg-[#2a4d3e] transition-colors shadow-lg"
          aria-label="顯示側邊欄"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
    </>
  )
}

