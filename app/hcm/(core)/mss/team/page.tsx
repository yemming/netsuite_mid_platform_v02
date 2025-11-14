'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, User, Clock, Calendar } from 'lucide-react';

/**
 * 主管自助 - 團隊管理頁面
 * 主管查看和管理團隊成員
 */
export default function MSSTeamPage() {
  // TODO: 從 Supabase 獲取團隊資料
  const teamMembers = [
    {
      id: '1',
      name: '張三',
      employeeId: 'EMP001',
      position: '資深工程師',
      status: '在職',
      attendanceRate: 96.5,
      pendingApprovals: 2,
    },
    {
      id: '2',
      name: '李四',
      employeeId: 'EMP002',
      position: '工程師',
      status: '在職',
      attendanceRate: 94.2,
      pendingApprovals: 1,
    },
    {
      id: '3',
      name: '王五',
      employeeId: 'EMP003',
      position: '助理工程師',
      status: '在職',
      attendanceRate: 95.8,
      pendingApprovals: 0,
    },
  ];

  const getStatusBadge = (status: string) => {
    return status === '在職' ? (
      <Badge variant="default">在職</Badge>
    ) : (
      <Badge variant="secondary">離職</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">團隊管理</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          查看和管理您的團隊成員
        </p>
      </div>

      {/* 團隊統計 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">團隊人數</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">在職成員</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均出勤率</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(teamMembers.reduce((sum, m) => sum + m.attendanceRate, 0) / teamMembers.length).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">本月平均</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待審批項目</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.reduce((sum, m) => sum + m.pendingApprovals, 0)}
            </div>
            <p className="text-xs text-muted-foreground">需要審批</p>
          </CardContent>
        </Card>
      </div>

      {/* 團隊成員列表 */}
      <Card>
        <CardHeader>
          <CardTitle>團隊成員</CardTitle>
          <CardDescription>查看團隊成員的詳細資訊</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="搜尋團隊成員..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>工號</TableHead>
                  <TableHead>職位</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>出勤率</TableHead>
                  <TableHead>待審批</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.employeeId}</TableCell>
                    <TableCell>{member.position}</TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell>{member.attendanceRate}%</TableCell>
                    <TableCell>
                      {member.pendingApprovals > 0 ? (
                        <Badge variant="secondary">{member.pendingApprovals} 項</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        查看詳情
                      </Button>
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

