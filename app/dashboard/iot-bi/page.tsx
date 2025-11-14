'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Gauge, 
  Grid3x3,
  Monitor,
  TrendingUp,
  AlertTriangle,
  Activity,
  Eye,
  Radio,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export default function IoTBIDashboardPage() {
  const [stats] = useState({
    totalMachines: 150,
    runningMachines: 120,
    alertMachines: 5,
    offlineMachines: 25,
    overallEfficiency: 87.5,
    dataPoints: 1250000
  });

  const dashboards = [
    {
      title: '工廠可視化 Kanban',
      description: '即時監控工廠生產狀態，包含 Gauge Chart、KPI Card 和 Bar Chart',
      icon: Monitor,
      href: '/dashboard/iot-bi/kanban',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: '高階主管應用看板',
      description: '高階主管決策支援看板，支援下鑽功能查看詳細資訊',
      icon: BarChart3,
      href: '/dashboard/iot-bi/executive',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: '現場輪播看板',
      description: '現場大螢幕輪播看板，自動顯示機台狀態和異常警示',
      icon: Grid3x3,
      href: '/dashboard/iot-bi/carousel',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Radio className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">IoT & BI 戰情室</h1>
        </div>
        <p className="text-muted-foreground">
          即時監控、數據分析與決策支援平台
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總機台數</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalMachines}</div>
            <p className="text-xs text-muted-foreground mt-1">
              全廠機台總數
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">運轉中</CardTitle>
            <Gauge className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.runningMachines}</div>
            <p className="text-xs text-muted-foreground mt-1">
              稼動率 {((stats.runningMachines / stats.totalMachines) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">異常機台</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.alertMachines}</div>
            <p className="text-xs text-muted-foreground mt-1">
              需要立即處理
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">整體效率</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.overallEfficiency}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              目標: 90%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Cards */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">BI 儀表板</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dashboards.map((dashboard) => {
            const Icon = dashboard.icon;
            return (
              <Link key={dashboard.href} href={dashboard.href}>
                <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-3 rounded-lg ${dashboard.bgColor} ${dashboard.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{dashboard.title}</CardTitle>
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      {dashboard.description}
                    </CardDescription>
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
            <Zap className="h-5 w-5" />
            系統狀態
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium">IoT 資料採集</p>
                <p className="text-xs text-muted-foreground">正常運作中</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium">Supabase 連線</p>
                <p className="text-xs text-muted-foreground">即時同步中</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium">資料點數</p>
                <p className="text-xs text-muted-foreground">{stats.dataPoints.toLocaleString()} 筆</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

