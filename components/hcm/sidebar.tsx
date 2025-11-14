'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Clock,
  DollarSign,
  Workflow,
  BarChart3,
  UserCircle,
  UserCheck,
  Briefcase,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    name: '人事管理',
    href: '/hcm/admin/employees',
    icon: Users,
  },
  {
    name: '考勤管理',
    href: '/hcm/admin/attendance',
    icon: Clock,
    children: [
      {
        name: '排班管理',
        href: '/hcm/admin/attendance/scheduling',
        icon: Clock,
      },
      {
        name: '考勤結果',
        href: '/hcm/admin/attendance/results',
        icon: Clock,
      },
      {
        name: '考勤規則',
        href: '/hcm/admin/attendance/rules',
        icon: Clock,
      },
    ],
  },
  {
    name: '薪酬管理',
    href: '/hcm/admin/payroll',
    icon: DollarSign,
    children: [
      {
        name: '薪酬模型',
        href: '/hcm/admin/payroll/models',
        icon: DollarSign,
      },
      {
        name: '執行薪資',
        href: '/hcm/admin/payroll/run',
        icon: DollarSign,
      },
    ],
  },
  {
    name: '流程管理',
    href: '/hcm/admin/workflows',
    icon: Workflow,
  },
  {
    name: 'BI 儀表板',
    href: '/hcm/admin/dashboards',
    icon: BarChart3,
    children: [
      {
        name: '薪酬分析',
        href: '/hcm/admin/dashboards/compensation',
        icon: BarChart3,
      },
      {
        name: '考勤分析',
        href: '/hcm/admin/dashboards/attendance',
        icon: BarChart3,
      },
    ],
  },
  {
    name: '員工自助',
    href: '/hcm/ess/dashboard',
    icon: UserCircle,
  },
  {
    name: '主管自助',
    href: '/hcm/mss/team',
    icon: UserCheck,
  },
  {
    name: '招募管理',
    href: '/hcm/recruitment',
    icon: Briefcase,
    children: [
      {
        name: '職缺管理',
        href: '/hcm/recruitment/requisitions',
        icon: Briefcase,
      },
      {
        name: '候選人',
        href: '/hcm/recruitment/candidates',
        icon: Briefcase,
      },
    ],
  },
];

/**
 * HCM 系統側邊欄元件
 * 提供導航功能，支援多層級選單
 */
export function Sidebar() {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleItem = (href: string) => {
    setOpenItems((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openItems.includes(item.href);
    const active = isActive(item.href);

    return (
      <div key={item.href}>
        <div className="flex items-center">
          <Link
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full',
              active
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
              level > 0 && 'pl-8'
            )}
            onClick={() => hasChildren && toggleItem(item.href)}
          >
            <item.icon className="h-5 w-5" />
            <span className="flex-1">{item.name}</span>
            {hasChildren && (
              <ChevronRight
                className={cn(
                  'h-4 w-4 transition-transform',
                  isOpen && 'transform rotate-90'
                )}
              />
            )}
          </Link>
        </div>
        {hasChildren && isOpen && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* 行動裝置選單按鈕 */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* 側邊欄 */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo 區域 */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                HCM 系統
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                人力資本管理
              </p>
            </div>
          </div>

          {/* 導航選單 */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => renderNavItem(item))}
          </nav>
        </div>

        {/* 行動裝置遮罩 */}
        {mobileOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </aside>
    </>
  );
}

