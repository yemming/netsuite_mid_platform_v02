'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Play, Download, FileText, CheckCircle2, XCircle } from 'lucide-react';

/**
 * 執行薪資頁面
 * 執行薪資計算和發放流程
 */
export default function PayrollRunPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01');
  const [selectedModel, setSelectedModel] = useState('all');

  // TODO: 從 Supabase 獲取薪資執行記錄
  const payrollRuns = [
    {
      id: '1',
      period: '2024-01',
      model: '標準月薪制',
      employeeCount: 45,
      totalAmount: 2250000,
      status: '已完成',
      runDate: '2024-01-25',
      payDate: '2024-01-31',
    },
    {
      id: '2',
      period: '2023-12',
      model: '標準月薪制',
      employeeCount: 45,
      totalAmount: 2250000,
      status: '已完成',
      runDate: '2023-12-25',
      payDate: '2023-12-31',
    },
    {
      id: '3',
      period: '2024-01',
      model: '績效獎金制',
      employeeCount: 20,
      totalAmount: 900000,
      status: '處理中',
      runDate: '2024-01-26',
      payDate: '2024-01-31',
    },
  ];

  const getStatusBadge = (status: string) => {
    if (status === '已完成') {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          已完成
        </Badge>
      );
    } else if (status === '處理中') {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          處理中
        </Badge>
      );
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">執行薪資</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            執行薪資計算和發放流程
          </p>
        </div>
        <Button>
          <Play className="mr-2 h-4 w-4" />
          執行薪資計算
        </Button>
      </div>

      {/* 執行設定 */}
      <Card>
        <CardHeader>
          <CardTitle>薪資執行設定</CardTitle>
          <CardDescription>選擇期間和模型進行薪資計算</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">薪資期間</Label>
              <Input
                id="period"
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">薪酬模型</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇模型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部模型</SelectItem>
                  <SelectItem value="standard">標準月薪制</SelectItem>
                  <SelectItem value="performance">績效獎金制</SelectItem>
                  <SelectItem value="hourly">時薪制</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 執行記錄 */}
      <Card>
        <CardHeader>
          <CardTitle>薪資執行記錄</CardTitle>
          <CardDescription>歷史薪資計算和發放記錄</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>期間</TableHead>
                  <TableHead>模型</TableHead>
                  <TableHead>員工人數</TableHead>
                  <TableHead>總金額</TableHead>
                  <TableHead>執行日期</TableHead>
                  <TableHead>發放日期</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium">{run.period}</TableCell>
                    <TableCell>{run.model}</TableCell>
                    <TableCell>{run.employeeCount} 人</TableCell>
                    <TableCell>NT$ {run.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>{run.runDate}</TableCell>
                    <TableCell>{run.payDate}</TableCell>
                    <TableCell>{getStatusBadge(run.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
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

