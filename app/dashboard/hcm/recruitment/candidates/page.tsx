'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, User } from 'lucide-react';

/**
 * 候選人頁面
 * 管理招聘候選人
 */
export default function CandidatesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // TODO: 從 Supabase 獲取候選人資料
  const candidates = [
    {
      id: '1',
      name: '陳小明',
      position: '資深前端工程師',
      status: '待面試',
      experience: '5 年',
      education: '大學',
      applyDate: '2024-01-12',
    },
    {
      id: '2',
      name: '林小華',
      position: '業務經理',
      status: '面試中',
      experience: '8 年',
      education: '碩士',
      applyDate: '2024-01-15',
    },
    {
      id: '3',
      name: '黃小美',
      position: '人事專員',
      status: '已錄取',
      experience: '3 年',
      education: '大學',
      applyDate: '2023-12-20',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      '待面試': 'secondary',
      '面試中': 'default',
      '已錄取': 'default',
      '已拒絕': 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">候選人</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            管理招聘候選人
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新增候選人
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>候選人清單</CardTitle>
          <CardDescription>管理所有候選人資訊</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="搜尋候選人姓名、職位..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="選擇狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="pending">待面試</SelectItem>
                <SelectItem value="interviewing">面試中</SelectItem>
                <SelectItem value="accepted">已錄取</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>應徵職位</TableHead>
                  <TableHead>工作經驗</TableHead>
                  <TableHead>學歷</TableHead>
                  <TableHead>應徵日期</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium">{candidate.name}</TableCell>
                    <TableCell>{candidate.position}</TableCell>
                    <TableCell>{candidate.experience}</TableCell>
                    <TableCell>{candidate.education}</TableCell>
                    <TableCell>{candidate.applyDate}</TableCell>
                    <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <User className="h-4 w-4" />
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

