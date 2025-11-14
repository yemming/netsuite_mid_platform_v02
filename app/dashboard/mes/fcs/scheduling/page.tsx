'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Search, Calendar, CheckCircle2 } from 'lucide-react';

export default function SchedulingPage() {
  const [filterData, setFilterData] = useState({
    orderNumber: '',
    expectedShipDate: ''
  });

  const [selectedWorkOrder, setSelectedWorkOrder] = useState<string | null>(null);

  const [workOrders] = useState([
    { 
      id: 'WO001', 
      orderNumber: 'SO-2025-001', 
      workOrderNumber: 'WO-2025-001',
      expectedShipDate: '2025-02-15',
      itemCode: 'ITEM-001',
      itemName: '產品A',
      quantity: 1000,
      confirmed: false
    },
    { 
      id: 'WO002', 
      orderNumber: 'SO-2025-002', 
      workOrderNumber: 'WO-2025-002',
      expectedShipDate: '2025-02-20',
      itemCode: 'ITEM-002',
      itemName: '產品B',
      quantity: 500,
      confirmed: true
    }
  ]);

  const [processDetails] = useState([
    { id: 'PD001', workOrderId: 'WO001', sequence: 1, processName: '備料', machineCode: 'F24-01', estimatedHours: 4 },
    { id: 'PD002', workOrderId: 'WO001', sequence: 2, processName: '加工', machineCode: 'F24-02', estimatedHours: 8 },
    { id: 'PD003', workOrderId: 'WO001', sequence: 3, processName: '組裝', machineCode: 'DS-01', estimatedHours: 6 }
  ]);

  const filteredWorkOrders = workOrders.filter(wo =>
    (!filterData.orderNumber || wo.orderNumber.includes(filterData.orderNumber)) &&
    (!filterData.expectedShipDate || wo.expectedShipDate === filterData.expectedShipDate)
  );

  const selectedProcessDetails = selectedWorkOrder
    ? processDetails.filter(pd => pd.workOrderId === selectedWorkOrder)
    : [];

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">製令單轉排程規劃</h1>
        </div>
        <p className="text-muted-foreground">
          將製令單轉換為排程規劃，並查看製程明細
        </p>
      </div>

      {/* 查詢條件 */}
      <Card>
        <CardHeader>
          <CardTitle>查詢條件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">訂單號碼</Label>
              <Input
                id="orderNumber"
                value={filterData.orderNumber}
                onChange={(e) => setFilterData(prev => ({ ...prev, orderNumber: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="例如: SO-2025-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedShipDate">預計出貨日</Label>
              <Input
                id="expectedShipDate"
                type="date"
                value={filterData.expectedShipDate}
                onChange={(e) => setFilterData(prev => ({ ...prev, expectedShipDate: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <Search className="h-4 w-4 mr-2" />
                查詢
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 主表：製令單清單 */}
        <Card>
          <CardHeader>
            <CardTitle>製令單清單</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>工令單號</TableHead>
                    <TableHead>訂單號碼</TableHead>
                    <TableHead>料號</TableHead>
                    <TableHead>數量</TableHead>
                    <TableHead>確認否</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkOrders.map((wo) => (
                    <TableRow 
                      key={wo.id} 
                      className={`cursor-pointer hover:bg-accent/50 ${selectedWorkOrder === wo.id ? 'bg-accent' : ''}`}
                      onClick={() => setSelectedWorkOrder(wo.id)}
                    >
                      <TableCell>
                        <Checkbox checked={wo.confirmed} />
                      </TableCell>
                      <TableCell className="font-medium">{wo.workOrderNumber}</TableCell>
                      <TableCell>{wo.orderNumber}</TableCell>
                      <TableCell>{wo.itemCode}</TableCell>
                      <TableCell>{wo.quantity.toLocaleString()}</TableCell>
                      <TableCell>
                        {wo.confirmed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <span className="text-muted-foreground">未確認</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 從表：製程明細 */}
        <Card>
          <CardHeader>
            <CardTitle>製程明細</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedWorkOrder ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>序號</TableHead>
                      <TableHead>製程名稱</TableHead>
                      <TableHead>機台代號</TableHead>
                      <TableHead>預估工時</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProcessDetails.map((detail) => (
                      <TableRow key={detail.id} className="hover:bg-accent/50">
                        <TableCell>{detail.sequence}</TableCell>
                        <TableCell>{detail.processName}</TableCell>
                        <TableCell>{detail.machineCode}</TableCell>
                        <TableCell>{detail.estimatedHours} 小時</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>請選擇上方的製令單以查看製程明細</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

