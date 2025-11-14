'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

/**
 * 職缺管理頁面
 * 管理招聘職缺
 */
export default function RequisitionsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // TODO: 從 Supabase 獲取職缺資料
  const requisitions = [
    {
      id: '1',
      title: '資深前端工程師',
      department: '研發部',
      status: '開放中',
      candidates: 5,
      priority: '高',
      publishDate: '2024-01-10',
    },
    {
      id: '2',
      title: '業務經理',
      department: '業務部',
      status: '開放中',
      candidates: 3,
      priority: '中',
      publishDate: '2024-01-15',
    },
    {
      id: '3',
      title: '人事專員',
      department: '人事部',
      status: '已關閉',
      candidates: 0,
      priority: '低',
      publishDate: '2023-12-20',
    },
  ];

  const getStatusBadge = (status: string) => {
    return status === '開放中' ? (
      <Badge variant="default">開放中</Badge>
    ) : (
      <Badge variant="secondary">已關閉</Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      '高': 'destructive',
      '中': 'default',
      '低': 'secondary',
    };
    return <Badge variant={variants[priority] || 'outline'}>{priority}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">職缺管理</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            管理招聘職缺
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新增職缺
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>職缺清單</CardTitle>
          <CardDescription>管理所有招聘職缺</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="搜尋職缺名稱、部門..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>職缺名稱</TableHead>
                  <TableHead>部門</TableHead>
                  <TableHead>優先級</TableHead>
                  <TableHead>候選人數</TableHead>
                  <TableHead>發布日期</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requisitions.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.title}</TableCell>
                    <TableCell>{req.department}</TableCell>
                    <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                    <TableCell>{req.candidates} 人</TableCell>
                    <TableCell>{req.publishDate}</TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
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

