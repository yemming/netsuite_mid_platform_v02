'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';

/**
 * 假的 LINE Pay 支付頁面
 * 模擬 LINE Pay 的支付流程，用於測試
 */
function MockPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const transactionId = searchParams.get('transactionId');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const [paying, setPaying] = useState(false);

  async function handlePay() {
    setPaying(true);

    // 模擬付款處理時間
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 呼叫確認 API
    try {
      const response = await fetch('/api/mock/linepay/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, orderId, amount }),
      });

      const data = await response.json();

      if (data.returnCode === '0000') {
        // 標記為已確認（用於狀態查詢）
        localStorage.setItem(`linepay_${transactionId}`, 'confirmed');
        
        // 導回確認頁面
        router.push(
          `/payment/confirm?transactionId=${transactionId}&orderId=${orderId}&amount=${amount}`
        );
      } else {
        alert('付款失敗：' + data.returnMessage);
        setPaying(false);
      }
    } catch (error) {
      console.error('付款確認錯誤:', error);
      alert('付款確認失敗');
      setPaying(false);
    }
  }

  function handleCancel() {
    router.push('/payment/cancel');
  }

  const displayAmount = amount ? parseInt(amount, 10) : 1000;

  return (
    <div className="min-h-screen bg-green-50 dark:bg-[#0f1419] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a2332] rounded-lg shadow-lg p-8 max-w-md w-full border border-gray-200 dark:border-gray-700">
        {/* 假裝是 LINE Pay 的樣子 */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">💚</div>
          <h1 className="text-2xl font-bold text-green-600 dark:text-green-400">LINE Pay</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">（這是測試模式）</p>
        </div>

        <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">訂單編號</span>
            <span className="font-mono text-sm text-gray-900 dark:text-white">{orderId}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">交易編號</span>
            <span className="font-mono text-sm text-gray-900 dark:text-white">{transactionId}</span>
          </div>
          <div className="flex justify-between text-lg font-bold mt-4">
            <span className="text-gray-900 dark:text-white">金額</span>
            <span className="text-green-600 dark:text-green-400">NT$ {displayAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 mb-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 這是模擬支付頁面，點擊「確認付款」會直接成功
          </p>
        </div>

        {paying ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-400 mx-auto mb-2"></div>
            <p className="text-gray-600 dark:text-gray-400">處理中...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handlePay}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-lg transition"
            >
              確認付款
            </button>
            <button
              onClick={handleCancel}
              className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-lg transition"
            >
              取消
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          <p>模擬支付環境 v1.0</p>
          <p className="mt-1">實際 LINE Pay 流程會要求登入並扣款</p>
        </div>
      </div>
    </div>
  );
}

export default function MockPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-green-50 dark:bg-[#0f1419] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-400 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">載入中...</p>
        </div>
      </div>
    }>
      <MockPaymentContent />
    </Suspense>
  );
}

