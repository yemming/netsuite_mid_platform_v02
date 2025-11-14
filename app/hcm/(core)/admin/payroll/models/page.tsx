'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Copy } from 'lucide-react';

/**
 * 薪酬模型頁面
 * 管理各種薪酬計算模型
 */
export default function PayrollModelsPage() {
  // TODO: 從 Supabase 獲取薪酬模型資料
  const models = [
    {
      id: '1',
      name: '標準月薪制',
      description: '固定月薪，適用於一般員工',
      baseSalary: 50000,
      status: '啟用',
      employeeCount: 45,
    },
    {
      id: '2',
      name: '績效獎金制',
      description: '基本薪資 + 績效獎金',
      baseSalary: 45000,
      status: '啟用',
      employeeCount: 20,
    },
    {
      id: '3',
      name: '時薪制',
      description: '按工作時數計算',
      baseSalary: 200,
      status: '啟用',
      employeeCount: 15,
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">薪酬模型</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            管理各種薪酬計算模型
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新增模型
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>薪酬模型清單</CardTitle>
          <CardDescription>管理各種薪酬計算規則</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>模型名稱</TableHead>
                  <TableHead>說明</TableHead>
                  <TableHead>基本薪資</TableHead>
                  <TableHead>適用員工數</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell>{model.description}</TableCell>
                    <TableCell>NT$ {model.baseSalary.toLocaleString()}</TableCell>
                    <TableCell>{model.employeeCount} 人</TableCell>
                    <TableCell>{getStatusBadge(model.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Copy className="h-4 w-4" />
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

