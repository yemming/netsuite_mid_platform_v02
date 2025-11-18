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
  ClipboardList,
  Warehouse,
  Smartphone,
  HardHat,
  Hammer,
  Clock,
  ArrowRightLeft,
  Calendar,
  MessageSquare,
  Radio,
  Bot,
  QrCode,
  Monitor,
  Grid3x3,
  TrendingUp,
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
    icon: Search,
  },
]

const privatePages: MenuItem[] = [
  {
    name: 'NetSuite',
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
    name: '收銀/自助點餐結帳系統',
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
      {
        name: 'POS設定',
        href: '/dashboard/my-mobile-pos/settings',
        icon: Cog,
      },
    ],
  },
  {
    name: '人資管理系統',
    icon: Users,
    children: [
      {
        name: 'BI 儀表板',
        href: '/dashboard/hcm/admin/dashboards',
        icon: BarChart3,
      },
      {
        name: '人事管理',
        href: '/dashboard/hcm/admin/employees',
        icon: Users,
      },
      {
        name: '考勤管理',
        href: '/dashboard/hcm/admin/attendance',
        icon: Clock,
      },
      {
        name: '薪酬管理',
        href: '/dashboard/hcm/admin/payroll',
        icon: DollarSign,
      },
      {
        name: '流程管理',
        href: '/dashboard/hcm/admin/workflows',
        icon: FileCheck,
      },
      {
        name: '員工自助',
        href: '/dashboard/hcm/ess/dashboard',
        icon: UserCheck,
      },
      {
        name: '主管自助',
        href: '/dashboard/hcm/mss/team',
        icon: UserCheck,
      },
      {
        name: '招募管理',
        href: '/dashboard/hcm/recruitment',
        icon: ClipboardList,
      },
    ],
  },
  {
    name: '客戶管理系統',
    icon: UserCheck,
    children: [
      {
        name: 'BD追蹤系統',
        href: '/dashboard/crm',
        icon: Search,
      },
      {
        name: '商機看板',
        href: '/dashboard/crm/opportunities',
        icon: LayoutDashboard,
      },
      {
        name: '客戶管理',
        href: '/dashboard/crm/accounts',
        icon: Users,
      },
      {
        name: '報價單管理',
        href: '/dashboard/crm/quotes',
        icon: FileText,
      },
      {
        name: '訂單管理',
        href: '/dashboard/crm/orders',
        icon: ShoppingCart,
      },
    ],
  },
  {
    name: '倉儲管理系統',
    icon: Package,
    children: [
      {
        name: '收貨作業',
        href: '/dashboard/wms/receiving',
        icon: Inbox,
      },
      {
        name: '儲存管理',
        href: '/dashboard/wms/storage',
        icon: Warehouse,
      },
      {
        name: '出貨作業',
        href: '/dashboard/wms/fulfilment',
        icon: ShoppingCart,
      },
    ],
  },
  {
    name: '製造執行系統',
    icon: Factory,
    children: [
      {
        name: 'MES 儀表板',
        href: '/dashboard/mes',
        icon: LayoutDashboard,
      },
      {
        name: '有限產能排程 (FCS)',
        icon: Calendar,
        children: [
          {
            name: 'FCS 總覽',
            href: '/dashboard/mes/fcs',
            icon: Calendar,
          },
          {
            name: '資源型態維護',
            href: '/dashboard/mes/fcs/resource-types',
            icon: Settings,
          },
          {
            name: '資源資料維護',
            href: '/dashboard/mes/fcs/resources',
            icon: Settings,
          },
          {
            name: '機台行事曆維護',
            href: '/dashboard/mes/fcs/machine-calendar',
            icon: Calendar,
          },
          {
            name: '製令單轉排程規劃',
            href: '/dashboard/mes/fcs/scheduling',
            icon: FileText,
          },
          {
            name: '工單機台生產順序設定',
            href: '/dashboard/mes/fcs/work-order-sequence',
            icon: Settings,
          },
          {
            name: '需求規劃處理',
            href: '/dashboard/mes/fcs/demand-planning',
            icon: Calendar,
          },
          {
            name: '生管令單/現場令單調整',
            href: '/dashboard/mes/fcs/work-order-adjustment',
            icon: Settings,
          },
          {
            name: '機台現況查詢',
            href: '/dashboard/mes/fcs/machine-status',
            icon: Search,
          },
          {
            name: '機台排程狀況查詢',
            href: '/dashboard/mes/fcs/schedule-status',
            icon: Search,
          },
        ],
      },
      {
        name: '現場報工 (SFC)',
        icon: ClipboardList,
        children: [
          {
            name: 'SFC 總覽',
            href: '/dashboard/mes/sfc',
            icon: ClipboardList,
          },
          {
            name: '機台工作日誌維護',
            href: '/dashboard/mes/sfc/machine-log',
            icon: Calendar,
          },
          {
            name: '機台改停機維護',
            href: '/dashboard/mes/sfc/machine-downtime',
            icon: Settings,
          },
          {
            name: '現場報工登錄',
            href: '/dashboard/mes/sfc/work-report',
            icon: ClipboardList,
          },
          {
            name: '現場檢驗登錄',
            href: '/dashboard/mes/sfc/inspection-log',
            icon: ClipboardCheck,
          },
        ],
      },
      {
        name: '模具管理',
        icon: Wrench,
        children: [
          {
            name: '模具管理總覽',
            href: '/dashboard/mes/mold',
            icon: Wrench,
          },
          {
            name: '模具基本資料維護',
            href: '/dashboard/mes/mold/basic-data',
            icon: Settings,
          },
          {
            name: '模具狀況/交易明細查詢',
            href: '/dashboard/mes/mold/status-query',
            icon: Search,
          },
        ],
      },
      {
        name: '品質檢驗 (QC)',
        icon: ClipboardCheck,
        children: [
          {
            name: 'QC 總覽',
            href: '/dashboard/mes/qc',
            icon: ClipboardCheck,
          },
          {
            name: '料品檢驗標準資料建立',
            href: '/dashboard/mes/qc/standards',
            icon: Settings,
          },
          {
            name: '各類檢驗資料維護/審核',
            href: '/dashboard/mes/qc/inspections',
            icon: FileCheck,
          },
        ],
      },
      {
        name: 'WMS 手持設備',
        icon: Smartphone,
        children: [
          {
            name: 'WMS 手持設備主選單',
            href: '/dashboard/wms/mobile',
            icon: Smartphone,
          },
          {
            name: 'WMS 後台設定',
            href: '/dashboard/wms/settings',
            icon: Settings,
          },
        ],
      },
      {
        name: 'IoT & BI 戰情室',
        icon: Radio,
        children: [
          {
            name: 'IoT & BI 儀表板',
            href: '/dashboard/iot-bi',
            icon: Radio,
          },
          {
            name: '工廠可視化 Kanban',
            href: '/dashboard/iot-bi/kanban',
            icon: Monitor,
          },
          {
            name: '高階主管應用看板',
            href: '/dashboard/iot-bi/executive',
            icon: BarChart3,
          },
          {
            name: '現場輪播看板',
            href: '/dashboard/iot-bi/carousel',
            icon: Grid3x3,
          },
        ],
      },
      {
        name: 'RPA 流程機器人',
        icon: Bot,
        children: [
          {
            name: 'RPA 儀表板',
            href: '/dashboard/rpa',
            icon: Bot,
          },
          {
            name: '採購收料 QR Code',
            href: '/dashboard/rpa/purchase-receiving',
            icon: QrCode,
          },
        ],
      },
      {
        name: '供應鏈管理系統',
        icon: Truck,
        children: [
          {
            name: 'SCM 儀表板',
            href: '/dashboard/scm',
            icon: LayoutDashboard,
          },
          {
            name: '詢報價作業',
            href: '/dashboard/scm/quotes',
            icon: MessageSquare,
          },
          {
            name: '採購委外作業',
            href: '/dashboard/scm/purchase-orders',
            icon: ShoppingCart,
          },
          {
            name: '出貨作業',
            href: '/dashboard/scm/shipments',
            icon: Package,
          },
          {
            name: '帳務作業',
            href: '/dashboard/scm/accounting',
            icon: Receipt,
          },
        ],
      },
      {
        name: 'O9 需求規劃平台',
        icon: TrendingUp,
        children: [
          {
            name: 'O9 探索性數據分析 (EDA)',
            href: '/dashboard/scm/eda',
            icon: TrendingUp,
          },
          {
            name: 'O9 預測分析駕駛艙',
            href: '/dashboard/scm/forecast-analysis',
            icon: BarChart3,
          },
          {
            name: 'O9 需求假設與預測層',
            href: '/dashboard/scm/demand-assumptions',
            icon: FileText,
          },
        ],
      },
    ],
  },
  {
    name: '現場維運管理系統',
    icon: HardHat,
    children: [
      {
        name: '客戶管理',
        href: '/dashboard/field-operations/customers',
        icon: Users,
      },
      {
        name: '建立工單',
        href: '/dashboard/field-operations/create-work-order',
        icon: ClipboardList,
      },
      {
        name: '排程與調度',
        href: '/dashboard/field-operations/dispatch',
        icon: LayoutDashboard,
      },
      {
        name: '行動現場服務',
        href: '/dashboard/field-operations/mobile',
        icon: Smartphone,
      },
      {
        name: '後勤管理',
        icon: Cog,
        children: [
          {
            name: '人員管理',
            href: '/dashboard/field-operations/admin/personnel',
            icon: Users,
          },
          {
            name: '料件管理',
            href: '/dashboard/field-operations/admin/inventory',
            icon: Package,
          },
          {
            name: '資源管理',
            href: '/dashboard/field-operations/admin/resources',
            icon: Hammer,
          },
          {
            name: '系統參數設定',
            href: '/dashboard/field-operations/admin/system-settings',
            icon: Settings,
          },
        ],
      },
    ],
  },
  {
    name: 'ETL管理工具',
    icon: ArrowRightLeft,
    children: [
      {
        name: '倉庫管理器',
        href: '/dashboard/etl',
        icon: Database,
      },
      {
        name: '數據源管理',
        href: '/dashboard/etl/sources',
        icon: Inbox,
      },
      {
        name: '數據目標設計',
        href: '/dashboard/etl/targets',
        icon: FileCheck,
      },
      {
        name: '映射設計器',
        href: '/dashboard/etl/mappings',
        icon: Share2,
      },
      {
        name: '工作流管理器',
        href: '/dashboard/etl/workflows',
        icon: Cog,
      },
      {
        name: '工作流監視器',
        href: '/dashboard/etl/monitor',
        icon: BarChart3,
      },
    ],
  },
  {
    name: 'NetSuite 資料備份',
    icon: Database,
    children: [
      {
        name: '欄位映射設計',
        href: '/dashboard/field-mapping/design',
        icon: Settings,
      },
      {
        name: '欄位映射管理',
        href: '/dashboard/field-mapping',
        icon: Share2,
      },
      {
        name: 'n8n 同步管理',
        href: '/dashboard/n8n-sync',
        icon: ArrowRightLeft,
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['NetSuite']))

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
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm ${
              isActive 
                ? 'bg-accent text-accent-foreground' 
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            style={{ paddingLeft: `${8 + indentLevel}px` }}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <Icon className="w-4 h-4 flex-shrink-0 text-foreground" />
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
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm ${
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-foreground hover:bg-accent hover:text-accent-foreground'
        }`}
        style={{ paddingLeft: `${8 + indentLevel}px` }}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="w-3.5 h-3.5 flex-shrink-0" /> {/* Spacer for alignment */}
          <Icon className="w-4 h-4 flex-shrink-0 text-foreground" />
          <span className="truncate font-normal">{item.name}</span>
          {item.badge && (
            <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-primary text-primary-foreground rounded-md flex-shrink-0">
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
      {/* Sidebar - NetSuite Next UI Style */}
      <div className={`flex flex-col h-screen bg-card text-foreground transition-all duration-300 relative ${
        isCollapsed ? 'w-0 overflow-hidden border-0' : 'w-[240px] border-r border-border'
      }`}>
        {/* Sidebar Content */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Section - User & Workspace - Sticky to match header */}
          <div className="sticky top-[6px] z-50 bg-white dark:bg-background">
            <div className="flex items-center gap-1 px-6 h-[38px]">
            <div className="flex-shrink-0" style={{ width: '30px', height: '30px', marginLeft: '-16px' }}>
              {/* 亮色模式：綠色 logo */}
              <img
                src="/OC_Logo_Green.png"
                alt="NetSuite交易管理系統 Logo"
                className="w-full h-full object-contain dark:hidden"
                style={{ width: '30px', height: '30px' }}
              />
              {/* 暗色模式：紅色 logo */}
              <img
                src="/OC_Logo_Red.png"
                alt="NetSuite交易管理系統 Logo"
                className="w-full h-full object-contain hidden dark:block"
                style={{ width: '48px', height: '48px', marginTop: '-8px' }}
              />
            </div>
            <span className="text-lg font-bold text-foreground truncate flex-1" style={{ marginLeft: '3px' }}>
              NetSuite交易管理系統
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button 
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-md hover:bg-accent transition-colors"
              >
                <PanelLeftClose className="w-4 h-4 text-foreground" />
              </button>
            </div>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="px-1.5 py-2 border-b border-border">
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
          <div className="flex items-center justify-between px-3 py-2 border-t border-border">
            <button className="p-1.5 rounded-md hover:bg-accent transition-colors">
              <Cog className="w-4 h-4 text-foreground" />
            </button>
            <button className="p-1.5 rounded-md hover:bg-accent transition-colors">
              <Send className="w-4 h-4 text-foreground" />
            </button>
            <button className="p-1.5 rounded-md hover:bg-accent transition-colors">
              <Share2 className="w-4 h-4 text-foreground" />
            </button>
            <Link 
              href="/dashboard/dev/runtime-logs"
              className="p-1.5 rounded-md hover:bg-accent transition-colors"
              title="Runtime Logs"
            >
              <Terminal className="w-4 h-4 text-foreground" />
            </Link>
          </div>
        </div>
      </div>

      {/* Collapse Button (shown when sidebar is collapsed) */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed left-0 top-[44px] z-[100] p-2 bg-card border-r border-b border-border text-foreground rounded-r-md hover:bg-accent transition-colors shadow-lg"
          aria-label="顯示側邊欄"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
    </>
  )
}

