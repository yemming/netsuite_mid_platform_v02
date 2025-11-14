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
import { Search, Printer, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function MoldStatusQueryPage() {
  const [queryData, setQueryData] = useState({
    moldCode: '',
    status: ''
  });

  const [molds] = useState([
    { 
      id: 'MOLD001', 
      moldCode: 'MOLD-001', 
      moldName: '產品A模具',
      status: '使用中',
      location: '第03區',
      lastMaintenanceDate: '2025-01-15',
      usageCount: 1250
    },
    { 
      id: 'MOLD002', 
      moldCode: 'MOLD-002', 
      moldName: '產品B模具',
      status: '維修中',
      location: '維修區',
      lastMaintenanceDate: '2025-02-01',
      usageCount: 890
    }
  ]);

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Search className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">模具狀況/交易明細查詢</h1>
        </div>
        <p className="text-muted-foreground">
          查詢模具狀況與交易明細
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
              <Label htmlFor="moldCode">模具代號</Label>
              <Input
                id="moldCode"
                value={queryData.moldCode}
                onChange={(e) => setQueryData(prev => ({ ...prev, moldCode: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="例如: MOLD-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">狀態</Label>
              <Input
                id="status"
                value={queryData.status}
                onChange={(e) => setQueryData(prev => ({ ...prev, status: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="例如: 使用中"
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

      {/* 查詢結果 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>查詢結果</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                列印
              </Button>
              <Button variant="outline" size="sm">
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>模具代號</TableHead>
                  <TableHead>模具名稱</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>位置</TableHead>
                  <TableHead>最後保養日期</TableHead>
                  <TableHead>使用次數</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {molds.map((mold) => (
                  <TableRow key={mold.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium">{mold.moldCode}</TableCell>
                    <TableCell>{mold.moldName}</TableCell>
                    <TableCell>
                      <span className={mold.status === '使用中' ? 'text-green-600 dark:text-green-500' : 'text-yellow-600 dark:text-yellow-500'}>
                        {mold.status}
                      </span>
                    </TableCell>
                    <TableCell>{mold.location}</TableCell>
                    <TableCell>{mold.lastMaintenanceDate}</TableCell>
                    <TableCell>{mold.usageCount.toLocaleString()}</TableCell>
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

