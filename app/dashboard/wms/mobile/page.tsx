'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  ClipboardCheck,
  Warehouse,
  Factory,
  ShoppingCart,
  Truck,
  ArrowRightLeft,
  Home
} from 'lucide-react';
import Link from 'next/link';

/**
 * WMS 手持設備主選單
 * 6.1 畫面: WMS 手持設備主選單 (Page 74)
 * 
 * UI 要求：
 * - 一個觸控式的主選單
 * - 必須包含以下 7 個按鈕，每個按鈕對應一個功能畫面：
 *   1. 收料作業 (廠商送料)
 *   2. QC 檢驗
 *   3. 理貨上櫃 (驗收入庫)
 *   4. 完工入庫 (生產入庫)
 *   5. 生產撿料
 *   6. 出貨撿料
 *   7. 廠庫調撥
 */
export default function WMSMobileMainMenuPage() {
  const menuItems = [
    {
      id: 'receiving',
      title: '收料作業',
      subtitle: '廠商送料',
      icon: Package,
      href: '/dashboard/wms/mobile/receiving',
      color: 'bg-blue-500 hover:bg-blue-600',
      iconColor: 'text-blue-500'
    },
    {
      id: 'qc-inspection',
      title: 'QC 檢驗',
      subtitle: '品質檢驗',
      icon: ClipboardCheck,
      href: '/dashboard/wms/mobile/qc-inspection',
      color: 'bg-green-500 hover:bg-green-600',
      iconColor: 'text-green-500'
    },
    {
      id: 'putaway',
      title: '理貨上櫃',
      subtitle: '驗收入庫',
      icon: Warehouse,
      href: '/dashboard/wms/mobile/putaway',
      color: 'bg-purple-500 hover:bg-purple-600',
      iconColor: 'text-purple-500'
    },
    {
      id: 'production-in',
      title: '完工入庫',
      subtitle: '生產入庫',
      icon: Factory,
      href: '/dashboard/wms/mobile/production-in',
      color: 'bg-orange-500 hover:bg-orange-600',
      iconColor: 'text-orange-500'
    },
    {
      id: 'production-picking',
      title: '生產撿料',
      subtitle: '生產領料',
      icon: ShoppingCart,
      href: '/dashboard/wms/mobile/production-picking',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      iconColor: 'text-yellow-500'
    },
    {
      id: 'outbound-picking',
      title: '出貨撿料',
      subtitle: '出貨領料',
      icon: Truck,
      href: '/dashboard/wms/mobile/outbound-picking',
      color: 'bg-red-500 hover:bg-red-600',
      iconColor: 'text-red-500'
    },
    {
      id: 'transfer',
      title: '廠庫調撥',
      subtitle: '庫位調撥',
      icon: ArrowRightLeft,
      href: '/dashboard/wms/mobile/transfer',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      iconColor: 'text-indigo-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] p-4">
      <div className="max-w-4xl mx-auto">
        {/* 標題列 */}
        <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-700 rounded-lg px-6 py-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WMS 手持設備主選單</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">智慧倉儲管理系統</p>
              </div>
            </div>
            <Link href="/dashboard/wms">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                返回
              </Button>
            </Link>
          </div>
        </div>

        {/* 主選單 - 觸控式大按鈕 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.id} href={item.href}>
                <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-95 dark:bg-[#1a2332] dark:border-gray-700 h-full">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center text-center space-y-4 min-h-[180px]">
                      <div className={`p-6 rounded-full ${item.color} shadow-lg`}>
                        <Icon className="h-12 w-12 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* 底部說明 */}
        <Card className="mt-6 dark:bg-[#1a2332] dark:border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              💡 提示：點擊上方功能按鈕進入對應作業畫面
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
