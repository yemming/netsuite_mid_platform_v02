'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Filter } from 'lucide-react';

/**
 * 考勤結果頁面
 * 查看和管理員工的出勤記錄
 */
export default function AttendanceResultsPage() {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // TODO: 從 Supabase 獲取考勤資料
  const attendanceRecords = [
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: '張三',
      date: '2024-01-15',
      checkIn: '09:05',
      checkOut: '18:10',
      workHours: 8.5,
      status: '正常',
      lateMinutes: 5,
    },
    {
      id: '2',
      employeeId: 'EMP002',
      employeeName: '李四',
      date: '2024-01-15',
      checkIn: '09:15',
      checkOut: '18:00',
      workHours: 8.25,
      status: '遲到',
      lateMinutes: 15,
    },
    {
      id: '3',
      employeeId: 'EMP003',
      employeeName: '王五',
      date: '2024-01-15',
      checkIn: '-',
      checkOut: '-',
      workHours: 0,
      status: '請假',
      lateMinutes: 0,
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      '正常': 'default',
      '遲到': 'destructive',
      '早退': 'destructive',
      '請假': 'secondary',
      '曠職': 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">考勤結果</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            查看和管理員工的出勤記錄
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          匯出報表
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>考勤記錄</CardTitle>
          <CardDescription>員工出勤詳細記錄</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-48"
              />
              <span className="text-gray-500">至</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-48"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="選擇狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="normal">正常</SelectItem>
                <SelectItem value="late">遲到</SelectItem>
                <SelectItem value="leave">請假</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              篩選
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>員工</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>上班時間</TableHead>
                  <TableHead>下班時間</TableHead>
                  <TableHead>工作時數</TableHead>
                  <TableHead>遲到分鐘</TableHead>
                  <TableHead>狀態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.employeeName}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.checkIn}</TableCell>
                    <TableCell>{record.checkOut}</TableCell>
                    <TableCell>{record.workHours} 小時</TableCell>
                    <TableCell>{record.lateMinutes > 0 ? `${record.lateMinutes} 分鐘` : '-'}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
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

