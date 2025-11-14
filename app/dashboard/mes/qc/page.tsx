'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Settings, FileCheck } from 'lucide-react';
import Link from 'next/link';

export default function QCPage() {
  const qcModules = [
    {
      title: '料品檢驗標準資料建立',
      description: '建立料品檢驗標準與檢驗項目',
      href: '/dashboard/mes/qc/standards',
      icon: Settings
    },
    {
      title: '各類檢驗資料維護/審核',
      description: '維護與審核各類檢驗資料',
      href: '/dashboard/mes/qc/inspections',
      icon: FileCheck
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CheckSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">品質檢驗 (QC)</h1>
        </div>
        <p className="text-muted-foreground">
          檢驗標準建立與檢驗資料管理
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {qcModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted text-green-500">
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

