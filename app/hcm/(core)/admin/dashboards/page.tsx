'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

/**
 * BI 儀表板主頁面
 * 提供各種數據分析和報表
 */
export default function DashboardsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">BI 儀表板</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          數據分析和業務洞察
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">總覽</TabsTrigger>
          <TabsTrigger value="compensation">薪酬分析</TabsTrigger>
          <TabsTrigger value="attendance">考勤分析</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">總員工人數</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">80</div>
                <p className="text-xs text-muted-foreground">較上月 +3 人</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均出勤率</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">95.2%</div>
                <p className="text-xs text-muted-foreground">較上月 +2.1%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">本月薪資總額</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">NT$ 2.45M</div>
                <p className="text-xs text-muted-foreground">較上月 +5.2%</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
                <CardDescription>常用分析功能</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/hcm/admin/dashboards/compensation">
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    薪酬分析
                  </Button>
                </Link>
                <Link href="/hcm/admin/dashboards/attendance">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    考勤分析
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compensation">
          <Link href="/hcm/admin/dashboards/compensation">
            <Button>前往薪酬分析</Button>
          </Link>
        </TabsContent>

        <TabsContent value="attendance">
          <Link href="/hcm/admin/dashboards/attendance">
            <Button>前往考勤分析</Button>
          </Link>
        </TabsContent>
      </Tabs>
    </div>
  );
}

