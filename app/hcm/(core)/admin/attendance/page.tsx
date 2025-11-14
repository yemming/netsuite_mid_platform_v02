'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Calendar, Settings } from 'lucide-react';
import Link from 'next/link';

/**
 * 考勤管理主頁面
 * 提供考勤相關功能的導航入口
 */
export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">考勤管理</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          管理員工出勤、排班和考勤規則
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">總覽</TabsTrigger>
          <TabsTrigger value="scheduling">排班管理</TabsTrigger>
          <TabsTrigger value="results">考勤結果</TabsTrigger>
          <TabsTrigger value="rules">考勤規則</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">今日出勤率</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">95.2%</div>
                <p className="text-xs text-muted-foreground">較昨日 +2.1%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">遲到人數</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">較昨日 -1</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">請假人數</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">病假 5 人，事假 3 人</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
                <CardDescription>常用考勤管理功能</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/hcm/admin/attendance/scheduling">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    排班管理
                  </Button>
                </Link>
                <Link href="/hcm/admin/attendance/results">
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="mr-2 h-4 w-4" />
                    考勤結果
                  </Button>
                </Link>
                <Link href="/hcm/admin/attendance/rules">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    考勤規則
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scheduling">
          <Link href="/hcm/admin/attendance/scheduling">
            <Button>前往排班管理</Button>
          </Link>
        </TabsContent>

        <TabsContent value="results">
          <Link href="/hcm/admin/attendance/results">
            <Button>前往考勤結果</Button>
          </Link>
        </TabsContent>

        <TabsContent value="rules">
          <Link href="/hcm/admin/attendance/rules">
            <Button>前往考勤規則</Button>
          </Link>
        </TabsContent>
      </Tabs>
    </div>
  );
}

