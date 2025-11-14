'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Factory, 
  Calendar, 
  ClipboardList, 
  Settings, 
  BarChart3,
  Wrench,
  CheckSquare,
  Gauge,
  TrendingUp,
  AlertTriangle,
  Clock,
  Package
} from 'lucide-react';
import Link from 'next/link';

export default function MESDashboardPage() {
  const [stats] = useState({
    activeMachines: 24,
    runningMachines: 18,
    maintenanceMachines: 3,
    stoppedMachines: 3,
    todayProduction: 1250,
    efficiency: 87.5,
    qualityRate: 98.2,
    onTimeDelivery: 94.5
  });

  const quickActions = [
    {
      title: '有限產能排程',
      description: 'FCS 排程管理',
      icon: Calendar,
      href: '/dashboard/mes/fcs',
      color: 'text-purple-500'
    },
    {
      title: '現場報工',
      description: 'SFC 報工登錄',
      icon: ClipboardList,
      href: '/dashboard/mes/sfc',
      color: 'text-blue-500'
    },
    {
      title: '模具管理',
      description: '模具資料維護',
      icon: Wrench,
      href: '/dashboard/mes/mold',
      color: 'text-orange-500'
    },
    {
      title: '品質檢驗',
      description: 'QC 檢驗管理',
      icon: CheckSquare,
      href: '/dashboard/mes/qc',
      color: 'text-green-500'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Page Header - NetSuite Next UI Style */}
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Factory className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">製造執行系統 (MES)</h1>
        </div>
        <p className="text-muted-foreground">
          生產排程、現場報工、模具管理與品質檢驗整合平台
        </p>
      </div>

      {/* KPI Cards - NetSuite Next UI Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">運轉中機台</CardTitle>
            <Gauge className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.runningMachines}/{stats.activeMachines}</div>
            <p className="text-xs text-muted-foreground mt-1">
              稼動率 {((stats.runningMachines / stats.activeMachines) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日產量</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.todayProduction.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              較昨日 +5.2%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">生產效率</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.efficiency}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              目標: 90%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">品質合格率</CardTitle>
            <CheckSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.qualityRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              目標: 98%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">維修中</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.maintenanceMachines}</div>
            <p className="text-xs text-muted-foreground mt-1">機台維修中</p>
          </CardContent>
        </Card>

        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">停機</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.stoppedMachines}</div>
            <p className="text-xs text-muted-foreground mt-1">機台停機中</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">準時交貨率</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.onTimeDelivery}%</div>
            <p className="text-xs text-muted-foreground mt-1">本月累計</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">快速功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
    </div>
  );
}
