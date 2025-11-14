'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Inbox,
  Warehouse,
  ShoppingCart,
  Smartphone,
  Settings,
  TrendingUp,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

/**
 * WMS 倉儲管理系統主頁面
 * 6.0 WMS 倉儲管理系統 (手腳)
 */
export default function WMSDashboardPage() {
  const [stats] = useState({
    inventoryAccuracy: 99.2,
    totalLocations: 1500,
    activeTasks: 12,
    completedToday: 45
  });

  const quickActions = [
    {
      title: '收貨作業',
      description: '廠商送料收貨',
      icon: Inbox,
      href: '/dashboard/wms/receiving',
      color: 'text-blue-500'
    },
    {
      title: '儲存管理',
      description: '庫位管理與查詢',
      icon: Warehouse,
      href: '/dashboard/wms/storage',
      color: 'text-purple-500'
    },
    {
      title: '出貨作業',
      description: '出貨撿料與出庫',
      icon: ShoppingCart,
      href: '/dashboard/wms/fulfilment',
      color: 'text-green-500'
    },
    {
      title: '手持設備主選單',
      description: 'PDA/手機作業介面',
      icon: Smartphone,
      href: '/dashboard/wms/mobile',
      color: 'text-orange-500'
    },
    {
      title: 'WMS 後台設定',
      description: '條碼設計與 WiFi 管理',
      icon: Settings,
      href: '/dashboard/wms/settings',
      color: 'text-gray-500'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">WMS 倉儲管理系統</h1>
        </div>
        <p className="text-muted-foreground">
          智慧倉儲管理系統 - 手持 PDA (或手機) 的 Next.js PWA 應用
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">庫存即時正確性</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.inventoryAccuracy}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              目標: &gt; 99%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總儲位數</CardTitle>
            <Warehouse className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalLocations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              已配置儲位
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">進行中任務</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.activeTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              待處理作業
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日完成</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              已完成作業數
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">快速功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md bg-muted ${action.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{action.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {action.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            系統狀態
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium">手持設備連線</p>
                <p className="text-xs text-muted-foreground">正常運作中</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium">條碼掃描系統</p>
                <p className="text-xs text-muted-foreground">正常運作中</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium">庫存同步</p>
                <p className="text-xs text-muted-foreground">即時更新中</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
