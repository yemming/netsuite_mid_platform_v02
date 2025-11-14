'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar, Clock } from 'lucide-react';

/**
 * 表單申請頁面
 * 員工提交各種申請表單（請假、加班等）
 */
export default function ESSFormsPage() {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('leave');

  // TODO: 從 Supabase 獲取申請記錄
  const applications = [
    {
      id: '1',
      type: '請假',
      startDate: '2024-01-20',
      endDate: '2024-01-22',
      days: 3,
      reason: '年假',
      status: '待審批',
      submitDate: '2024-01-15',
    },
    {
      id: '2',
      type: '加班',
      startDate: '2024-01-18',
      endDate: '2024-01-18',
      days: 1,
      reason: '專案趕工',
      status: '已通過',
      submitDate: '2024-01-17',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      '待審批': 'secondary',
      '已通過': 'default',
      '已拒絕': 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">表單申請</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            提交請假、加班等申請表單
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          新增申請
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>新增申請</CardTitle>
            <CardDescription>選擇申請類型並填寫相關資訊</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="formType">申請類型</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leave">請假</SelectItem>
                  <SelectItem value="overtime">加班</SelectItem>
                  <SelectItem value="business">出差</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">開始日期</Label>
                <Input id="startDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">結束日期</Label>
                <Input id="endDate" type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">申請原因</Label>
              <Textarea id="reason" placeholder="請說明申請原因..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                取消
              </Button>
              <Button>提交申請</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>申請記錄</CardTitle>
          <CardDescription>查看所有申請記錄和狀態</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>申請類型</TableHead>
                  <TableHead>開始日期</TableHead>
                  <TableHead>結束日期</TableHead>
                  <TableHead>天數</TableHead>
                  <TableHead>原因</TableHead>
                  <TableHead>提交日期</TableHead>
                  <TableHead>狀態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.type}</TableCell>
                    <TableCell>{app.startDate}</TableCell>
                    <TableCell>{app.endDate}</TableCell>
                    <TableCell>{app.days} 天</TableCell>
                    <TableCell>{app.reason}</TableCell>
                    <TableCell>{app.submitDate}</TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
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

