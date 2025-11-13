'use client'

import { useState, useEffect } from 'react'
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
  PanelLeftClose,
  Search,
  Home,
  FileText,
  Database,
  Share2,
  Bell,
  Send,
  HelpCircle,
  Receipt,
  Cog,
  Store,
  ClipboardCheck,
  Users,
  UserCheck,
  Package,
  Truck,
  ShoppingBag,
  Factory,
  BarChart3,
  LineChart,
  Table,
  Move,
  Box,
  Wrench,
  Inbox,
  FileCheck,
  DollarSign,
  ClipboardList
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
    name: '資料同步狀態',
    href: '/dashboard/ocr-expense/sync-status',
    icon: Database,
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
        name: '建立費用報告',
        href: '/dashboard/ocr-expense',
        icon: Receipt,
      },
      {
        name: '我的費用報告',
        href: '/dashboard/ocr-expense/my-expenses',
        icon: FileText,
      },
      {
        name: '費用報告核准',
        href: '/dashboard/ocr-expense/reviews',
        icon: ClipboardCheck,
      },
    ],
  },
  {
    name: 'POS單據模擬',
    icon: Store,
    children: [
      {
        name: '我的行動POS',
        href: '/dashboard/my-mobile-pos',
        icon: Store,
      },
      {
        name: 'POS交易記錄',
        href: '/dashboard/my-mobile-pos/transactions',
        icon: FileText,
      },
      {
        name: 'POS產品主檔維護',
        href: '/dashboard/my-mobile-pos/products',
        icon: Package,
      },
      {
        name: '門店收貨',
        href: '/dashboard/my-mobile-pos/receiving',
        icon: Inbox,
      },
      {
        name: '門市訂貨',
        href: '/dashboard/my-mobile-pos/ordering',
        icon: ShoppingCart,
      },
      {
        name: '門市對賬',
        href: '/dashboard/my-mobile-pos/reconciliation',
        icon: FileCheck,
      },
      {
        name: '金流管理',
        href: '/dashboard/my-mobile-pos/payment-flow',
        icon: DollarSign,
      },
      {
        name: '門市盤點',
        href: '/dashboard/my-mobile-pos/inventory-check',
        icon: ClipboardList,
      },
    ],
  },
  {
    name: 'HCM單據模擬',
    icon: Users,
    children: [
      {
        name: 'HCM資料檢視',
        href: '/dashboard/hcm',
        icon: Search,
      },
    ],
  },
  {
    name: 'CRM單據模擬',
    icon: UserCheck,
    children: [
      {
        name: 'CRM資料檢視',
        href: '/dashboard/crm',
        icon: Search,
      },
    ],
  },
  {
    name: 'WMS單據模擬',
    icon: Package,
    children: [
      {
        name: 'WMS資料檢視',
        href: '/dashboard/wms',
        icon: Search,
      },
    ],
  },
  {
    name: 'SCM模擬',
    icon: Truck,
    children: [
      {
        name: 'SCM資料檢視',
        href: '/dashboard/scm',
        icon: Search,
      },
    ],
  },
  {
    name: 'EC模擬',
    icon: ShoppingBag,
    children: [
      {
        name: 'EC資料檢視',
        href: '/dashboard/ec',
        icon: Search,
      },
    ],
  },
  {
    name: 'MES模擬',
    icon: Factory,
    children: [
      {
        name: 'MES資料檢視',
        href: '/dashboard/mes',
        icon: Search,
      },
    ],
  },
  {
    name: 'Next.JS工具箱',
    icon: Wrench,
    children: [
      {
        name: '工具箱首頁',
        href: '/dashboard/nextjs-toolbox',
        icon: Wrench,
      },
      {
        name: 'Tremor展示',
        href: '/dashboard/nextjs-toolbox/tremor',
        icon: BarChart3,
      },
      {
        name: 'Recharts 展示',
        href: '/dashboard/nextjs-toolbox/recharts',
        icon: LineChart,
      },
      {
        name: 'TanStack Table展示',
        href: '/dashboard/nextjs-toolbox/tanstack-table',
        icon: Table,
      },
      {
        name: '核心拖拽引擎 - dnd-kit',
        href: '/dashboard/nextjs-toolbox/dnd-kit',
        icon: Move,
      },
      {
        name: '狀態管理 - Zustand',
        href: '/dashboard/nextjs-toolbox/zustand',
        icon: Box,
      },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['NetSuite單據模擬']))

  // 自動展開包含當前路徑的父選單
  useEffect(() => {
    // 檢查是否有子選單的 href 匹配當前路徑
    const hasActiveChild = (item: MenuItem): boolean => {
      if (item.href && pathname.startsWith(item.href)) {
        return true
      }
      if (item.children) {
        return item.children.some(child => hasActiveChild(child))
      }
      return false
    }

    const checkAndExpand = (items: MenuItem[]) => {
      items.forEach(item => {
        if (item.children && hasActiveChild(item)) {
          setExpandedItems(prev => new Set([...prev, item.name]))
        }
      })
    }
    checkAndExpand([...mainNavigation, ...privatePages])
  }, [pathname])

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
    // 精確匹配：只有當 pathname 完全等於 item.href 時才 active
    // 避免 /dashboard 在訪問 /dashboard/xxx 時也被高亮
    const isActive = item.href ? pathname === item.href : false
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.name)
    const indentLevel = level * 20

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleExpand(item.name)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded transition-colors text-sm ${
              isActive 
                ? 'bg-gray-100 dark:bg-[#3a4f5d] text-gray-900 dark:text-white' 
                : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#3a4f5d] hover:text-gray-900 dark:hover:text-white'
            }`}
            style={{ paddingLeft: `${8 + indentLevel}px` }}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-gray-600 dark:text-white flex-shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-gray-600 dark:text-white flex-shrink-0" />
              )}
              <Icon className="w-4 h-4 flex-shrink-0 text-gray-700 dark:text-white" />
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
            ? 'bg-gray-100 dark:bg-[#3a4f5d] text-gray-900 dark:text-white'
            : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#3a4f5d] hover:text-gray-900 dark:hover:text-white'
        }`}
        style={{ paddingLeft: `${8 + indentLevel}px` }}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="w-3.5 h-3.5 flex-shrink-0" /> {/* Spacer for alignment */}
          <Icon className="w-4 h-4 flex-shrink-0 text-gray-700 dark:text-white" />
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
      {/* Sidebar - Light/Dark theme */}
      <div className={`flex flex-col h-screen bg-white dark:bg-[#28363F] text-gray-900 dark:text-white transition-all duration-300 relative ${
        isCollapsed ? 'w-0 overflow-hidden border-0' : 'w-[240px] border-r border-gray-200 dark:border-[#3a4f5d]'
      }`}>
        {/* Sidebar Content */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Section - User & Workspace - Sticky to match header */}
          <div className="sticky top-[6px] z-50 bg-white dark:bg-[#28363F]">
            <div className="flex items-center gap-1 px-6 h-[38px] border-b border-gray-200 dark:border-[#3a4f5d]">
            <div className="flex-shrink-0" style={{ width: '30px', height: '30px', marginLeft: '-16px' }}>
              {/* 亮色模式：綠色 logo */}
              <img
                src="/OC_Logo_Green.png"
                alt="NetSuite交易模擬系統 Logo"
                className="w-full h-full object-contain dark:hidden"
                style={{ width: '30px', height: '30px' }}
              />
              {/* 暗色模式：紅色 logo */}
              <img
                src="/OC_Logo_Red.png"
                alt="NetSuite交易模擬系統 Logo"
                className="w-full h-full object-contain hidden dark:block"
                style={{ width: '48px', height: '48px', marginTop: '-8px' }}
              />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white truncate flex-1" style={{ marginLeft: '-3px' }}>
              NetSuite交易模擬系統
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button 
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#3a4f5d] transition-colors"
              >
                <PanelLeftClose className="w-4 h-4 text-[#28363F] dark:text-white" />
              </button>
            </div>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="px-1.5 py-2 border-b border-gray-200 dark:border-[#3a4f5d]">
            {mainNavigation.map((item) => (
              <div key={item.name}>
                {renderMenuItem(item, 0)}
              </div>
            ))}
          </div>

          {/* Scrollable Content Area with Bottom Decorative Pattern */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative">
            {/* Abstract Background Pattern - Bottom left corner, matching screenshot proportions (enlarged 50%) */}
            <div className="absolute bottom-0 left-0 opacity-60 pointer-events-none" style={{ width: '90px', height: '120px', zIndex: 0 }}>
              <svg 
                width="100%" 
                height="100%" 
                viewBox="0 0 60 80" 
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0"
              >
                <defs>
                  {/* Gradients for translucent organic shapes - matching screenshot */}
                  <linearGradient id="yellowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700" stopOpacity="0.5"/>
                    <stop offset="100%" stopColor="#FFA500" stopOpacity="0.3"/>
                  </linearGradient>
                  <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4A90E2" stopOpacity="0.45"/>
                    <stop offset="100%" stopColor="#6BA3E8" stopOpacity="0.25"/>
                  </linearGradient>
                  <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9B59B6" stopOpacity="0.45"/>
                    <stop offset="100%" stopColor="#BB79D6" stopOpacity="0.25"/>
                  </linearGradient>
                  <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF8C42" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#FFA366" stopOpacity="0.2"/>
                  </linearGradient>
                </defs>
                
                {/* Translucent overlapping ovals clustered in bottom-left corner - matching screenshot */}
                {/* Large golden-yellow oval - center of cluster, slightly above corner */}
                <ellipse cx="35" cy="50" rx="18" ry="14" fill="url(#yellowGrad)" transform="rotate(-15 35 50)"/>
                <ellipse cx="38" cy="45" rx="14" ry="11" fill="url(#yellowGrad)" opacity="0.6" transform="rotate(20 38 45)"/>
                
                {/* Purple oval - overlapping with yellow */}
                <ellipse cx="25" cy="55" rx="16" ry="12" fill="url(#purpleGrad)" transform="rotate(25 25 55)"/>
                <ellipse cx="28" cy="58" rx="13" ry="10" fill="url(#purpleGrad)" opacity="0.5" transform="rotate(-20 28 58)"/>
                
                {/* Blue oval - left side, near bottom */}
                <ellipse cx="20" cy="65" rx="15" ry="11" fill="url(#blueGrad)" transform="rotate(35 20 65)"/>
                <ellipse cx="22" cy="68" rx="12" ry="9" fill="url(#blueGrad)" opacity="0.5" transform="rotate(-25 22 68)"/>
                
                {/* Orange oval - overlapping with others */}
                <ellipse cx="32" cy="60" rx="14" ry="10" fill="url(#orangeGrad)" transform="rotate(50 32 60)"/>
                <ellipse cx="30" cy="62" rx="11" ry="8" fill="url(#orangeGrad)" opacity="0.4" transform="rotate(-30 30 62)"/>
                
                {/* Additional smaller overlapping shapes for depth */}
                <ellipse cx="40" cy="55" rx="10" ry="8" fill="url(#purpleGrad)" opacity="0.4" transform="rotate(45 40 55)"/>
                <ellipse cx="18" cy="60" rx="9" ry="7" fill="url(#blueGrad)" opacity="0.4" transform="rotate(-40 18 60)"/>
              </svg>
            </div>
            
            {/* Content - Above background */}
            <div className="relative z-10">
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
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-[#3a4f5d]">
            <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#3a4f5d] transition-colors">
              <Cog className="w-4 h-4 text-gray-700 dark:text-white" />
            </button>
            <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#3a4f5d] transition-colors">
              <Send className="w-4 h-4 text-gray-700 dark:text-white" />
            </button>
            <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#3a4f5d] transition-colors">
              <Share2 className="w-4 h-4 text-gray-700 dark:text-white" />
            </button>
            <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#3a4f5d] transition-colors">
              <HelpCircle className="w-4 h-4 text-gray-700 dark:text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Collapse Button (shown when sidebar is collapsed) */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed left-0 top-[44px] z-[100] p-2 bg-white dark:bg-[#28363F] border-r border-b border-gray-200 dark:border-[#3a4f5d] text-gray-900 dark:text-white rounded-r-lg hover:bg-gray-100 dark:hover:bg-[#3a4f5d] transition-colors shadow-lg"
          aria-label="顯示側邊欄"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
    </>
  )
}

