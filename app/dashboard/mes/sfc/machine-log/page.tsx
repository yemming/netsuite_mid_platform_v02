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
import { Calendar, Search, Plus, Eye, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function MachineLogPage() {
  const [formData, setFormData] = useState({
    group: '',
    workDate: ''
  });

  const [logs] = useState([
    { 
      id: 'LOG001', 
      machineCode: 'F24-01', 
      workDate: '2025-02-10',
      startTime: '08:00',
      endTime: '17:00',
      workHours: 8,
      production: 1250
    },
    { 
      id: 'LOG002', 
      machineCode: 'F24-02', 
      workDate: '2025-02-10',
      startTime: '08:00',
      endTime: '16:00',
      workHours: 7.5,
      production: 980
    }
  ]);

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">機台工作日誌維護</h1>
        </div>
        <p className="text-muted-foreground">
          維護機台工作時間與產能記錄
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
              <Label htmlFor="group">組別</Label>
              <Input
                id="group"
                value={formData.group}
                onChange={(e) => setFormData(prev => ({ ...prev, group: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
                placeholder="例如: 第03區"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workDate">工作日期</Label>
              <Input
                id="workDate"
                type="date"
                value={formData.workDate}
                onChange={(e) => setFormData(prev => ({ ...prev, workDate: e.target.value }))}
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

      {/* 日誌列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>機台工作日誌</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增日誌
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>機台代號</TableHead>
                  <TableHead>工作日期</TableHead>
                  <TableHead>開工時間</TableHead>
                  <TableHead>結束時間</TableHead>
                  <TableHead>工作時數</TableHead>
                  <TableHead>產能</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium">{log.machineCode}</TableCell>
                    <TableCell>{log.workDate}</TableCell>
                    <TableCell>{log.startTime}</TableCell>
                    <TableCell>{log.endTime}</TableCell>
                    <TableCell>{log.workHours} 小時</TableCell>
                    <TableCell>{log.production.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            生產數據
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>生產數據詳情</DialogTitle>
                            <DialogDescription>
                              機台 {log.machineCode} 的生產數據
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>工令條碼</Label>
                              <Input value="WO-2025-001" readOnly className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20" />
                            </div>
                            <div>
                              <Label>產能</Label>
                              <Input value={log.production.toLocaleString()} readOnly className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20" />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
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

