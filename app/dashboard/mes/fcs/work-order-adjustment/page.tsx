'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Settings, Scissors, Trash2, Plus, Save } from 'lucide-react';

export default function WorkOrderAdjustmentPage() {
  const [workOrders] = useState([
    { 
      id: 'WO001', 
      workOrderNumber: 'WO-2025-001', 
      itemName: '產品A', 
      quantity: 1000,
      machineCode: 'F24-01',
      startDate: '2025-02-10',
      endDate: '2025-02-15',
      status: '已排程'
    },
    { 
      id: 'WO002', 
      workOrderNumber: 'WO-2025-002', 
      itemName: '產品B', 
      quantity: 500,
      machineCode: 'F24-02',
      startDate: '2025-02-12',
      endDate: '2025-02-18',
      status: '已排程'
    },
    { 
      id: 'WO003', 
      workOrderNumber: 'WO-2025-003', 
      itemName: '產品C', 
      quantity: 800,
      machineCode: 'DS-01',
      startDate: '2025-02-15',
      endDate: '2025-02-20',
      status: '已排程'
    }
  ]);

  const handleCut = (id: string) => {
    // TODO: 實作剪下功能
    alert(`剪下工單: ${id}`);
  };

  const handleDelete = (id: string) => {
    // TODO: 實作刪除功能
    if (confirm('確定要刪除此工單嗎？')) {
      alert(`刪除工單: ${id}`);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">生管令單/現場令單調整</h1>
        </div>
        <p className="text-muted-foreground">
          調整生管令單與現場令單，支援插單與順序調整
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>工單清單</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                新增工單
              </Button>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                儲存變更
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>工令單號</TableHead>
                  <TableHead>料品名稱</TableHead>
                  <TableHead>數量</TableHead>
                  <TableHead>機台代號</TableHead>
                  <TableHead>開始日期</TableHead>
                  <TableHead>結束日期</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.map((wo) => (
                  <TableRow key={wo.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium">{wo.workOrderNumber}</TableCell>
                    <TableCell>{wo.itemName}</TableCell>
                    <TableCell>{wo.quantity.toLocaleString()}</TableCell>
                    <TableCell>{wo.machineCode}</TableCell>
                    <TableCell>{wo.startDate}</TableCell>
                    <TableCell>{wo.endDate}</TableCell>
                    <TableCell>
                      <span className="text-green-600 dark:text-green-500">{wo.status}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCut(wo.id)}
                          title="剪下"
                        >
                          <Scissors className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(wo.id)}
                          title="刪除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

