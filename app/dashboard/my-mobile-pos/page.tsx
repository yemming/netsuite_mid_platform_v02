'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { Store, ShoppingCart, Scan, Trash2, Plus, Minus, X, CreditCard, Smartphone, Loader2, CheckCircle2 } from 'lucide-react';
import { posDB, POSItem, CartItem, Transaction } from '@/lib/indexeddb-pos';
import { linePayManager } from '@/lib/linepay-manager';
import { QRCodeSVG } from 'qrcode.react';
// 簡單的 toast 通知系統
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  // 建立 toast 元素
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
    type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // 3秒後自動移除
  setTimeout(() => {
    toast.remove();
  }, 3000);
};

export default function MyMobilePOSPage() {
  const [items, setItems] = useState<POSItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'linepay' | 'credit'>('cash');
  const [mobileCarrier, setMobileCarrier] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  // LINE Pay 相關狀態
  const [isLinePayQROpen, setIsLinePayQROpen] = useState(false);
  const [linePayQRUrl, setLinePayQRUrl] = useState('');
  const [linePayTransactionId, setLinePayTransactionId] = useState('');
  const [linePayOrderId, setLinePayOrderId] = useState('');
  const [linePayAmount, setLinePayAmount] = useState(0);
  const [linePayStatus, setLinePayStatus] = useState<'waiting' | 'checking' | 'success' | 'failed'>('waiting');
  const linePayPollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化資料庫和載入資料
  useEffect(() => {
    const init = async () => {
      try {
        await posDB.init();
        setIsInitialized(true);

        // 載入商品資料
        const allItems = await posDB.getAllItems();
        setItems(allItems);

        // 如果沒有商品，初始化一些範例商品
        if (allItems.length === 0) {
          const sampleItems: POSItem[] = [
            { barcode: '4710012345678', name: '可口可樂 330ml', price: 25, unit: '瓶', category: '飲料' },
            { barcode: '4710012345679', name: '統一泡麵', price: 45, unit: '包', category: '食品' },
            { barcode: '4710012345680', name: '衛生紙', price: 199, unit: '包', category: '日用品' },
            { barcode: '4710012345681', name: '礦泉水', price: 20, unit: '瓶', category: '飲料' },
            { barcode: '4710012345682', name: '麵包', price: 35, unit: '個', category: '食品' },
          ];
          for (const item of sampleItems) {
            await posDB.upsertItem(item);
          }
          setItems(await posDB.getAllItems());
        }

        // 載入購物車
        const cart = await posDB.getCartItems();
        setCartItems(cart);
      } catch (error) {
        console.error('初始化失敗:', error);
        showToast('系統初始化失敗', 'error');
      }
    };

    init();
  }, []);

  // 計算購物車總額
  const cartTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = Math.round(cartTotal * 0.05); // 5% 稅額
  const total = cartTotal + tax;

  // 掃描條碼
  const handleScan = async () => {
    if (!barcodeInput.trim()) {
      showToast('請輸入條碼', 'error');
      return;
    }

    try {
      // 從 IndexedDB 查詢商品
      let item = await posDB.getItemByBarcode(barcodeInput.trim());

      if (!item) {
        // 如果找不到商品，提示是否要新增
        const shouldAdd = confirm(`找不到條碼 ${barcodeInput} 的商品，是否要新增？`);
        if (shouldAdd) {
          const name = prompt('請輸入商品名稱：');
          if (!name) return;

          const priceStr = prompt('請輸入商品價格：');
          const price = parseFloat(priceStr || '0');
          if (isNaN(price) || price <= 0) {
            showToast('價格格式錯誤', 'error');
            return;
          }

          item = {
            barcode: barcodeInput.trim(),
            name,
            price,
            unit: '個',
          };
          await posDB.upsertItem(item);
          setItems(await posDB.getAllItems());
          showToast('商品已新增', 'success');
        } else {
          setBarcodeInput('');
          return;
        }
      }

      // 加入購物車
      await posDB.addToCart(item);
      const updatedCart = await posDB.getCartItems();
      setCartItems(updatedCart);
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
      showToast(`已加入：${item.name}`, 'success');
    } catch (error) {
      console.error('掃描失敗:', error);
      showToast('掃描失敗', 'error');
    }
  };

  // 更新購物車商品數量
  const handleUpdateQuantity = async (id: number, quantity: number) => {
    try {
      await posDB.updateCartItemQuantity(id, quantity);
      const updatedCart = await posDB.getCartItems();
      setCartItems(updatedCart);
    } catch (error) {
      console.error('更新數量失敗:', error);
      showToast('更新失敗', 'error');
    }
  };

  // 移除購物車商品
  const handleRemoveItem = async (id: number) => {
    try {
      await posDB.removeFromCart(id);
      const updatedCart = await posDB.getCartItems();
      setCartItems(updatedCart);
      showToast('已移除商品', 'success');
    } catch (error) {
      console.error('移除失敗:', error);
      showToast('移除失敗', 'error');
    }
  };

  // 開始輪詢 LINE Pay 付款狀態
  const startLinePayPolling = (transactionId: string, orderId: string) => {
    // 清除之前的輪詢
    if (linePayPollIntervalRef.current) {
      clearInterval(linePayPollIntervalRef.current);
    }

    // 每 2 秒檢查一次付款狀態
    linePayPollIntervalRef.current = setInterval(async () => {
      try {
        setLinePayStatus('checking');
        const statusResponse = await linePayManager.checkPaymentStatus(transactionId, orderId);

        if (statusResponse.success && statusResponse.status === 'CONFIRMED') {
          // 付款成功
          setLinePayStatus('success');
          if (linePayPollIntervalRef.current) {
            clearInterval(linePayPollIntervalRef.current);
            linePayPollIntervalRef.current = null;
          }

          // 確認付款
          const confirmResponse = await linePayManager.confirmPayment(transactionId, orderId, linePayAmount);
          if (confirmResponse.success) {
            // 更新交易記錄狀態
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

            // 建立對賬記錄到金流管理
            const reconciliationRecord = {
              id: `LP${Date.now()}`,
              transactionId,
              orderId,
              amount: linePayAmount,
              status: 'completed',
              paymentMethod: 'linepay',
              createdAt: new Date().toISOString(),
              confirmedAt: new Date().toISOString(),
            };
            const existingReconciliations = JSON.parse(
              localStorage.getItem('pos_linepay_reconciliations') || '[]'
            );
            existingReconciliations.push(reconciliationRecord);
            localStorage.setItem('pos_linepay_reconciliations', JSON.stringify(existingReconciliations));

            showToast('LINE Pay 付款成功！', 'success');

            // 3 秒後關閉對話框並清空購物車
            setTimeout(() => {
              handleLinePayClose();
            }, 3000);
          }
        } else if (statusResponse.success && statusResponse.status === 'FAILED') {
          // 付款失敗
          setLinePayStatus('failed');
          if (linePayPollIntervalRef.current) {
            clearInterval(linePayPollIntervalRef.current);
            linePayPollIntervalRef.current = null;
          }
          showToast('LINE Pay 付款失敗', 'error');
        } else {
          // 繼續等待
          setLinePayStatus('waiting');
        }
      } catch (error) {
        console.error('檢查付款狀態失敗:', error);
        setLinePayStatus('waiting');
      }
    }, 2000);
  };

  // 關閉 LINE Pay QR Code 對話框
  const handleLinePayClose = () => {
    // 清除輪詢
    if (linePayPollIntervalRef.current) {
      clearInterval(linePayPollIntervalRef.current);
      linePayPollIntervalRef.current = null;
    }

    // 清空購物車
    posDB.clearCart().then(() => {
      setCartItems([]);
    });

    // 重置表單
    setPaymentMethod('cash');
    setMobileCarrier('');
    setCashReceived('');
    setIsLinePayQROpen(false);
    setLinePayQRUrl('');
    setLinePayTransactionId('');
    setLinePayOrderId('');
    setLinePayAmount(0);
    setLinePayStatus('waiting');
  };

  // 結帳
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      showToast('購物車是空的', 'error');
      return;
    }

    // 驗證付款方式
    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived);
      if (isNaN(received) || received < total) {
        showToast('現金收款金額不足', 'error');
        return;
      }
    }

    try {
      // 產生交易編號
      const transactionNumber = `POS${Date.now()}`;

      // 如果是 LINE Pay，先請求付款
      if (paymentMethod === 'linepay') {
        const productName = cartItems.map((item) => item.name).join(', ');
        const linePayResponse = await linePayManager.requestPayment(
          transactionNumber,
          total,
          productName
        );

        if (!linePayResponse.success || !linePayResponse.qrCodeUrl || !linePayResponse.transactionId) {
          showToast(linePayResponse.error || 'LINE Pay 付款請求失敗', 'error');
          return;
        }

        // 設定 QR Code 資訊
        setLinePayQRUrl(linePayResponse.qrCodeUrl);
        setLinePayTransactionId(linePayResponse.transactionId);
        setLinePayOrderId(transactionNumber);
        setLinePayAmount(total);
        setLinePayStatus('waiting');

        // 建立待處理的交易記錄
        const transaction: Transaction = {
          transactionNumber,
          items: [...cartItems],
          subtotal: cartTotal,
          tax,
          total,
          paymentMethod: 'linepay',
          mobileCarrier: mobileCarrier || undefined,
          createdAt: new Date(),
        };

        await posDB.createTransaction(transaction);

        // 儲存 LINE Pay 交易資訊到 localStorage，等待確認
        const linePayPending = {
          transactionNumber,
          transactionId: linePayResponse.transactionId,
          amount: total,
          createdAt: new Date().toISOString(),
        };
        const pendingRecords = JSON.parse(
          localStorage.getItem('pos_linepay_pending') || '[]'
        );
        pendingRecords.push(linePayPending);
        localStorage.setItem('pos_linepay_pending', JSON.stringify(pendingRecords));

        // 關閉結帳對話框，開啟 QR Code 對話框
        setIsCheckoutOpen(false);
        setIsLinePayQROpen(true);

        // 開始輪詢付款狀態
        startLinePayPolling(linePayResponse.transactionId, transactionNumber);

        return;
      }

      // 現金或信用卡付款流程
      const transaction: Transaction = {
        transactionNumber,
        items: [...cartItems],
        subtotal: cartTotal,
        tax,
        total,
        paymentMethod,
        mobileCarrier: mobileCarrier || undefined,
        cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) : undefined,
        cashChange: paymentMethod === 'cash' ? parseFloat(cashReceived) - total : undefined,
        createdAt: new Date(),
      };

      await posDB.createTransaction(transaction);

      // 清空購物車
      await posDB.clearCart();
      setCartItems([]);

      // 重置表單
      setPaymentMethod('cash');
      setMobileCarrier('');
      setCashReceived('');
      setIsCheckoutOpen(false);

      showToast(`交易完成！交易編號：${transactionNumber}`, 'success');
    } catch (error) {
      console.error('結帳失敗:', error);
      showToast('結帳失敗', 'error');
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] pb-20">
      <div className="max-w-md mx-auto">
        {/* 標題列 */}
        <div className="bg-white dark:bg-[#1a2332] border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">我的行動POS</h1>
          </div>
        </div>

        {/* 掃描區域 */}
        <Card className="m-4 dark:bg-[#1a2332] dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 dark:text-white">
              <Scan className="h-4 w-4" />
              掃描商品
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="輸入或掃描條碼"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleScan();
                    }
                  }}
                  className="flex-1"
                  autoFocus
                />
                <Button onClick={handleScan} className="px-6">
                  <Scan className="h-4 w-4 mr-2" />
                  掃描
                </Button>
              </div>
              {/* 測試提示 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-2">
                  💡 測試提示：
                </p>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <p>• 輸入以下條碼測試：<code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">4710012345678</code>（可口可樂）</p>
                  <p>• 或輸入：<code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">4710012345679</code>（統一泡麵）</p>
                  <p>• 按 Enter 鍵或點擊「掃描」按鈕</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 購物車 */}
        <Card className="m-4 dark:bg-[#1a2332] dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between dark:text-white">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                購物車
                <Badge variant="secondary" className="ml-2">
                  {cartItems.length}
                </Badge>
              </div>
              {cartItems.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (confirm('確定要清空購物車嗎？')) {
                      await posDB.clearCart();
                      setCartItems([]);
                      showToast('購物車已清空', 'success');
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cartItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>購物車是空的</p>
                <p className="text-sm mt-1">請掃描商品加入購物車</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ${item.price} × {item.quantity} = ${item.subtotal}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateQuantity(item.id!, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateQuantity(item.id!, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id!)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 結帳按鈕 */}
        {cartItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1a2332] border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">小計</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${cartTotal}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">稅額 (5%)</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">${tax}</span>
              </div>
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <span className="text-lg font-bold text-gray-900 dark:text-white">總計</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${total}
                </span>
              </div>
              <Button
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full h-12 text-lg"
                size="lg"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                結帳
              </Button>
            </div>
          </div>
        )}

        {/* 結帳對話框 */}
        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>結帳</DialogTitle>
              <DialogDescription>請選擇付款方式並完成交易</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* 付款方式 */}
              <div>
                <Label className="mb-2 block">付款方式</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value: 'cash' | 'linepay' | 'credit') => setPaymentMethod(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        現金
                      </div>
                    </SelectItem>
                    <SelectItem value="linepay">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Line Pay
                      </div>
                    </SelectItem>
                    <SelectItem value="credit">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        信用卡
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 現金收款 */}
              {paymentMethod === 'cash' && (
                <div>
                  <Label htmlFor="cashReceived">收款金額</Label>
                  <Input
                    id="cashReceived"
                    type="number"
                    placeholder="輸入收款金額"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    min={total}
                    step="1"
                  />
                  {cashReceived && parseFloat(cashReceived) >= total && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      找零：${(parseFloat(cashReceived) - total).toFixed(0)}
                    </p>
                  )}
                </div>
              )}

              {/* 手機載具 */}
              <div>
                <Label htmlFor="mobileCarrier">手機載具（選填）</Label>
                <Input
                  id="mobileCarrier"
                  type="text"
                  placeholder="輸入手機載具條碼"
                  value={mobileCarrier}
                  onChange={(e) => setMobileCarrier(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  例如：/ABC1234
                </p>
              </div>

              {/* 金額摘要 */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">小計</span>
                  <span className="text-gray-900 dark:text-white">${cartTotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">稅額</span>
                  <span className="text-gray-900 dark:text-white">${tax}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">總計</span>
                  <span className="text-blue-600 dark:text-blue-400">${total}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCheckout} disabled={paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < total)}>
                確認結帳
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* LINE Pay QR Code 對話框 */}
        <Dialog open={isLinePayQROpen} onOpenChange={(open) => {
          if (!open && linePayStatus !== 'checking') {
            handleLinePayClose();
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>LINE Pay 付款</DialogTitle>
              <DialogDescription>
                請讓客戶使用 LINE 掃描下方條碼完成付款
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* 付款資訊 */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">訂單編號</span>
                  <span className="font-mono text-gray-900 dark:text-white">{linePayOrderId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">交易編號</span>
                  <span className="font-mono text-gray-900 dark:text-white">{linePayTransactionId}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">付款金額</span>
                  <span className="text-blue-600 dark:text-blue-400">NT$ {linePayAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center space-y-4">
                {linePayStatus === 'waiting' && (
                  <>
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                      <QRCodeSVG
                        value={linePayQRUrl}
                        size={256}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      等待客戶掃描條碼...
                    </p>
                  </>
                )}

                {linePayStatus === 'checking' && (
                  <>
                    <div className="bg-white p-4 rounded-lg border-2 border-blue-500">
                      <QRCodeSVG
                        value={linePayQRUrl}
                        size={256}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <p className="text-sm font-medium">正在確認付款...</p>
                    </div>
                  </>
                )}

                {linePayStatus === 'success' && (
                  <>
                    <div className="bg-green-50 dark:bg-green-900/20 p-8 rounded-lg border-2 border-green-500">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-10 w-10 text-white" />
                        </div>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          付款成功！
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      交易已完成，視窗將自動關閉
                    </p>
                  </>
                )}

                {linePayStatus === 'failed' && (
                  <>
                    <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-lg border-2 border-red-500">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                          <X className="h-10 w-10 text-white" />
                        </div>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          付款失敗
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      請重新嘗試或選擇其他付款方式
                    </p>
                  </>
                )}
              </div>
            </div>

            <DialogFooter>
              {linePayStatus === 'success' || linePayStatus === 'failed' ? (
                <Button onClick={handleLinePayClose} className="w-full">
                  關閉
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleLinePayClose}
                  disabled={linePayStatus === 'checking'}
                >
                  取消付款
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
