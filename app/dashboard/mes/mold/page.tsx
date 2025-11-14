'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Settings, Search } from 'lucide-react';
import Link from 'next/link';

export default function MoldPage() {
  const moldModules = [
    {
      title: '模具基本資料維護',
      description: '維護模具代號、名稱、規格等基本資料',
      href: '/dashboard/mes/mold/basic-data',
      icon: Settings
    },
    {
      title: '模具狀況/交易明細查詢',
      description: '查詢模具狀況與交易明細',
      href: '/dashboard/mes/mold/status-query',
      icon: Search
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Wrench className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">模具管理</h1>
        </div>
        <p className="text-muted-foreground">
          模具基本資料維護與狀況查詢
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {moldModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted text-orange-500">
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

