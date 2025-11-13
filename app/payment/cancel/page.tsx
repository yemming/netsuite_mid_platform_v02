'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

/**
 * 支付取消頁面
 * 當用戶在 LINE Pay 支付頁面取消付款時，會導向此頁面
 */
export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] flex items-center justify-center p-4">
      <Card className="max-w-md w-full dark:bg-[#1a2332] dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-center dark:text-white">付款已取消</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <XCircle className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">您已取消付款流程</p>
          <Button
            onClick={() => {
              if (window.opener) {
                window.close();
              } else {
                router.push('/dashboard/my-mobile-pos');
              }
            }}
            className="w-full"
          >
            關閉
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

