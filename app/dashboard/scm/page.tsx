'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  FileText, 
  ShoppingCart, 
  DollarSign,
  MessageSquare,
  Package,
  Receipt,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function SCMPage() {
  const [stats] = useState({
    pendingQuotes: 5,
    activePOs: 12,
    pendingShipments: 8,
    pendingPayments: 3,
    totalPOValue: 1250000,
    overdueShipments: 2
  });

  const modules = [
    {
      title: '詢報價作業',
      description: '管理詢價單與報價單',
      href: '/dashboard/scm/quotes',
      icon: MessageSquare,
      color: 'text-blue-500',
      stats: `${stats.pendingQuotes} 筆待處理`
    },
    {
      title: '採購委外作業',
      description: '查看與管理採購單',
      href: '/dashboard/scm/purchase-orders',
      icon: ShoppingCart,
      color: 'text-green-500',
      stats: `${stats.activePOs} 筆進行中`
    },
    {
      title: '出貨作業',
      description: '出貨通知與管理',
      href: '/dashboard/scm/shipments',
      icon: Package,
      color: 'text-orange-500',
      stats: `${stats.pendingShipments} 筆待出貨`
    },
    {
      title: '帳務作業',
      description: '發票與帳款管理',
      href: '/dashboard/scm/accounting',
      icon: Receipt,
      color: 'text-purple-500',
      stats: `${stats.pendingPayments} 筆待付款`
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Page Header - NetSuite Next UI Style */}
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Truck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">供應鏈管理系統 (SCM)</h1>
        </div>
        <p className="text-muted-foreground">
          供應商入口網站 - 詢報價、採購、出貨與帳務管理
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待處理詢價</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.pendingQuotes}</div>
            <p className="text-xs text-muted-foreground mt-1">筆待回覆</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">進行中採購單</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.activePOs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              總金額 {stats.totalPOValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待出貨</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.pendingShipments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.overdueShipments > 0 && (
                <span className="text-red-500">{stats.overdueShipments} 筆逾期</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待付款</CardTitle>
            <Receipt className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground mt-1">筆待處理</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Modules */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">主要功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.href} href={module.href}>
                <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-3 rounded-md bg-muted ${module.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{module.stats}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>最近活動</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">採購單 PO-2025-001 已確認交期</p>
                <p className="text-xs text-muted-foreground">2 小時前</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">詢價單 RFQ-2025-003 待回覆</p>
                <p className="text-xs text-muted-foreground">5 小時前</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
              <Package className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">出貨通知 ASN-2025-002 已建立</p>
                <p className="text-xs text-muted-foreground">1 天前</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
