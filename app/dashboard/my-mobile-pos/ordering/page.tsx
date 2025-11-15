'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShoppingCart, Scan, Plus, Minus, X, Save, Trash2, Eye, Calendar, Truck, ClipboardList } from 'lucide-react';
import { posDB, POSItem, OrderingItem, OrderingRecord } from '@/lib/indexeddb-pos';

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

export default function POSOrderingPage() {
  const [products, setProducts] = useState<POSItem[]>([]);
  const [orderingItems, setOrderingItems] = useState<OrderingItem[]>([]);
  const [orderingRecords, setOrderingRecords] = useState<OrderingRecord[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [supplier, setSupplier] = useState('');
  const [memo, setMemo] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OrderingRecord | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // 初始化並載入資料
  useEffect(() => {
    const init = async () => {
      try {
        await posDB.init();
        setIsInitialized(true);
        await loadProducts();
        await loadOrderingRecords();
      } catch (error) {
        console.error('初始化失敗:', error);
        showToast('系統初始化失敗', 'error');
      }
    };

    init();
  }, []);

  // 載入產品列表
  const loadProducts = async () => {
    try {
      const allProducts = await posDB.getAllItems();
      setProducts(allProducts);
    } catch (error) {
      console.error('載入產品失敗:', error);
      showToast('載入產品失敗', 'error');
    }
  };

  // 載入訂貨記錄
  const loadOrderingRecords = async () => {
    try {
      const records = await posDB.getAllOrderings();
      setOrderingRecords(records);
    } catch (error) {
      console.error('載入訂貨記錄失敗:', error);
      showToast('載入訂貨記錄失敗', 'error');
    }
  };

  // 掃描條碼新增商品
  const handleScan = async () => {
    if (!barcodeInput.trim()) {
      showToast('請輸入條碼', 'error');
      return;
    }

    try {
      const item = await posDB.getItemByBarcode(barcodeInput.trim());

      if (!item) {
        showToast('找不到此條碼的商品，請先在產品主檔中新增', 'error');
        setBarcodeInput('');
        return;
      }

      // 檢查是否已在訂貨清單中
      const existingIndex = orderingItems.findIndex((oi) => oi.barcode === item.barcode);

      if (existingIndex >= 0) {
        // 如果已存在，增加數量
        const updated = [...orderingItems];
        updated[existingIndex].quantity += 1;
        setOrderingItems(updated);
        showToast(`已增加 ${item.name} 的訂購數量`, 'success');
      } else {
        // 新增到訂貨清單
        const orderingItem: OrderingItem = {
          itemId: item.id!,
          barcode: item.barcode,
          name: item.name,
          unit: item.unit || '個',
          quantity: 1,
        };
        setOrderingItems([...orderingItems, orderingItem]);
        showToast(`已加入：${item.name}`, 'success');
      }

      setBarcodeInput('');
      barcodeInputRef.current?.focus();
    } catch (error) {
      console.error('掃描失敗:', error);
      showToast('掃描失敗', 'error');
    }
  };

  // 從產品列表選擇
  const handleSelectProduct = (product: POSItem) => {
    const existingIndex = orderingItems.findIndex((oi) => oi.barcode === product.barcode);

    if (existingIndex >= 0) {
      const updated = [...orderingItems];
      updated[existingIndex].quantity += 1;
      setOrderingItems(updated);
      showToast(`已增加 ${product.name} 的訂購數量`, 'success');
    } else {
      const orderingItem: OrderingItem = {
        itemId: product.id!,
        barcode: product.barcode,
        name: product.name,
        unit: product.unit || '個',
        quantity: 1,
      };
      setOrderingItems([...orderingItems, orderingItem]);
      showToast(`已加入：${product.name}`, 'success');
    }
  };

  // 更新數量
  const handleUpdateQuantity = (index: number, delta: number) => {
    const updated = [...orderingItems];
    const newQuantity = updated[index].quantity + delta;
    if (newQuantity <= 0) {
      handleRemoveItem(index);
    } else {
      updated[index].quantity = newQuantity;
      setOrderingItems(updated);
    }
  };

  // 移除商品
  const handleRemoveItem = (index: number) => {
    const updated = orderingItems.filter((_, i) => i !== index);
    setOrderingItems(updated);
  };

  // 清空訂貨清單
  const handleClearList = () => {
    if (orderingItems.length === 0) return;
    if (confirm('確定要清空訂貨清單嗎？')) {
      setOrderingItems([]);
      setSupplier('');
      setMemo('');
      showToast('訂貨清單已清空', 'success');
    }
  };

  // 儲存訂貨記錄
  const handleSave = async () => {
    if (orderingItems.length === 0) {
      showToast('請至少新增一項商品', 'error');
      return;
    }

    try {
      // 產生訂貨單號
      const orderingNumber = `ORD${Date.now()}`;

      const orderingRecord: OrderingRecord = {
        orderingNumber,
        items: orderingItems.map((item) => ({ ...item })),
        supplier: supplier.trim() || undefined,
        memo: memo.trim() || undefined,
        createdAt: new Date(),
      };

      await posDB.createOrdering(orderingRecord);

      // 清空表單
      setOrderingItems([]);
      setSupplier('');
      setMemo('');
      setBarcodeInput('');

      // 重新載入記錄
      await loadOrderingRecords();

      showToast(`訂貨記錄已儲存！訂貨單號：${orderingNumber}`, 'success');
    } catch (error) {
      console.error('儲存失敗:', error);
      showToast('儲存失敗', 'error');
    }
  };

  // 查看訂貨記錄詳情
  const handleViewDetail = (record: OrderingRecord) => {
    setSelectedRecord(record);
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
              <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">門市訂貨</h1>
              <Badge variant="secondary" className="ml-2">
                {orderingItems.length} 項
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryOpen(true)}
                className="dark:border-gray-600 dark:text-gray-300"
              >
                <Calendar className="h-4 w-4 mr-2" />
                訂貨記錄
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 左側：掃描和產品選擇 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 掃描條碼 */}
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                  <Scan className="h-4 w-4" />
                  掃描條碼
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
                </div>
              </CardContent>
            </Card>

            {/* 產品列表 */}
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base dark:text-white">選擇產品</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {products.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      尚無產品資料
                    </p>
                  ) : (
                    products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => handleSelectProduct(product)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {product.barcode}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="ml-2">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右側：訂貨清單 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 訂貨清單 */}
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between dark:text-white">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    訂貨清單
                  </div>
                  {orderingItems.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleClearList}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      清空
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orderingItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>訂貨清單是空的</p>
                    <p className="text-sm mt-1">請掃描條碼或選擇產品加入訂貨清單</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orderingItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            條碼：{item.barcode} | 單位：{item.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(index, -1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center font-medium text-gray-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(index, 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
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

            {/* 訂貨資訊 */}
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base dark:text-white">訂貨資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="supplier">供應商（選填）</Label>
                  <Input
                    id="supplier"
                    type="text"
                    placeholder="輸入供應商名稱"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="memo">備註（選填）</Label>
                  <Textarea
                    id="memo"
                    placeholder="輸入備註資訊，例如：急需補貨、預定交貨日期等"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleSave}
                  className="w-full"
                  disabled={orderingItems.length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  儲存訂貨記錄
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 訂貨記錄詳情對話框 */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>訂貨記錄詳情</DialogTitle>
              <DialogDescription>
                訂貨單號：{selectedRecord?.orderingNumber}
              </DialogDescription>
            </DialogHeader>

            {selectedRecord && (
              <div className="space-y-4 py-4">
                {/* 訂貨資訊 */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">訂貨時間</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {formatDateTime(selectedRecord.createdAt)}
                    </span>
                  </div>
                  {selectedRecord.supplier && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">供應商</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {selectedRecord.supplier}
                      </span>
                    </div>
                  )}
                  {selectedRecord.memo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">備註</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {selectedRecord.memo}
                      </span>
                    </div>
                  )}
                </div>

                {/* 商品明細 */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">商品明細</h3>
                  <div className="space-y-2">
                    {selectedRecord.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            條碼：{item.barcode} | 單位：{item.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 總計 */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-t-2 border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-900 dark:text-white">總項數</span>
                    <span className="text-blue-600 dark:text-blue-400 text-lg">
                      {selectedRecord.items.length} 項
                    </span>
                  </div>
                  <div className="flex justify-between font-bold mt-2">
                    <span className="text-gray-900 dark:text-white">總數量</span>
                    <span className="text-blue-600 dark:text-blue-400 text-lg">
                      {selectedRecord.items.reduce((sum, item) => sum + item.quantity, 0)} 單位
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

        {/* 訂貨記錄歷史對話框 */}
        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>訂貨記錄</DialogTitle>
              <DialogDescription>查看所有訂貨記錄</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {orderingRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>尚無訂貨記錄</p>
                </div>
              ) : (
                orderingRecords.map((record) => (
                  <Card
                    key={record.id}
                    className="dark:bg-[#1a2332] dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setIsHistoryOpen(false);
                      handleViewDetail(record);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {record.orderingNumber}
                            </h3>
                            <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                              {record.items.length} 項商品
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(record.createdAt)}
                            </div>
                            {record.supplier && (
                              <div className="flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                {record.supplier}
                              </div>
                            )}
                            <span>
                              總數量：{record.items.reduce((sum, item) => sum + item.quantity, 0)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsHistoryOpen(false);
                            handleViewDetail(record);
                          }}
                          className="dark:text-gray-300"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          查看
                        </Button>
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


