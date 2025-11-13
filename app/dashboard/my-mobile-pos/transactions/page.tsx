'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Eye, CreditCard, Smartphone, Calendar, DollarSign } from 'lucide-react';
import { posDB, Transaction } from '@/lib/indexeddb-pos';

// 簡單的 toast 通知系統
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
    type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
};

export default function POSTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化並載入交易記錄
  useEffect(() => {
    const init = async () => {
      try {
        await posDB.init();
        setIsInitialized(true);
        await loadTransactions();
      } catch (error) {
        console.error('初始化失敗:', error);
        showToast('系統初始化失敗', 'error');
      }
    };

    init();
  }, []);

  // 載入交易記錄
  const loadTransactions = async () => {
    try {
      const allTransactions = await posDB.getAllTransactions();
      setTransactions(allTransactions);
    } catch (error) {
      console.error('載入交易記錄失敗:', error);
      showToast('載入交易記錄失敗', 'error');
    }
  };

  // 開啟交易詳情
  const handleViewDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailOpen(true);
  };

  // 格式化日期時間
  const formatDateTime = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // 取得付款方式標籤
  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return '現金';
      case 'linepay':
        return 'Line Pay';
      case 'credit':
        return '信用卡';
      default:
        return method;
    }
  };

  // 取得付款方式圖標
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
      case 'credit':
        return CreditCard;
      case 'linepay':
        return Smartphone;
      default:
        return CreditCard;
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">初始化中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] pb-6">
      <div className="max-w-6xl mx-auto p-4">
        {/* 標題列 */}
        <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">POS交易記錄</h1>
              <Badge variant="secondary" className="ml-2">
                {transactions.length} 筆
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadTransactions}
              className="dark:border-gray-600 dark:text-gray-300"
            >
              重新整理
            </Button>
          </div>
        </div>

        {/* 交易列表 */}
        {transactions.length === 0 ? (
          <Card className="dark:bg-[#1a2332] dark:border-gray-700">
            <CardContent className="py-12">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>尚無交易記錄</p>
                <p className="text-sm mt-1">請前往「我的行動POS」進行交易</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const PaymentIcon = getPaymentMethodIcon(transaction.paymentMethod);
              return (
                <Card
                  key={transaction.id}
                  className="dark:bg-[#1a2332] dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewDetail(transaction)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {transaction.transactionNumber}
                          </h3>
                          <Badge
                            variant="outline"
                            className="dark:border-gray-600 dark:text-gray-300"
                          >
                            <PaymentIcon className="h-3 w-3 mr-1" />
                            {getPaymentMethodLabel(transaction.paymentMethod)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(transaction.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${transaction.total}
                          </div>
                          <span>{transaction.items.length} 項商品</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(transaction);
                        }}
                        className="dark:text-gray-300"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        查看
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 交易詳情對話框 */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>交易詳情</DialogTitle>
              <DialogDescription>
                交易編號：{selectedTransaction?.transactionNumber}
              </DialogDescription>
            </DialogHeader>

            {selectedTransaction && (
              <div className="space-y-4 py-4">
                {/* 交易資訊 */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">交易時間</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {formatDateTime(selectedTransaction.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">付款方式</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {getPaymentMethodLabel(selectedTransaction.paymentMethod)}
                    </span>
                  </div>
                  {selectedTransaction.mobileCarrier && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">手機載具</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {selectedTransaction.mobileCarrier}
                      </span>
                    </div>
                  )}
                  {selectedTransaction.cashReceived && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">收款金額</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        ${selectedTransaction.cashReceived}
                      </span>
                    </div>
                  )}
                  {selectedTransaction.cashChange !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">找零</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        ${selectedTransaction.cashChange}
                      </span>
                    </div>
                  )}
                </div>

                {/* 商品明細 */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">商品明細</h3>
                  <div className="space-y-2">
                    {selectedTransaction.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            條碼：{item.barcode} | 數量：{item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${item.subtotal}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ${item.price} × {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 金額摘要 */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 border-t-2 border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">小計</span>
                    <span className="text-gray-900 dark:text-white">${selectedTransaction.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">稅額 (5%)</span>
                    <span className="text-gray-900 dark:text-white">${selectedTransaction.tax}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-white">總計</span>
                    <span className="text-blue-600 dark:text-blue-400 text-lg">
                      ${selectedTransaction.total}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                關閉
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

