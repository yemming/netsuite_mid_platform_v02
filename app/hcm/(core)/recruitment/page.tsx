'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, UserCheck, FileText } from 'lucide-react';
import Link from 'next/link';

/**
 * 招募管理主頁面
 * 提供招募相關功能的導航入口
 */
export default function RecruitmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">招募管理</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          管理職缺和候選人
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">總覽</TabsTrigger>
          <TabsTrigger value="requisitions">職缺管理</TabsTrigger>
          <TabsTrigger value="candidates">候選人</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">開放職缺</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">3 個急缺</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">候選人</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">12 個待面試</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">進行中面試</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">本週安排</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
                <CardDescription>常用招募功能</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/hcm/recruitment/requisitions">
                  <Button variant="outline" className="w-full justify-start">
                    <Briefcase className="mr-2 h-4 w-4" />
                    職缺管理
                  </Button>
                </Link>
                <Link href="/hcm/recruitment/candidates">
                  <Button variant="outline" className="w-full justify-start">
                    <UserCheck className="mr-2 h-4 w-4" />
                    候選人
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requisitions">
          <Link href="/hcm/recruitment/requisitions">
            <Button>前往職缺管理</Button>
          </Link>
        </TabsContent>

        <TabsContent value="candidates">
          <Link href="/hcm/recruitment/candidates">
            <Button>前往候選人</Button>
          </Link>
        </TabsContent>
      </Tabs>
    </div>
  );
}

