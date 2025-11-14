'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  QrCode, 
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Package,
  Scan
} from 'lucide-react';
import Link from 'next/link';

/**
 * RPA 流程機器人主頁面
 * 8.0 RPA 流程機器人 (自動化)
 */
export default function RPADashboardPage() {
  const [workflows] = useState([
    {
      id: 'purchase-receiving-qr',
      title: '採購收料 QR Code 應用',
      description: '自動化處理供應商送貨單，產生 QR Code 並回傳給供應商',
      status: 'active',
      icon: QrCode,
      href: '/dashboard/rpa/purchase-receiving',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    }
  ]);

  const [recentActivities] = useState([
    {
      id: 1,
      workflow: '採購收料 QR Code 應用',
      action: 'QR Code 產生',
      status: 'success',
      timestamp: '2024-01-15 14:30:25',
      details: 'Shipment ID: SH-2024-001'
    },
    {
      id: 2,
      workflow: '採購收料 QR Code 應用',
      action: 'PDF 解析',
      status: 'success',
      timestamp: '2024-01-15 14:28:10',
      details: '供應商: ABC 公司'
    },
    {
      id: 3,
      workflow: '採購收料 QR Code 應用',
      action: '資料驗證',
      status: 'failed',
      timestamp: '2024-01-15 14:25:05',
      details: '數量不符：送貨 150 件，採購單 100 件'
    }
  ]);

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Bot className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">RPA 流程機器人</h1>
        </div>
        <p className="text-muted-foreground">
          自動化流程管理與監控平台
        </p>
      </div>

      {/* Workflow Cards */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">自動化流程</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => {
            const Icon = workflow.icon;
            return (
              <Link key={workflow.id} href={workflow.href}>
                <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-3 rounded-lg ${workflow.bgColor} ${workflow.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{workflow.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            workflow.status === 'active' 
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                              : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                          }`}>
                            {workflow.status === 'active' ? '運行中' : '已停止'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      {workflow.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            最近活動
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <div className={`p-2 rounded-full ${
                  activity.status === 'success' 
                    ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                    : 'bg-red-500/20 text-red-600 dark:text-red-400'
                }`}>
                  {activity.status === 'success' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{activity.workflow}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{activity.action}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.details}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              n8n 連線狀態
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-foreground">正常運作</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              郵件監聽
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-foreground">監聽中</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              待處理訂單
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">3</div>
            <p className="text-xs text-muted-foreground mt-1">等待處理</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

