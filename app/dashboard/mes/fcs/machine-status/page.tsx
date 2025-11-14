'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, AlertTriangle, Wrench, CheckCircle2, XCircle } from 'lucide-react';

export default function MachineStatusPage() {
  const [machines] = useState([
    { code: 'DS-01', status: 'running', name: 'DS-01 機台' },
    { code: 'F10-01', status: 'running', name: 'F10-01 機台' },
    { code: 'F24-01', status: 'running', name: 'F24-01 機台' },
    { code: 'F24-02', status: 'maintenance', name: 'F24-02 機台' },
    { code: 'F24-03', status: 'stopped', name: 'F24-03 機台' },
    { code: 'F24-04', status: 'running', name: 'F24-04 機台' },
    { code: 'F24-05', status: 'running', name: 'F24-05 機台' },
    { code: 'F24-06', status: 'maintenance', name: 'F24-06 機台' },
    { code: 'F24-07', status: 'stopped', name: 'F24-07 機台' },
    { code: 'F24-08', status: 'running', name: 'F24-08 機台' },
    { code: 'F24-09', status: 'running', name: 'F24-09 機台' },
    { code: 'F24-10', status: 'running', name: 'F24-10 機台' }
  ]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'running':
        return {
          color: 'bg-green-500',
          borderColor: 'border-green-500',
          textColor: 'text-green-600 dark:text-green-500',
          icon: CheckCircle2,
          label: '生產中'
        };
      case 'maintenance':
        return {
          color: 'bg-yellow-500',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-600 dark:text-yellow-500',
          icon: Wrench,
          label: '維修中'
        };
      case 'stopped':
        return {
          color: 'bg-red-500',
          borderColor: 'border-red-500',
          textColor: 'text-red-600 dark:text-red-500',
          icon: XCircle,
          label: '停機'
        };
      default:
        return {
          color: 'bg-gray-500',
          borderColor: 'border-gray-500',
          textColor: 'text-gray-600 dark:text-gray-500',
          icon: AlertTriangle,
          label: '未知'
        };
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Search className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">機台現況查詢</h1>
        </div>
        <p className="text-muted-foreground">
          即時查詢機台狀態與運行情況
        </p>
      </div>

      {/* 狀態圖例 */}
      <Card>
        <CardHeader>
          <CardTitle>狀態圖例</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm">生產中（運行綠）</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-sm">維修中（維修黃）</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm">停機（異常紅）</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-500"></div>
              <span className="text-sm">未排產（停機灰）</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 機台狀態網格 */}
      <Card>
        <CardHeader>
          <CardTitle>機台狀態總覽</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {machines.map((machine) => {
              const config = getStatusConfig(machine.status);
              const Icon = config.icon;
              return (
                <div
                  key={machine.code}
                  className={`p-4 rounded-md border-2 ${config.borderColor} bg-card hover:bg-accent transition-colors cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
                    <Icon className={`h-4 w-4 ${config.textColor}`} />
                  </div>
                  <div className="font-medium text-foreground mb-1">{machine.code}</div>
                  <div className="text-xs text-muted-foreground">{machine.name}</div>
                  <div className={`text-xs mt-2 ${config.textColor}`}>{config.label}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

