'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';

/**
 * 流程設計器頁面
 * 設計和編輯業務流程
 */
export default function WorkflowDesignerPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">流程設計器</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            設計和編輯業務流程
          </p>
        </div>
        <div className="ml-auto">
          <Button>
            <Save className="mr-2 h-4 w-4" />
            儲存流程
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>流程設計畫布</CardTitle>
          <CardDescription>拖放節點來設計流程</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg font-medium mb-2">流程設計器</p>
              <p className="text-sm">流程設計功能開發中...</p>
              <p className="text-xs mt-2">未來將整合流程設計工具（如 n8n 或自訂設計器）</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

