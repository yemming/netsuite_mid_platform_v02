'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { linePayManager } from '@/lib/linepay-manager';

/**
 * 支付確認頁面
 * 當用戶在 LINE Pay 支付頁面完成付款後，會導向此頁面進行確認
 */
export default function PaymentConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const transactionId = searchParams.get('transactionId');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const [confirming, setConfirming] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      if (!transactionId || !orderId || !amount) {
        setError('缺少必要參數');
        setConfirming(false);
        return;
      }

      try {
        // 確認付款
        const result = await linePayManager.confirmPayment(
          transactionId,
          orderId,
          parseInt(amount, 10)
        );

        if (result.success) {
          setSuccess(true);

          // 更新 localStorage 中的待處理記錄
          const pendingRecords = JSON.parse(
            localStorage.getItem('pos_linepay_pending') || '[]'
          );
          const updatedRecords = pendingRecords.map((record: any) => {
            if (record.transactionNumber === orderId) {
              return {
                ...record,
                confirmed: true,
                confirmedAt: new Date().toISOString(),
              };
            }
            return record;
          });
          localStorage.setItem('pos_linepay_pending', JSON.stringify(updatedRecords));

          // 3秒後自動關閉視窗或導向首頁
          setTimeout(() => {
            if (window.opener) {
              window.close();
            } else {
              router.push('/dashboard/my-mobile-pos');
            }
          }, 3000);
        } else {
          setError(result.error || '付款確認失敗');
        }
      } catch (err) {
        console.error('確認付款錯誤:', err);
        setError(err instanceof Error ? err.message : '付款確認失敗');
      } finally {
        setConfirming(false);
      }
    };

    confirmPayment();
  }, [transactionId, orderId, amount, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] flex items-center justify-center p-4">
      <Card className="max-w-md w-full dark:bg-[#1a2332] dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-center dark:text-white">付款確認</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {confirming ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
              <p className="text-gray-600 dark:text-gray-400">正在確認付款...</p>
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto" />
              <p className="text-lg font-semibold text-gray-900 dark:text-white">付款成功！</p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">訂單編號</span>
                  <span className="font-mono text-gray-900 dark:text-white">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">交易編號</span>
                  <span className="font-mono text-gray-900 dark:text-white">{transactionId}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">付款金額</span>
                  <span className="text-green-600 dark:text-green-400">
                    NT$ {amount ? parseInt(amount, 10).toLocaleString() : '0'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                視窗將在 3 秒後自動關閉...
              </p>
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
            </>
          ) : (
            <>
              <XCircle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto" />
              <p className="text-lg font-semibold text-gray-900 dark:text-white">付款確認失敗</p>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <Button
                onClick={() => {
                  if (window.opener) {
                    window.close();
                  } else {
                    router.push('/dashboard/my-mobile-pos');
                  }
                }}
                variant="outline"
                className="w-full"
              >
                關閉
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

