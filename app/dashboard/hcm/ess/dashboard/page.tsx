'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, CheckCircle2, DollarSign, Clock, User } from 'lucide-react';
import Link from 'next/link';

/**
 * 員工自助儀表板
 * 員工個人資訊和常用功能入口
 */
export default function ESSDashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">員工自助服務</h1>
        <p className="text-muted-foreground mt-1">
          歡迎回來，張三
        </p>
      </div>

      {/* 快速統計 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月出勤率</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96.5%</div>
            <p className="text-xs text-muted-foreground">較上月 +1.2%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待審批項目</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">請假申請待審批</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月薪資</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">NT$ 55,000</div>
            <p className="text-xs text-muted-foreground">已發放</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">剩餘年假</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8 天</div>
            <p className="text-xs text-muted-foreground">今年剩餘</p>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>常用功能</CardTitle>
            <CardDescription>快速存取常用服務</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/hcm/ess/forms">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                表單申請
              </Button>
            </Link>
            <Link href="/dashboard/hcm/ess/approvals">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                我的審批
              </Button>
            </Link>
            <Link href="/dashboard/hcm/ess/payslip">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                薪資單
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>個人資訊</CardTitle>
            <CardDescription>查看和更新個人資料</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">部門：研發部</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">職位：資深工程師</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">工號：EMP001</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

