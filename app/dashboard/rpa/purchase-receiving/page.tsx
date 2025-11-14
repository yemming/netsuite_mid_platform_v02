'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  QrCode, 
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  Package,
  Scan,
  ArrowRight,
  Download,
  Upload
} from 'lucide-react';

/**
 * 採購收料 QR Code 應用流程
 * 8.1 流程: 採購收料 QR Code 應用 (n8n Workflow)
 * 
 * 流程說明：
 * 1. 供應商寄送出貨單 PDF 到指定信箱
 * 2. n8n 自動解析 PDF，比對採購單
 * 3. 驗證通過後產生 QR Code 並回傳給供應商
 * 4. 供應商送貨時，倉管人員掃描 QR Code 進行收料
 */
export default function PurchaseReceivingRPAPage() {
  const [workflowStatus] = useState<'active' | 'inactive'>('active');
  const [recentShipments] = useState([
    {
      id: 'SH-2024-001',
      supplier: 'ABC 公司',
      poNumber: 'PO-2024-001',
      status: 'pending',
      receivedAt: '2024-01-15 14:30:25',
      items: [
        { itemCode: 'ITEM-001', quantity: 100, received: 0 },
        { itemCode: 'ITEM-002', quantity: 50, received: 0 }
      ]
    },
    {
      id: 'SH-2024-002',
      supplier: 'XYZ 公司',
      poNumber: 'PO-2024-002',
      status: 'received',
      receivedAt: '2024-01-15 10:15:30',
      items: [
        { itemCode: 'ITEM-003', quantity: 200, received: 200 }
      ]
    }
  ]);

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <QrCode className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">採購收料 QR Code 應用</h1>
        </div>
        <p className="text-muted-foreground">
          自動化處理供應商送貨單，產生 QR Code 並整合 WMS 收料流程
        </p>
      </div>

      {/* Workflow Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                流程狀態
              </CardTitle>
              <CardDescription className="mt-1">
                n8n 自動化流程監控
              </CardDescription>
            </div>
            <div className={`px-4 py-2 rounded-lg ${
              workflowStatus === 'active' 
                ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
            }`}>
              {workflowStatus === 'active' ? '運行中' : '已停止'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 流程步驟說明 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-start gap-3 p-4 border border-border rounded-lg">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">步驟 1</h3>
                  <p className="text-sm text-muted-foreground">供應商寄送 PDF</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border border-border rounded-lg">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">步驟 2</h3>
                  <p className="text-sm text-muted-foreground">n8n 解析與驗證</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border border-border rounded-lg">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <QrCode className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">步驟 3</h3>
                  <p className="text-sm text-muted-foreground">產生 QR Code</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border border-border rounded-lg">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Scan className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">步驟 4</h3>
                  <p className="text-sm text-muted-foreground">WMS 掃描收料</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Shipments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            待收料清單
          </CardTitle>
          <CardDescription>
            等待收料的送貨單列表
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentShipments.map((shipment) => (
              <div
                key={shipment.id}
                className="p-4 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-foreground">送貨單號: {shipment.id}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        shipment.status === 'pending' 
                          ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' 
                          : 'bg-green-500/20 text-green-600 dark:text-green-400'
                      }`}>
                        {shipment.status === 'pending' ? '待收料' : '已收料'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">供應商: {shipment.supplier}</p>
                    <p className="text-sm text-muted-foreground">採購單號: {shipment.poNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">建立時間</p>
                    <p className="text-sm text-foreground">{shipment.receivedAt}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">送貨明細:</p>
                  <div className="space-y-1">
                    {shipment.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                        <span className="text-foreground">{item.itemCode}</span>
                        <span className="text-muted-foreground">
                          數量: {item.received > 0 ? `${item.received}/${item.quantity}` : item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {shipment.status === 'pending' && (
                  <div className="mt-4 flex items-center gap-2">
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Scan className="h-4 w-4" />
                      掃描 QR Code 收料
                    </Button>
                    <Button size="sm" variant="ghost" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      下載 QR Code PDF
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            整合說明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h3 className="font-medium text-foreground mb-2">與 WMS 整合</h3>
              <p className="text-muted-foreground">
                此流程與 WMS 手持設備 App 整合。倉管人員可在 WMS 行動裝置中掃描 QR Code，
                系統會自動帶出送貨明細，完成收料作業後直接更新庫存。
              </p>
            </div>
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <h3 className="font-medium text-foreground mb-2">n8n 自動化流程</h3>
              <p className="text-muted-foreground">
                此流程由 n8n 自動化平台執行，包含：郵件監聽、PDF 解析、資料驗證、
                QR Code 產生、PDF 生成與郵件回傳等功能。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

