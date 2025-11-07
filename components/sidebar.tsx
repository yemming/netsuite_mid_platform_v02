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
  {
    name: '設定',
    href: '/dashboard/settings',
    icon: Settings,
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

          {/* Scrollable Content Area with Abstract Background */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative">
            {/* Abstract Background Pattern - Fixed at bottom of scrollable area */}
            <div className="absolute bottom-0 left-0 right-0 opacity-60 pointer-events-none" style={{ height: '120px', zIndex: 0 }}>
              <svg 
                width="100%" 
                height="100%" 
                viewBox="0 0 240 120" 
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0"
              >
                <defs>
                  {/* Gradients for organic shapes */}
                  <linearGradient id="coralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#FF8E8E" stopOpacity="0.2"/>
                  </linearGradient>
                  <linearGradient id="mustardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FDB515" stopOpacity="0.5"/>
                    <stop offset="100%" stopColor="#FFD700" stopOpacity="0.3"/>
                  </linearGradient>
                  <linearGradient id="blueGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4A90E2" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#6BA3E8" stopOpacity="0.2"/>
                  </linearGradient>
                  <linearGradient id="blueGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5BA3D4" stopOpacity="0.35"/>
                    <stop offset="100%" stopColor="#7BB8E0" stopOpacity="0.15"/>
                  </linearGradient>
                  <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4ECDC4" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#6EDDD6" stopOpacity="0.15"/>
                  </linearGradient>
                  <radialGradient id="goldOutline" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#FDB515" stopOpacity="0.6"/>
                    <stop offset="100%" stopColor="#FDB515" stopOpacity="0"/>
                  </radialGradient>
                  
                  {/* Texture patterns */}
                  <pattern id="texture1" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M0,10 Q10,0 20,10 T40,10" stroke="#FFFFFF" strokeWidth="0.5" fill="none" opacity="0.1"/>
                  </pattern>
                </defs>
                
                {/* Organic abstract shapes - Coral red */}
                <ellipse cx="180" cy="80" rx="35" ry="25" fill="url(#coralGrad)" transform="rotate(-15 180 80)"/>
                <path d="M160,90 Q170,70 190,75 Q210,80 200,95 Q190,110 170,105 Q150,100 160,90 Z" fill="url(#coralGrad)" opacity="0.3"/>
                
                {/* Mustard yellow shapes */}
                <ellipse cx="200" cy="60" rx="28" ry="20" fill="url(#mustardGrad)" transform="rotate(25 200 60)"/>
                <path d="M185,50 Q195,40 210,45 Q225,50 215,65 Q205,80 190,75 Q175,70 185,50 Z" fill="url(#mustardGrad)" opacity="0.4"/>
                
                {/* Blue shapes - various shades */}
                <ellipse cx="170" cy="100" rx="30" ry="22" fill="url(#blueGrad1)" transform="rotate(45 170 100)"/>
                <path d="M150,95 Q165,85 180,90 Q195,95 185,110 Q175,125 160,120 Q145,115 150,95 Z" fill="url(#blueGrad2)" opacity="0.35"/>
                <ellipse cx="190" cy="110" rx="25" ry="18" fill="url(#tealGrad)" transform="rotate(-30 190 110)"/>
                
                {/* Additional smaller organic shapes */}
                <ellipse cx="175" cy="70" rx="18" ry="12" fill="url(#blueGrad1)" opacity="0.3" transform="rotate(60 175 70)"/>
                <ellipse cx="195" cy="90" rx="20" ry="15" fill="url(#tealGrad)" opacity="0.25" transform="rotate(-45 195 90)"/>
                
                {/* Hand-drawn style concentric circles/waves in background */}
                <circle cx="210" cy="30" r="15" fill="none" stroke="#1C3A5E" strokeWidth="1.5" opacity="0.2"/>
                <circle cx="210" cy="30" r="22" fill="none" stroke="#1C3A5E" strokeWidth="1" opacity="0.15"/>
                <path d="M220,100 Q230,90 240,100" stroke="#1C3A5E" strokeWidth="2" fill="none" opacity="0.2" strokeLinecap="round"/>
                <path d="M215,105 Q225,95 235,105" stroke="#1C3A5E" strokeWidth="1.5" fill="none" opacity="0.15" strokeLinecap="round"/>
                
                {/* Gold outline/accents */}
                <path d="M165,85 Q175,75 185,80 Q195,85 190,100" stroke="#FDB515" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round"/>
                <ellipse cx="180" cy="95" rx="12" ry="8" fill="none" stroke="#FDB515" strokeWidth="1" opacity="0.3" transform="rotate(20 180 95)"/>
                
                {/* Texture overlay */}
                <rect width="100%" height="100%" fill="url(#texture1)" opacity="0.3"/>
              </svg>
            </div>
            
            {/* Content - Above background */}
            <div className="relative z-10 pb-32">
              {/* Private Section */}
              <div className="px-3 py-2">
                {/* Private Pages */}
                <div className="space-y-0.5">
                  {privatePages.map((item) => renderMenuItem(item, 0))}
                </div>
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

