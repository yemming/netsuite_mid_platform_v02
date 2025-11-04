'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Settings,
  Menu,
  X,
  Terminal,
  ChevronDown,
  ChevronRight,
  Search,
  Home,
  FileText,
  Database,
  User,
  Share2,
  ChevronDown as ChevronDownIcon,
  Bell,
  Send,
  Gift,
  HelpCircle,
  Receipt,
  Cog,
  Store
} from 'lucide-react'

interface MenuItem {
  name: string
  href?: string
  icon?: any
  children?: MenuItem[]
  badge?: string
}

const mainNavigation: MenuItem[] = [
  {
    name: '儀表板',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'SuiteQL 查詢',
    href: '/dashboard/query',
    icon: Terminal,
  },
]

const privatePages: MenuItem[] = [
  {
    name: 'NetSuite單據模擬',
    icon: Receipt,
    children: [
      {
        name: 'EPM',
        icon: FileText,
      },
      {
        name: 'NetSuite Traning',
        icon: FileText,
      },
      {
        name: 'NetSuite Material',
        icon: FileText,
      },
      {
        name: 'DDA Template',
        icon: FileText,
      },
      {
        name: 'NetSuite專案',
        icon: FileText,
      },
      {
        name: "NetSuite's SuiteApp",
        icon: FileText,
      },
    ],
  },
  // 實際功能頁面整合到 Private 區域
  {
    name: 'POS單據模擬',
    icon: Store,
    children: [
      {
        name: '我的訂單',
        href: '/dashboard/orders',
        icon: ShoppingCart,
      },
      {
        name: '設定',
        href: '/dashboard/settings',
        icon: Settings,
      },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['NetSuite單據模擬', 'POS單據模擬']))

  const toggleExpand = (itemName: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName)
    } else {
      newExpanded.add(itemName)
    }
    setExpandedItems(newExpanded)
  }

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const Icon = item.icon || FileText
    const isActive = item.href === pathname
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.name)
    const indentLevel = level * 20

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleExpand(item.name)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded hover:bg-[#354a56]/50 transition-colors text-sm ${
              isActive ? 'bg-[#3a4f5d] text-white' : 'text-gray-200 hover:text-white'
            }`}
            style={{ paddingLeft: `${8 + indentLevel}px` }}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              )}
              <Icon className="w-4 h-4 flex-shrink-0 text-gray-300" />
              <span className="truncate font-normal">{item.name}</span>
            </div>
          </button>
          {isExpanded && (
            <div className="mt-0.5">
              {item.children!.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    const content = (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors text-sm ${
          isActive
            ? 'bg-[#3a4f5d] text-white'
            : 'text-gray-200 hover:bg-[#354a56]/50 hover:text-white'
        }`}
        style={{ paddingLeft: `${8 + indentLevel}px` }}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="w-3.5 h-3.5 flex-shrink-0" /> {/* Spacer for alignment */}
          <Icon className="w-4 h-4 flex-shrink-0 text-gray-300" />
          <span className="truncate font-normal">{item.name}</span>
          {item.badge && (
            <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-blue-500 text-white rounded flex-shrink-0">
              {item.badge}
            </span>
          )}
        </div>
      </div>
    )

    if (item.href) {
      return (
        <Link key={item.name} href={item.href}>
          {content}
        </Link>
      )
    }

    return <div key={item.name}>{content}</div>
  }

  return (
    <>
      {/* Sidebar - Notion style with NetSuite colors */}
      <div className={`flex flex-col h-screen bg-[#28363F] text-white transition-all duration-300 relative ${
        isCollapsed ? 'w-0 overflow-hidden' : 'w-[240px]'
      }`}>
        {/* Sidebar Content */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Section - User & Workspace */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#354a56]/50">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#354a56] to-[#3a4f5d] flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-gray-300" />
            </div>
            <span className="text-sm font-medium text-gray-100 truncate flex-1">
              NetSuite AI 中臺
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button className="p-1 rounded hover:bg-[#354a56]/50 transition-colors">
                <Share2 className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <button 
                onClick={() => setIsCollapsed(true)}
                className="p-1 rounded hover:bg-[#354a56]/50 transition-colors"
              >
                <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="px-1.5 py-2 border-b border-[#354a56]/30">
            {mainNavigation.map((item) => (
              <div key={item.name}>
                {renderMenuItem(item, 0)}
              </div>
            ))}
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {/* Private Section */}
            <div className="px-3 py-2">
              {/* Private Pages */}
              <div className="space-y-0.5">
                {privatePages.map((item) => renderMenuItem(item, 0))}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-[#354a56]/50">
            <button className="p-1.5 rounded hover:bg-[#354a56]/50 transition-colors">
              <Cog className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1.5 rounded hover:bg-[#354a56]/50 transition-colors">
              <Send className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1.5 rounded hover:bg-[#354a56]/50 transition-colors">
              <Gift className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1.5 rounded hover:bg-[#354a56]/50 transition-colors">
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </button>
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

