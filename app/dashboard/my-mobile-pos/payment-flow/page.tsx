'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Database,
  Smartphone,
  DollarSign,
} from 'lucide-react';
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

interface LinePayReconciliationRecord {
  id?: string;
  transactionId: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: 'linepay' | 'cash' | 'credit';
  createdAt: Date;
  confirmedAt?: Date;
  memo?: string;
}

export default function PaymentFlowPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [linePayRecords, setLinePayRecords] = useState<LinePayReconciliationRecord[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');

  // 初始化並載入資料
  useEffect(() => {
    const init = async () => {
      try {
        await posDB.init();
        setIsInitialized(true);
        await loadTransactions();
        await loadLinePayRecords();
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
      const records = await posDB.getAllTransactions();
      setTransactions(records);
    } catch (error) {
      console.error('載入交易記錄失敗:', error);
      showToast('載入交易記錄失敗', 'error');
    }
  };

  // 載入 LINE Pay 對賬記錄（從 localStorage）
  const loadLinePayRecords = () => {
    try {
      const stored = localStorage.getItem('pos_linepay_reconciliations');
      if (stored) {
        const records = JSON.parse(stored);
        // 轉換日期字串為 Date 物件
        const parsed = records.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          confirmedAt: r.confirmedAt ? new Date(r.confirmedAt) : undefined,
        }));
        setLinePayRecords(parsed);
      }
    } catch (error) {
      console.error('載入 LINE Pay 對賬記錄失敗:', error);
    }
  };

  // 儲存 LINE Pay 對賬記錄
  const saveLinePayRecord = (record: LinePayReconciliationRecord) => {
    try {
      const stored = localStorage.getItem('pos_linepay_reconciliations');
      const records = stored ? JSON.parse(stored) : [];
      records.push(record);
      localStorage.setItem('pos_linepay_reconciliations', JSON.stringify(records));
      loadLinePayRecords();
    } catch (error) {
      console.error('儲存 LINE Pay 對賬記錄失敗:', error);
      throw error;
    }
  };

  // 從交易記錄建立 LINE Pay 對賬記錄
  const handleCreateReconciliation = (transaction: Transaction) => {
    if (transaction.paymentMethod !== 'linepay') {
      showToast('此交易不是 LINE Pay 付款', 'error');
      return;
    }

    // 檢查是否已經建立過對賬記錄
    const existing = linePayRecords.find(
      (r) => r.orderId === transaction.transactionNumber
    );
    if (existing) {
      showToast('此交易已經建立過對賬記錄', 'info');
      return;
    }

    const record: LinePayReconciliationRecord = {
      id: `LP${Date.now()}`,
      transactionId: `TXN${Date.now()}`,
      orderId: transaction.transactionNumber,
      amount: transaction.total,
      status: 'pending',
      paymentMethod: 'linepay',
      createdAt: new Date(),
      memo: `來自交易 ${transaction.transactionNumber}`,
    };

    saveLinePayRecord(record);
    showToast('LINE Pay 對賬記錄已建立', 'success');
  };

  // 更新對賬記錄狀態
  const handleUpdateStatus = (
    recordId: string,
    newStatus: 'pending' | 'completed' | 'failed' | 'cancelled'
  ) => {
    try {
      const stored = localStorage.getItem('pos_linepay_reconciliations');
      if (!stored) return;

      const records = JSON.parse(stored);
      const updated = records.map((r: any) => {
        if (r.id === recordId) {
          return {
            ...r,
            status: newStatus,
            confirmedAt: newStatus === 'completed' ? new Date() : r.confirmedAt,
          };
        }
        return r;
      });

      localStorage.setItem('pos_linepay_reconciliations', JSON.stringify(updated));
      loadLinePayRecords();
      showToast('狀態已更新', 'success');
    } catch (error) {
      console.error('更新狀態失敗:', error);
      showToast('更新狀態失敗', 'error');
    }
  };

  // 查看交易詳情
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

  // 取得狀態標籤
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">已完成</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">待處理</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">失敗</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500">已取消</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // 過濾交易記錄
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.transactionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // 過濾 LINE Pay 記錄
  const filteredLinePayRecords = linePayRecords.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return (
      r.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.transactionId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // 建立測試資料
  const handleCreateTestData = async () => {
    try {
      const now = new Date();
      const testTransactions: Transaction[] = [
        {
          transactionNumber: 'TXN20250101001',
          items: [
            {
              itemId: 1,
              barcode: '4710012345678',
              name: '可口可樂 330ml',
              price: 25,
              quantity: 2,
              subtotal: 50,
            },
          ],
          subtotal: 50,
          tax: 3,
          total: 53,
          paymentMethod: 'linepay',
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          transactionNumber: 'TXN20250102001',
          items: [
            {
              itemId: 2,
              barcode: '4710012345679',
              name: '統一泡麵',
              price: 45,
              quantity: 3,
              subtotal: 135,
            },
          ],
          subtotal: 135,
          tax: 7,
          total: 142,
          paymentMethod: 'linepay',
          createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
      ];

      for (const tx of testTransactions) {
        await posDB.createTransaction(tx);
      }

      // 建立對應的 LINE Pay 對賬記錄
      const testReconciliations: LinePayReconciliationRecord[] = [
        {
          id: 'LP20250101001',
          transactionId: 'TXN20250101001',
          orderId: 'TXN20250101001',
          amount: 53,
          status: 'completed',
          paymentMethod: 'linepay',
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          confirmedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
        },
        {
          id: 'LP20250102001',
          transactionId: 'TXN20250102001',
          orderId: 'TXN20250102001',
          amount: 142,
          status: 'pending',
          paymentMethod: 'linepay',
          createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
      ];

      const existing = localStorage.getItem('pos_linepay_reconciliations');
      const allRecords = existing ? JSON.parse(existing) : [];
      allRecords.push(...testReconciliations);
      localStorage.setItem('pos_linepay_reconciliations', JSON.stringify(allRecords));

      await loadTransactions();
      loadLinePayRecords();

      showToast('測試資料建立成功！', 'success');
    } catch (error) {
      console.error('建立測試資料失敗:', error);
      showToast('建立測試資料失敗', 'error');
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
      <div className="max-w-7xl mx-auto p-4">
        {/* 標題列 */}
        <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">金流管理</h1>
              {filteredLinePayRecords.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filteredLinePayRecords.length} 筆
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateTestData}
                className="dark:border-gray-600 dark:text-gray-300"
              >
                <Database className="h-4 w-4 mr-2" />
                建立測試資料
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryOpen(true)}
                className="dark:border-gray-600 dark:text-gray-300"
              >
                <Calendar className="h-4 w-4 mr-2" />
                對賬記錄
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 左側：交易記錄 */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base dark:text-white">交易記錄</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="搜尋交易編號或商品..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredTransactions.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        尚無交易記錄
                      </p>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedTransaction?.id === tx.id
                              ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                              : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => handleViewDetail(tx)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">
                              {tx.transactionNumber}
                            </p>
                            <Badge
                              variant="outline"
                              className="dark:border-gray-600 dark:text-gray-300"
                            >
                              {tx.paymentMethod === 'linepay' ? (
                                <Smartphone className="h-3 w-3 mr-1" />
                              ) : tx.paymentMethod === 'cash' ? (
                                <DollarSign className="h-3 w-3 mr-1" />
                              ) : (
                                <CreditCard className="h-3 w-3 mr-1" />
                              )}
                              {tx.paymentMethod === 'linepay'
                                ? 'LINE Pay'
                                : tx.paymentMethod === 'cash'
                                ? '現金'
                                : '信用卡'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDateTime(tx.createdAt)}
                          </p>
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
                            NT$ {tx.total}
                          </p>
                          {tx.paymentMethod === 'linepay' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 w-full text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateReconciliation(tx);
                              }}
                            >
                              建立對賬記錄
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右側：LINE Pay 對賬記錄 */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base dark:text-white">LINE Pay 對賬記錄</CardTitle>
                  <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="pending">待處理</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                      <SelectItem value="failed">失敗</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredLinePayRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Smartphone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>尚無 LINE Pay 對賬記錄</p>
                    <p className="text-sm mt-2">請從左側交易記錄建立對賬記錄</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredLinePayRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {record.orderId}
                            </p>
                            {getStatusBadge(record.status)}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            交易編號：{record.transactionId}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            建立時間：{formatDateTime(record.createdAt)}
                          </p>
                          {record.confirmedAt && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              確認時間：{formatDateTime(record.confirmedAt)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            NT$ {record.amount}
                          </p>
                          {record.status === 'pending' && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(record.id!, 'completed')}
                                className="text-xs"
                              >
                                標記完成
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(record.id!, 'failed')}
                                className="text-xs"
                              >
                                標記失敗
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 交易詳情對話框 */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>交易詳情</DialogTitle>
              <DialogDescription>交易編號：{selectedTransaction?.transactionNumber}</DialogDescription>
            </DialogHeader>

            {selectedTransaction && (
              <div className="space-y-4 py-4">
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
                      {selectedTransaction.paymentMethod === 'linepay'
                        ? 'LINE Pay'
                        : selectedTransaction.paymentMethod === 'cash'
                        ? '現金'
                        : '信用卡'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">小計</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      NT$ {selectedTransaction.subtotal}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">稅額</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      NT$ {selectedTransaction.tax}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-white">總計</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      NT$ {selectedTransaction.total}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">交易明細</h3>
                  <div className="space-y-2">
                    {selectedTransaction.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            條碼：{item.barcode} | 數量：{item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900 dark:text-white">
                            NT$ {item.subtotal}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            單價：NT$ {item.price}
                          </p>
                        </div>
                      </div>
                    ))}
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

        {/* 對賬記錄歷史對話框 */}
        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>LINE Pay 對賬記錄</DialogTitle>
              <DialogDescription>查看所有 LINE Pay 對賬記錄</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {linePayRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Smartphone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>尚無對賬記錄</p>
                </div>
              ) : (
                linePayRecords.map((record) => (
                  <Card
                    key={record.id}
                    className="dark:bg-[#1a2332] dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      // 可以點擊查看詳情
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {record.id}
                            </h3>
                            {getStatusBadge(record.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(record.createdAt)}
                            </div>
                            <span>訂單編號：{record.orderId}</span>
                            <span>交易編號：{record.transactionId}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            NT$ {record.amount}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>
                關閉
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


