'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Play, Search } from 'lucide-react';
import Link from 'next/link';

/**
 * 流程管理頁面
 * 管理各種業務流程和工作流
 */
export default function WorkflowsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // TODO: 從 Supabase 獲取流程資料
  const workflows = [
    {
      id: '1',
      name: '請假申請流程',
      description: '員工請假申請審批流程',
      category: '人事',
      status: '啟用',
      version: 'v1.0',
      lastModified: '2024-01-15',
    },
    {
      id: '2',
      name: '加班申請流程',
      description: '員工加班申請審批流程',
      category: '人事',
      status: '啟用',
      version: 'v1.0',
      lastModified: '2024-01-10',
    },
    {
      id: '3',
      name: '薪資異動流程',
      description: '員工薪資調整審批流程',
      category: '薪酬',
      status: '啟用',
      version: 'v2.0',
      lastModified: '2024-01-20',
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">流程管理</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            管理各種業務流程和工作流
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新增流程
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>流程清單</CardTitle>
          <CardDescription>管理所有業務流程</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="搜尋流程名稱、類別..."
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
                  <TableHead>流程名稱</TableHead>
                  <TableHead>說明</TableHead>
                  <TableHead>類別</TableHead>
                  <TableHead>版本</TableHead>
                  <TableHead>最後修改</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell className="font-medium">{workflow.name}</TableCell>
                    <TableCell>{workflow.description}</TableCell>
                    <TableCell>{workflow.category}</TableCell>
                    <TableCell>{workflow.version}</TableCell>
                    <TableCell>{workflow.lastModified}</TableCell>
                    <TableCell>{getStatusBadge(workflow.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/hcm/admin/workflows/designer/${workflow.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm">
                          <Play className="h-4 w-4" />
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

