'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Calendar, Settings, CheckSquare } from 'lucide-react';
import Link from 'next/link';

export default function SFCPage() {
  const sfcModules = [
    {
      title: '機台工作日誌維護',
      description: '維護機台工作時間與產能記錄',
      href: '/dashboard/mes/sfc/machine-log',
      icon: Calendar
    },
    {
      title: '機台改停機維護',
      description: '記錄機台停機時間與原因',
      href: '/dashboard/mes/sfc/machine-downtime',
      icon: Settings
    },
    {
      title: '現場報工登錄',
      description: '登錄現場生產報工資料',
      href: '/dashboard/mes/sfc/work-report',
      icon: ClipboardList
    },
    {
      title: '現場檢驗登錄',
      description: '登錄現場品質檢驗資料',
      href: '/dashboard/mes/sfc/inspection-log',
      icon: CheckSquare
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardList className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">現場報工 (SFC)</h1>
        </div>
        <p className="text-muted-foreground">
          機台日誌、報工登錄與現場檢驗管理
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sfcModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted text-blue-500">
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

