'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Settings, Search, Plus, FileText } from 'lucide-react';
import Link from 'next/link';

export default function FCSPage() {
  const fcsModules = [
    {
      title: '資源型態維護',
      description: '維護資源型態代號與名稱',
      href: '/dashboard/mes/fcs/resource-types',
      icon: Settings
    },
    {
      title: '資源資料維護',
      description: '維護機台、人員等資源資料',
      href: '/dashboard/mes/fcs/resources',
      icon: Settings
    },
    {
      title: '機台行事曆維護',
      description: '設定機台工作時數與產能',
      href: '/dashboard/mes/fcs/machine-calendar',
      icon: Calendar
    },
    {
      title: '製令單轉排程規劃',
      description: '將製令單轉換為排程規劃',
      href: '/dashboard/mes/fcs/scheduling',
      icon: FileText
    },
    {
      title: '工單機台生產順序設定',
      description: '調整工單在機台上的生產順序',
      href: '/dashboard/mes/fcs/work-order-sequence',
      icon: Settings
    },
    {
      title: '需求規劃處理',
      description: '執行需求規劃與排程計算',
      href: '/dashboard/mes/fcs/demand-planning',
      icon: Calendar
    },
    {
      title: '生管令單/現場令單調整',
      description: '調整生管令單與現場令單',
      href: '/dashboard/mes/fcs/work-order-adjustment',
      icon: Settings
    },
    {
      title: '機台現況查詢',
      description: '查詢機台即時狀態',
      href: '/dashboard/mes/fcs/machine-status',
      icon: Search
    },
    {
      title: '機台排程狀況查詢',
      description: '查詢機台排程甘特圖',
      href: '/dashboard/mes/fcs/schedule-status',
      icon: Search
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">有限產能排程 (FCS)</h1>
        </div>
        <p className="text-muted-foreground">
          資源管理、排程規劃與機台狀態監控
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fcsModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted text-purple-500">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{module.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {module.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

