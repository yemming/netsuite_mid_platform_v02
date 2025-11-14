'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Package, 
  Scan, 
  Plus, 
  Minus, 
  X, 
  Save, 
  Trash2, 
  Eye, 
  Calendar, 
  Truck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ClipboardCheck
} from 'lucide-react';

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

interface ReceivingItem {
  itemId?: string;
  barcode: string;
  name: string;
  unit: string;
  quantity: number;
  lotNumber?: string;
  expiryDate?: string;
  suggestedBin?: string;
}

interface ReceivingRecord {
  id?: string;
  receivingNumber: string;
  poNumber?: string;
  items: ReceivingItem[];
  supplier?: string;
  qualityStatus?: 'pending' | 'passed' | 'failed';
  memo?: string;
  createdAt: Date;
}

export default function WMSReceivingPage() {
  const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([]);
  const [receivingRecords, setReceivingRecords] = useState<ReceivingRecord[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [supplier, setSupplier] = useState('');
  const [memo, setMemo] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ReceivingRecord | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isQADialogOpen, setIsQADialogOpen] = useState(false);
  const [currentQAItem, setCurrentQAItem] = useState<ReceivingItem | null>(null);
  const [qaStatus, setQaStatus] = useState<'pending' | 'passed' | 'failed'>('pending');
  const [qaNotes, setQaNotes] = useState('');

  // 模擬商品資料（實際應該從資料庫載入）
  const mockItems = [
    { barcode: '4710012345678', name: '可口可樂 330ml', unit: '瓶' },
    { barcode: '4710012345679', name: '統一泡麵', unit: '包' },
    { barcode: '4710012345680', name: '衛生紙', unit: '包' },
    { barcode: '4710012345681', name: '礦泉水', unit: '瓶' },
    { barcode: '4710012345682', name: '麵包', unit: '個' },
  ];

  // 模擬儲位建議（實際應該根據策略計算）
  const getSuggestedBin = (itemName: string) => {
    const suggestions: Record<string, string> = {
      '可口可樂 330ml': 'A-01-02',
      '統一泡麵': 'B-03-01',
      '衛生紙': 'C-02-05',
      '礦泉水': 'A-01-03',
      '麵包': 'D-01-01',
    };
    return suggestions[itemName] || 'AUTO';
  };

  // 掃描條碼新增商品
  const handleScan = () => {
    if (!barcodeInput.trim()) {
      showToast('請輸入條碼', 'error');
      return;
    }

    const item = mockItems.find((i) => i.barcode === barcodeInput.trim());
    if (!item) {
      showToast('找不到此條碼的商品', 'error');
      setBarcodeInput('');
      return;
    }

    // 檢查是否已在收貨清單中
    const existingIndex = receivingItems.findIndex((ri) => ri.barcode === item.barcode);

    if (existingIndex >= 0) {
      const updated = [...receivingItems];
      updated[existingIndex].quantity += 1;
      setReceivingItems(updated);
      showToast(`已增加 ${item.name} 的數量`, 'success');
    } else {
      const receivingItem: ReceivingItem = {
        barcode: item.barcode,
        name: item.name,
        unit: item.unit,
        quantity: 1,
        suggestedBin: getSuggestedBin(item.name),
      };
      setReceivingItems([...receivingItems, receivingItem]);
      showToast(`已加入：${item.name}`, 'success');
    }

    setBarcodeInput('');
  };

  // 更新數量
  const handleUpdateQuantity = (index: number, delta: number) => {
    const updated = [...receivingItems];
    const newQuantity = updated[index].quantity + delta;
    if (newQuantity <= 0) {
      handleRemoveItem(index);
    } else {
      updated[index].quantity = newQuantity;
      setReceivingItems(updated);
    }
  };

  // 移除商品
  const handleRemoveItem = (index: number) => {
    const updated = receivingItems.filter((_, i) => i !== index);
    setReceivingItems(updated);
  };

  // 清空收貨清單
  const handleClearList = () => {
    if (receivingItems.length === 0) return;
    if (confirm('確定要清空收貨清單嗎？')) {
      setReceivingItems([]);
      setPoNumber('');
      setSupplier('');
      setMemo('');
      showToast('收貨清單已清空', 'success');
    }
  };

  // 開啟品質檢驗對話框
  const handleOpenQA = (item: ReceivingItem) => {
    setCurrentQAItem(item);
    setQaStatus('pending');
    setQaNotes('');
    setIsQADialogOpen(true);
  };

  // 完成品質檢驗
  const handleCompleteQA = () => {
    if (!currentQAItem) return;

    const updated = [...receivingItems];
    const index = updated.findIndex((item) => item.barcode === currentQAItem.barcode);
    if (index >= 0) {
      updated[index].qualityStatus = qaStatus;
      setReceivingItems(updated);
      showToast(`品質檢驗完成：${qaStatus === 'passed' ? '通過' : '不通過'}`, 'success');
    }

    setIsQADialogOpen(false);
    setCurrentQAItem(null);
  };

  // 儲存收貨記錄
  const handleSave = () => {
    if (receivingItems.length === 0) {
      showToast('請至少新增一項商品', 'error');
      return;
    }

    // 檢查是否有未完成品質檢驗的商品
    const hasUncheckedItems = receivingItems.some((item) => !item.qualityStatus);
    if (hasUncheckedItems) {
      if (!confirm('有商品尚未完成品質檢驗，是否繼續儲存？')) {
        return;
      }
    }

    const receivingNumber = `RCV${Date.now()}`;
    const receivingRecord: ReceivingRecord = {
      receivingNumber,
      poNumber: poNumber.trim() || undefined,
      items: receivingItems.map((item) => ({ ...item })),
      supplier: supplier.trim() || undefined,
      qualityStatus: receivingItems.every((item) => item.qualityStatus === 'passed') 
        ? 'passed' 
        : receivingItems.some((item) => item.qualityStatus === 'failed')
        ? 'failed'
        : 'pending',
      memo: memo.trim() || undefined,
      createdAt: new Date(),
    };

    setReceivingRecords([receivingRecord, ...receivingRecords]);

    // 清空表單
    setReceivingItems([]);
    setPoNumber('');
    setSupplier('');
    setMemo('');
    setBarcodeInput('');

    showToast(`收貨記錄已儲存！收貨單號：${receivingNumber}`, 'success');
  };

  // 查看收貨記錄詳情
  const handleViewDetail = (record: ReceivingRecord) => {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] pb-6">
      <div className="max-w-6xl mx-auto p-4">
        {/* 標題列 */}
        <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">WMS 收貨作業</h1>
              <Badge variant="secondary" className="ml-2">
                {receivingItems.length} 項
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
                收貨記錄
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 左側：掃描區域 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 掃描條碼 */}
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                  <Scan className="h-4 w-4" />
                  行動裝置掃描
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="掃描或輸入條碼"
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
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-2">
                      💡 功能說明：
                    </p>
                    <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <p>• 使用行動裝置掃描條碼進行收貨</p>
                      <p>• 系統自動建議儲位位置</p>
                      <p>• 支援採購單收貨</p>
                      <p>• 內建品質檢驗流程</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 採購單資訊 */}
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base dark:text-white">採購單資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="poNumber">採購單號（選填）</Label>
                  <Input
                    id="poNumber"
                    type="text"
                    placeholder="輸入採購單號"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="mt-1"
                  />
                </div>
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
              </CardContent>
            </Card>
          </div>

          {/* 右側：收貨清單 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 收貨清單 */}
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between dark:text-white">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    收貨清單
                  </div>
                  {receivingItems.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleClearList}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      清空
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {receivingItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>收貨清單是空的</p>
                    <p className="text-sm mt-1">請掃描條碼加入收貨清單</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {receivingItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {item.name}
                            </p>
                            {item.qualityStatus === 'passed' && (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                已檢驗
                              </Badge>
                            )}
                            {item.qualityStatus === 'failed' && (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                不合格
                              </Badge>
                            )}
                            {!item.qualityStatus && (
                              <Badge variant="outline">
                                <ClipboardCheck className="h-3 w-3 mr-1" />
                                待檢驗
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                            <p>條碼：{item.barcode} | 單位：{item.unit}</p>
                            {item.suggestedBin && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>建議儲位：{item.suggestedBin}</span>
                              </div>
                            )}
                          </div>
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
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenQA(item)}
                            className="h-8 px-2"
                          >
                            <ClipboardCheck className="h-3 w-3 mr-1" />
                            檢驗
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

            {/* 收貨資訊 */}
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base dark:text-white">備註資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="memo">備註（選填）</Label>
                  <Textarea
                    id="memo"
                    placeholder="輸入備註資訊"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleSave}
                  className="w-full"
                  disabled={receivingItems.length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  完成收貨並儲存
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 品質檢驗對話框 */}
        <Dialog open={isQADialogOpen} onOpenChange={setIsQADialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>品質檢驗</DialogTitle>
              <DialogDescription>
                商品：{currentQAItem?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>檢驗結果</Label>
                <Select
                  value={qaStatus}
                  onValueChange={(value: 'pending' | 'passed' | 'failed') => setQaStatus(value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">待檢驗</SelectItem>
                    <SelectItem value="passed">通過</SelectItem>
                    <SelectItem value="failed">不通過</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="qaNotes">檢驗備註</Label>
                <Textarea
                  id="qaNotes"
                  placeholder="輸入檢驗備註"
                  value={qaNotes}
                  onChange={(e) => setQaNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsQADialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCompleteQA}>
                完成檢驗
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 收貨記錄詳情對話框 */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>收貨記錄詳情</DialogTitle>
              <DialogDescription>
                收貨單號：{selectedRecord?.receivingNumber}
              </DialogDescription>
            </DialogHeader>

            {selectedRecord && (
              <div className="space-y-4 py-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">收貨時間</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {formatDateTime(selectedRecord.createdAt)}
                    </span>
                  </div>
                  {selectedRecord.poNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">採購單號</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {selectedRecord.poNumber}
                      </span>
                    </div>
                  )}
                  {selectedRecord.supplier && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">供應商</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {selectedRecord.supplier}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">品質狀態</span>
                    <Badge 
                      variant={
                        selectedRecord.qualityStatus === 'passed' ? 'default' : 
                        selectedRecord.qualityStatus === 'failed' ? 'destructive' : 
                        'outline'
                      }
                    >
                      {selectedRecord.qualityStatus === 'passed' ? '通過' : 
                       selectedRecord.qualityStatus === 'failed' ? '不通過' : 
                       '待檢驗'}
                    </Badge>
                  </div>
                </div>

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
                            {item.suggestedBin && ` | 儲位：${item.suggestedBin}`}
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
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                關閉
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 收貨記錄歷史對話框 */}
        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>收貨記錄</DialogTitle>
              <DialogDescription>查看所有收貨記錄</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {receivingRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>尚無收貨記錄</p>
                </div>
              ) : (
                receivingRecords.map((record) => (
                  <Card
                    key={record.receivingNumber}
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
                              {record.receivingNumber}
                            </h3>
                            <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                              {record.items.length} 項商品
                            </Badge>
                            <Badge 
                              variant={
                                record.qualityStatus === 'passed' ? 'default' : 
                                record.qualityStatus === 'failed' ? 'destructive' : 
                                'outline'
                              }
                            >
                              {record.qualityStatus === 'passed' ? '已通過' : 
                               record.qualityStatus === 'failed' ? '不合格' : 
                               '待檢驗'}
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

