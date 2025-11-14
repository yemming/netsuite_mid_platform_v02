'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package, Search, Plus, Truck, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ShipmentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    poNumber: '',
    shipmentDate: '',
    carrier: '',
    trackingNumber: ''
  });

  const [shipments] = useState([
    {
      id: 'ASN001',
      asnNumber: 'ASN-2025-001',
      poNumber: 'PO-2025-001',
      itemName: '產品A',
      quantity: 1000,
      shipmentDate: '2025-02-20',
      expectedArrivalDate: '2025-02-22',
      carrier: '物流公司A',
      trackingNumber: 'TRK001234567',
      status: 'pending'
    },
    {
      id: 'ASN002',
      asnNumber: 'ASN-2025-002',
      poNumber: 'PO-2025-002',
      itemName: '產品B',
      quantity: 500,
      shipmentDate: '2025-02-18',
      expectedArrivalDate: '2025-02-20',
      carrier: '物流公司B',
      trackingNumber: 'TRK002345678',
      status: 'shipped'
    },
    {
      id: 'ASN003',
      asnNumber: 'ASN-2025-003',
      poNumber: 'PO-2025-003',
      itemName: '產品C',
      quantity: 800,
      shipmentDate: '',
      expectedArrivalDate: '2025-02-25',
      carrier: '',
      trackingNumber: '',
      status: 'not_created'
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_created':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">未建立</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">待出貨</Badge>;
      case 'shipped':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">已出貨</Badge>;
      case 'delivered':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">已送達</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredShipments = shipments.filter(shipment =>
    shipment.asnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shipment.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shipment.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateASN = () => {
    // TODO: 實作建立出貨通知邏輯
    alert('出貨通知已建立');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">出貨作業</h1>
        </div>
        <p className="text-muted-foreground">
          建立出貨通知 (ASN) 與追蹤出貨狀態
        </p>
      </div>

      {/* 建立出貨通知表單 */}
      <Card>
        <CardHeader>
          <CardTitle>建立出貨通知 (ASN)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="poNumber">採購單號</Label>
              <Input
                id="poNumber"
                value={formData.poNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="例如: PO-2025-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipmentDate">出貨日期</Label>
              <Input
                id="shipmentDate"
                type="date"
                value={formData.shipmentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, shipmentDate: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carrier">物流公司</Label>
              <Input
                id="carrier"
                value={formData.carrier}
                onChange={(e) => setFormData(prev => ({ ...prev, carrier: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="例如: 物流公司A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trackingNumber">追蹤號碼</Label>
              <Input
                id="trackingNumber"
                value={formData.trackingNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="例如: TRK001234567"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <Button onClick={handleCreateASN}>
              <Plus className="h-4 w-4 mr-2" />
              建立出貨通知
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              列印出貨單
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 出貨通知清單 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>出貨通知清單</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋出貨通知..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>出貨通知號</TableHead>
                  <TableHead>採購單號</TableHead>
                  <TableHead>料品名稱</TableHead>
                  <TableHead>數量</TableHead>
                  <TableHead>出貨日期</TableHead>
                  <TableHead>預計到貨日</TableHead>
                  <TableHead>物流公司</TableHead>
                  <TableHead>追蹤號碼</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => (
                  <TableRow key={shipment.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium">{shipment.asnNumber}</TableCell>
                    <TableCell>{shipment.poNumber}</TableCell>
                    <TableCell>{shipment.itemName}</TableCell>
                    <TableCell>{shipment.quantity.toLocaleString()}</TableCell>
                    <TableCell>
                      {shipment.shipmentDate || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{shipment.expectedArrivalDate}</TableCell>
                    <TableCell>
                      {shipment.carrier || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {shipment.trackingNumber || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {shipment.status === 'not_created' && (
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            建立
                          </Button>
                        )}
                        {shipment.status === 'shipped' && (
                          <Button variant="ghost" size="sm">
                            <Truck className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

