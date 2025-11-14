'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Download, Upload } from 'lucide-react';
import Link from 'next/link';

/**
 * 人事管理主頁面
 * 顯示員工清單，支援搜尋、新增、編輯、刪除等功能
 */
export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // TODO: 從 Supabase 獲取員工資料
  const employees = [
    {
      id: '1',
      employeeId: 'EMP001',
      name: '張三',
      department: '研發部',
      position: '資深工程師',
      status: '在職',
      email: 'zhang.san@company.com',
      phone: '0912-345-678',
      joinDate: '2023-01-15',
    },
    {
      id: '2',
      employeeId: 'EMP002',
      name: '李四',
      department: '業務部',
      position: '業務經理',
      status: '在職',
      email: 'li.si@company.com',
      phone: '0912-345-679',
      joinDate: '2022-06-20',
    },
    {
      id: '3',
      employeeId: 'EMP003',
      name: '王五',
      department: '人事部',
      position: '人事專員',
      status: '在職',
      email: 'wang.wu@company.com',
      phone: '0912-345-680',
      joinDate: '2023-03-10',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      '在職': 'default',
      '離職': 'destructive',
      '留停': 'secondary',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>{status}</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">人事管理</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            管理員工基本資料、組織架構和人事異動
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            匯入
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            匯出
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            新增員工
          </Button>
        </div>
      </div>

      {/* 搜尋和篩選 */}
      <Card>
        <CardHeader>
          <CardTitle>員工清單</CardTitle>
          <CardDescription>搜尋和管理所有員工資料</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="搜尋員工姓名、工號、部門..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* 員工表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>工號</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>部門</TableHead>
                  <TableHead>職位</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>電子郵件</TableHead>
                  <TableHead>到職日</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.employeeId}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.joinDate}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/hcm/admin/employees/${employee.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
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

