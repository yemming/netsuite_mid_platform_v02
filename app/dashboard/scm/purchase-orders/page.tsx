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
import { ShoppingCart, Search, Eye, Calendar, Save, CheckCircle2 } from 'lucide-react';

export default function PurchaseOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPO, setSelectedPO] = useState<string | null>(null);

  const [purchaseOrders] = useState([
    {
      id: 'PO001',
      poNumber: 'PO-2025-001',
      itemName: '產品A',
      quantity: 1000,
      unitPrice: 125,
      totalAmount: 125000,
      orderDate: '2025-02-10',
      requestedDeliveryDate: '2025-02-25',
      confirmedDeliveryDate: '',
      status: 'approved'
    },
    {
      id: 'PO002',
      poNumber: 'PO-2025-002',
      itemName: '產品B',
      quantity: 500,
      unitPrice: 200,
      totalAmount: 100000,
      orderDate: '2025-02-08',
      requestedDeliveryDate: '2025-02-20',
      confirmedDeliveryDate: '2025-02-22',
      status: 'delivery_confirmed'
    },
    {
      id: 'PO003',
      poNumber: 'PO-2025-003',
      itemName: '產品C',
      quantity: 800,
      unitPrice: 150,
      totalAmount: 120000,
      orderDate: '2025-02-05',
      requestedDeliveryDate: '2025-02-18',
      confirmedDeliveryDate: '',
      status: 'approved'
    }
  ]);

  const [poLineItems] = useState([
    { id: 'PO001', lineNumber: 1, itemCode: 'ITEM-001', itemName: '產品A', quantity: 1000, unitPrice: 125, amount: 125000 },
    { id: 'PO002', lineNumber: 1, itemCode: 'ITEM-002', itemName: '產品B', quantity: 500, unitPrice: 200, amount: 100000 },
    { id: 'PO003', lineNumber: 1, itemCode: 'ITEM-003', itemName: '產品C', quantity: 800, unitPrice: 150, amount: 120000 }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">已核准</Badge>;
      case 'delivery_confirmed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">交期已確認</Badge>;
      case 'shipped':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">已出貨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredPOs = purchaseOrders.filter(po =>
    po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    po.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedLineItems = selectedPO
    ? poLineItems.filter(item => item.id === selectedPO)
    : [];

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">採購委外作業</h1>
        </div>
        <p className="text-muted-foreground">
          查看與管理採購單，確認交期與出貨通知
        </p>
      </div>

      {/* 搜尋 */}
      <Card>
        <CardHeader>
          <CardTitle>採購單清單</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋採購單號或料品名稱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* 採購單表格 */}
          <div className="rounded-md border mb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>採購單號</TableHead>
                  <TableHead>料品名稱</TableHead>
                  <TableHead>數量</TableHead>
                  <TableHead>總金額</TableHead>
                  <TableHead>訂單日期</TableHead>
                  <TableHead>要求交期</TableHead>
                  <TableHead>確認交期</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.map((po) => (
                  <TableRow 
                    key={po.id} 
                    className={`cursor-pointer hover:bg-accent/50 ${selectedPO === po.id ? 'bg-accent' : ''}`}
                    onClick={() => setSelectedPO(po.id)}
                  >
                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                    <TableCell>{po.itemName}</TableCell>
                    <TableCell>{po.quantity.toLocaleString()}</TableCell>
                    <TableCell>NT$ {po.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>{po.orderDate}</TableCell>
                    <TableCell>{po.requestedDeliveryDate}</TableCell>
                    <TableCell>
                      {po.confirmedDeliveryDate || (
                        <span className="text-muted-foreground">未確認</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(po.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 交期確認表單 */}
          {selectedPO && (
            <Card>
              <CardHeader>
                <CardTitle>確認交期</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="confirmedDeliveryDate">確認交期</Label>
                    <Input
                      id="confirmedDeliveryDate"
                      type="date"
                      className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      確認交期
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 採購單明細 */}
          {selectedPO && selectedLineItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>採購單明細</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>行號</TableHead>
                        <TableHead>料號</TableHead>
                        <TableHead>料品名稱</TableHead>
                        <TableHead>數量</TableHead>
                        <TableHead>單價</TableHead>
                        <TableHead>金額</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedLineItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-accent/50">
                          <TableCell>{item.lineNumber}</TableCell>
                          <TableCell>{item.itemCode}</TableCell>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell>{item.quantity.toLocaleString()}</TableCell>
                          <TableCell>NT$ {item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell>NT$ {item.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

