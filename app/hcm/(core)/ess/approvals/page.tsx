'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

/**
 * 我的審批頁面
 * 員工查看需要審批的項目
 */
export default function ESSApprovalsPage() {
  // TODO: 從 Supabase 獲取審批記錄
  const approvals = [
    {
      id: '1',
      applicant: '李四',
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
      applicant: '王五',
      type: '加班',
      startDate: '2024-01-18',
      endDate: '2024-01-18',
      days: 1,
      reason: '專案趕工',
      status: '待審批',
      submitDate: '2024-01-17',
    },
  ];

  const getStatusBadge = (status: string) => {
    if (status === '待審批') {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          待審批
        </Badge>
      );
    } else if (status === '已通過') {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          已通過
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          已拒絕
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">我的審批</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          查看需要審批的項目
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>待審批項目</CardTitle>
          <CardDescription>需要您審批的申請項目</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>申請人</TableHead>
                  <TableHead>申請類型</TableHead>
                  <TableHead>開始日期</TableHead>
                  <TableHead>結束日期</TableHead>
                  <TableHead>天數</TableHead>
                  <TableHead>原因</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell className="font-medium">{approval.applicant}</TableCell>
                    <TableCell>{approval.type}</TableCell>
                    <TableCell>{approval.startDate}</TableCell>
                    <TableCell>{approval.endDate}</TableCell>
                    <TableCell>{approval.days} 天</TableCell>
                    <TableCell>{approval.reason}</TableCell>
                    <TableCell>{getStatusBadge(approval.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                          <XCircle className="h-4 w-4" />
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

