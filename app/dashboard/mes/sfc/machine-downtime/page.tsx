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
import { Settings, Search, Plus, Save } from 'lucide-react';

export default function MachineDowntimePage() {
  const [formData, setFormData] = useState({
    occurrenceDate: '',
    group: ''
  });

  const [downtimeRecords] = useState([
    { 
      id: 'DT001', 
      machineCode: 'F24-01', 
      occurrenceDate: '2025-02-10',
      startTime: '10:30',
      endTime: '11:15',
      downtimeCategory: '設備故障',
      downtimeReason: '馬達過熱'
    },
    { 
      id: 'DT002', 
      machineCode: 'F24-02', 
      occurrenceDate: '2025-02-10',
      startTime: '14:00',
      endTime: '15:30',
      downtimeCategory: '保養維修',
      downtimeReason: '定期保養'
    }
  ]);

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">機台改停機維護</h1>
        </div>
        <p className="text-muted-foreground">
          記錄機台停機時間、類別與原因
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
              <Label htmlFor="occurrenceDate">發生日期</Label>
              <Input
                id="occurrenceDate"
                type="date"
                value={formData.occurrenceDate}
                onChange={(e) => setFormData(prev => ({ ...prev, occurrenceDate: e.target.value }))}
                className="bg-[#FFFFE0] dark:bg-[#FFFFE0]/20 border-input"
              />
            </div>
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
            <div className="flex items-end">
              <Button className="w-full">
                <Search className="h-4 w-4 mr-2" />
                查詢
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 停機記錄列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>停機記錄</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增記錄
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>機台代號</TableHead>
                  <TableHead>發生日期</TableHead>
                  <TableHead>開始時間</TableHead>
                  <TableHead>結束時間</TableHead>
                  <TableHead>停機類別</TableHead>
                  <TableHead>停機原因</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {downtimeRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium">{record.machineCode}</TableCell>
                    <TableCell>{record.occurrenceDate}</TableCell>
                    <TableCell>{record.startTime}</TableCell>
                    <TableCell>{record.endTime}</TableCell>
                    <TableCell>{record.downtimeCategory}</TableCell>
                    <TableCell>{record.downtimeReason}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        編輯
                      </Button>
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

