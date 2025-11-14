'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save } from 'lucide-react';

/**
 * 考勤規則頁面
 * 設定和管理考勤相關規則
 */
export default function AttendanceRulesPage() {
  const [isEditing, setIsEditing] = useState(false);

  // TODO: 從 Supabase 獲取考勤規則
  const rules = [
    {
      id: '1',
      name: '標準工作時間',
      workStartTime: '09:00',
      workEndTime: '18:00',
      lateThreshold: 15,
      earlyLeaveThreshold: 15,
      status: '啟用',
    },
    {
      id: '2',
      name: '彈性工作時間',
      workStartTime: '08:00',
      workEndTime: '17:00',
      lateThreshold: 30,
      earlyLeaveThreshold: 30,
      status: '啟用',
    },
  ];

  const getStatusBadge = (status: string) => {
    return status === '啟用' ? (
      <Badge variant="default">啟用</Badge>
    ) : (
      <Badge variant="secondary">停用</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">考勤規則</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            設定和管理考勤相關規則
          </p>
        </div>
        <Button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              儲存
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              新增規則
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>考勤規則清單</CardTitle>
          <CardDescription>管理各種考勤規則設定</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>規則名稱</TableHead>
                  <TableHead>上班時間</TableHead>
                  <TableHead>下班時間</TableHead>
                  <TableHead>遲到閾值（分鐘）</TableHead>
                  <TableHead>早退閾值（分鐘）</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{rule.workStartTime}</TableCell>
                    <TableCell>{rule.workEndTime}</TableCell>
                    <TableCell>{rule.lateThreshold}</TableCell>
                    <TableCell>{rule.earlyLeaveThreshold}</TableCell>
                    <TableCell>{getStatusBadge(rule.status)}</TableCell>
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

