'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Edit, Trash2 } from 'lucide-react';

/**
 * 排班管理頁面
 * 管理員工的工作排班和班表
 */
export default function SchedulingPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // TODO: 從 Supabase 獲取排班資料
  const schedules = [
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: '張三',
      date: '2024-01-15',
      shift: '早班',
      startTime: '09:00',
      endTime: '18:00',
      status: '已確認',
    },
    {
      id: '2',
      employeeId: 'EMP002',
      employeeName: '李四',
      date: '2024-01-15',
      shift: '中班',
      startTime: '13:00',
      endTime: '22:00',
      status: '待確認',
    },
    {
      id: '3',
      employeeId: 'EMP003',
      employeeName: '王五',
      date: '2024-01-15',
      shift: '晚班',
      startTime: '18:00',
      endTime: '02:00',
      status: '已確認',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      '已確認': 'default',
      '待確認': 'secondary',
      '已取消': 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">排班管理</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            管理員工的工作排班和班表
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新增排班
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>排班清單</CardTitle>
          <CardDescription>查看和管理員工排班</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-48"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="選擇班別" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部班別</SelectItem>
                <SelectItem value="morning">早班</SelectItem>
                <SelectItem value="afternoon">中班</SelectItem>
                <SelectItem value="night">晚班</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>員工</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>班別</TableHead>
                  <TableHead>上班時間</TableHead>
                  <TableHead>下班時間</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.employeeName}</TableCell>
                    <TableCell>{schedule.date}</TableCell>
                    <TableCell>{schedule.shift}</TableCell>
                    <TableCell>{schedule.startTime}</TableCell>
                    <TableCell>{schedule.endTime}</TableCell>
                    <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
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

