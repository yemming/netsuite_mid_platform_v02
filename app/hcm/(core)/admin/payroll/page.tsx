'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Calculator, FileText } from 'lucide-react';
import Link from 'next/link';

/**
 * 薪酬管理主頁面
 * 提供薪酬相關功能的導航入口
 */
export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">薪酬管理</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          管理員工薪酬、薪資計算和發放
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">總覽</TabsTrigger>
          <TabsTrigger value="models">薪酬模型</TabsTrigger>
          <TabsTrigger value="run">執行薪資</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">本月薪資總額</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">NT$ 2,450,000</div>
                <p className="text-xs text-muted-foreground">較上月 +5.2%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">待發放薪資</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">NT$ 2,450,000</div>
                <p className="text-xs text-muted-foreground">預計 2024-01-31 發放</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">薪酬模型數</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">3 個啟用中</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
                <CardDescription>常用薪酬管理功能</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/hcm/admin/payroll/models">
                  <Button variant="outline" className="w-full justify-start">
                    <Calculator className="mr-2 h-4 w-4" />
                    薪酬模型
                  </Button>
                </Link>
                <Link href="/hcm/admin/payroll/run">
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="mr-2 h-4 w-4" />
                    執行薪資
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models">
          <Link href="/hcm/admin/payroll/models">
            <Button>前往薪酬模型</Button>
          </Link>
        </TabsContent>

        <TabsContent value="run">
          <Link href="/hcm/admin/payroll/run">
            <Button>前往執行薪資</Button>
          </Link>
        </TabsContent>
      </Tabs>
    </div>
  );
}

