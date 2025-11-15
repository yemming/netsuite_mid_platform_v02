'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Package, Search, Plus, Minus, Save, RefreshCw } from 'lucide-react';

// 盤點項目型別
interface InventoryItem {
  id: string;
  itemCode: string;
  itemName: string;
  unit: string;
  systemQty: number; // 系統庫存
  actualQty: number; // 實際盤點數量
  difference: number; // 差異
  location?: string; // 儲位
  notes?: string; // 備註
}

// 盤點單狀態
type CheckStatus = 'draft' | 'in-progress' | 'completed' | 'submitted';

export default function InventoryCheckPage() {
  // 狀態管理
  const [checkNumber, setCheckNumber] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [checkDate, setCheckDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [checkStatus, setCheckStatus] = useState<CheckStatus>('draft');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchBarcode, setSearchBarcode] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // 模擬的門市列表
  const stores = [
    { id: 'store-001', name: '台北信義店' },
    { id: 'store-002', name: '台北西門店' },
    { id: 'store-003', name: '新竹巨城店' },
    { id: 'store-004', name: '台中中友店' },
  ];

  // 模擬的倉庫位置
  const locations = [
    { id: 'loc-001', name: '主倉庫' },
    { id: 'loc-002', name: '小倉庫A' },
    { id: 'loc-003', name: '小倉庫B' },
    { id: 'loc-004', name: '展示區' },
    { id: 'loc-005', name: '收銀台' },
  ];

  // 模擬的商品資料（實際應該從 API 取得）
  const mockItems: InventoryItem[] = [
    { id: '1', itemCode: 'ITEM001', itemName: '商品A', unit: '個', systemQty: 50, actualQty: 0, difference: 0 },
    { id: '2', itemCode: 'ITEM002', itemName: '商品B', unit: '箱', systemQty: 20, actualQty: 0, difference: 0 },
    { id: '3', itemCode: 'ITEM003', itemName: '商品C', unit: '包', systemQty: 100, actualQty: 0, difference: 0 },
  ];

  // 初始化盤點單號
  useEffect(() => {
    if (!checkNumber) {
      const date = new Date();
      const timestamp = date.getTime().toString().slice(-6);
      setCheckNumber(`IC-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${timestamp}`);
    }
  }, [checkNumber]);

  // 掃描條碼處理
  const handleBarcodeScan = (barcode: string) => {
    if (!barcode.trim()) return;

    // 檢查商品是否已存在
    const existingItem = items.find(item => item.itemCode === barcode);
    if (existingItem) {
      // 如果已存在，增加數量
      updateItemQty(existingItem.id, existingItem.actualQty + 1);
      return;
    }

    // 模擬從系統查詢商品（實際應該呼叫 API）
    const foundItem = mockItems.find(item => item.itemCode === barcode);
    if (foundItem) {
      const newItem: InventoryItem = {
        ...foundItem,
        actualQty: 1,
        difference: 1 - foundItem.systemQty,
      };
      setItems([...items, newItem]);
      setSearchBarcode('');
    } else {
      alert(`找不到商品條碼: ${barcode}`);
    }
  };

  // 更新商品數量
  const updateItemQty = (itemId: string, newQty: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const actualQty = Math.max(0, newQty);
        return {
          ...item,
          actualQty,
          difference: actualQty - item.systemQty,
        };
      }
      return item;
    }));
  };

  // 移除商品
  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  // 開始盤點
  const startCheck = () => {
    if (!selectedStore || !selectedLocation) {
      alert('請選擇門市和倉庫位置');
      return;
    }
    setCheckStatus('in-progress');
  };

  // 完成盤點
  const completeCheck = () => {
    if (items.length === 0) {
      alert('請至少盤點一項商品');
      return;
    }
    setCheckStatus('completed');
  };

  // 提交盤點
  const submitCheck = async () => {
    try {
      // 模擬 API 呼叫
      console.log('提交盤點資料:', {
        checkNumber,
        store: selectedStore,
        location: selectedLocation,
        checkDate,
        items,
      });
      
      alert('盤點單已提交成功！');
      setCheckStatus('submitted');
      
      // 重置表單
      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (error) {
      alert('提交失敗，請重試');
      console.error(error);
    }
  };

  // 重置表單
  const resetForm = () => {
    setItems([]);
    setCheckStatus('draft');
    setSearchBarcode('');
    setSelectedLocation('');
  };

  // 計算統計
  const stats = {
    totalItems: items.length,
    totalDifference: items.reduce((sum, item) => sum + Math.abs(item.difference), 0),
    overstock: items.filter(item => item.difference > 0).length,
    shortage: items.filter(item => item.difference < 0).length,
    match: items.filter(item => item.difference === 0).length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">門市盤點</h1>
          <p className="text-gray-500 mt-1">小倉庫盤點作業流程</p>
        </div>
        <Badge variant={checkStatus === 'completed' ? 'default' : checkStatus === 'in-progress' ? 'secondary' : 'outline'}>
          {checkStatus === 'draft' && '草稿'}
          {checkStatus === 'in-progress' && '盤點中'}
          {checkStatus === 'completed' && '已完成'}
          {checkStatus === 'submitted' && '已提交'}
        </Badge>
      </div>

      {/* 盤點單基本資訊 */}
      <Card>
        <CardHeader>
          <CardTitle>盤點單資訊</CardTitle>
          <CardDescription>設定本次盤點的基本資訊</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>盤點單號</Label>
              <Input value={checkNumber} readOnly className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>門市 <span className="text-red-500">*</span></Label>
              <Select value={selectedStore} onValueChange={setSelectedStore} disabled={checkStatus !== 'draft'}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇門市" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>倉庫位置 <span className="text-red-500">*</span></Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={checkStatus !== 'draft'}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇倉庫位置" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>盤點日期</Label>
              <Input 
                type="date" 
                value={checkDate} 
                onChange={(e) => setCheckDate(e.target.value)}
                disabled={checkStatus !== 'draft'}
              />
            </div>
          </div>

          {checkStatus === 'draft' && (
            <Button onClick={startCheck} className="w-full md:w-auto" disabled={!selectedStore || !selectedLocation}>
              <Package className="mr-2 h-4 w-4" />
              開始盤點
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 盤點作業區 */}
      {checkStatus === 'in-progress' && (
        <>
          {/* 條碼掃描區 */}
          <Card>
            <CardHeader>
              <CardTitle>掃描商品</CardTitle>
              <CardDescription>掃描或輸入商品條碼進行盤點</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="掃描條碼或輸入商品代碼"
                    value={searchBarcode}
                    onChange={(e) => setSearchBarcode(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleBarcodeScan(searchBarcode);
                      }
                    }}
                    autoFocus
                  />
                </div>
                <Button onClick={() => handleBarcodeScan(searchBarcode)}>
                  <Search className="mr-2 h-4 w-4" />
                  查詢
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsScanning(!isScanning)}
                  className={isScanning ? 'bg-green-100' : ''}
                >
                  {isScanning ? '停止掃描' : '開始掃描'}
                </Button>
              </div>
              
              {isScanning && (
                <Alert>
                  <AlertDescription>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                      掃描模式已啟動，請將條碼對準掃描器
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* 盤點商品列表 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>盤點商品清單</CardTitle>
                  <CardDescription>已盤點 {items.length} 項商品</CardDescription>
                </div>
                <Button variant="outline" onClick={completeCheck} disabled={items.length === 0}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  完成盤點
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>尚未盤點任何商品</p>
                  <p className="text-sm mt-2">請掃描或輸入商品條碼開始盤點</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">商品代碼</th>
                          <th className="text-left p-2">商品名稱</th>
                          <th className="text-center p-2">系統庫存</th>
                          <th className="text-center p-2">實際數量</th>
                          <th className="text-center p-2">差異</th>
                          <th className="text-center p-2">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-mono text-sm">{item.itemCode}</td>
                            <td className="p-2">{item.itemName}</td>
                            <td className="p-2 text-center">{item.systemQty} {item.unit}</td>
                            <td className="p-2">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateItemQty(item.id, item.actualQty - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  value={item.actualQty}
                                  onChange={(e) => updateItemQty(item.id, parseInt(e.target.value) || 0)}
                                  className="w-20 text-center"
                                  min="0"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateItemQty(item.id, item.actualQty + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm text-gray-500 ml-1">{item.unit}</span>
                              </div>
                            </td>
                            <td className="p-2 text-center">
                              <Badge 
                                variant={
                                  item.difference === 0 ? 'default' : 
                                  item.difference > 0 ? 'secondary' : 'destructive'
                                }
                              >
                                {item.difference > 0 ? '+' : ''}{item.difference}
                              </Badge>
                            </td>
                            <td className="p-2 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 統計資訊 */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.totalItems}</div>
                      <div className="text-sm text-gray-500">總項數</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.match}</div>
                      <div className="text-sm text-gray-500">相符</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.overstock}</div>
                      <div className="text-sm text-gray-500">溢庫</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{stats.shortage}</div>
                      <div className="text-sm text-gray-500">短少</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.totalDifference}</div>
                      <div className="text-sm text-gray-500">總差異</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* 完成盤點確認 */}
      {checkStatus === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle>盤點完成確認</CardTitle>
            <CardDescription>請確認盤點結果無誤後提交</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">盤點摘要</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">門市：</span>
                  <span className="font-medium">{stores.find(s => s.id === selectedStore)?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">倉庫位置：</span>
                  <span className="font-medium">{locations.find(l => l.id === selectedLocation)?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">盤點項數：</span>
                  <span className="font-medium">{stats.totalItems}</span>
                </div>
                <div>
                  <span className="text-gray-600">總差異：</span>
                  <span className="font-medium">{stats.totalDifference}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={submitCheck} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                提交盤點單
              </Button>
              <Button variant="outline" onClick={() => setCheckStatus('in-progress')}>
                <RefreshCw className="mr-2 h-4 w-4" />
                返回修改
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 已提交狀態 */}
      {checkStatus === 'submitted' && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">盤點單已成功提交</h2>
              <p className="text-gray-500 mb-4">盤點單號：{checkNumber}</p>
              <Button onClick={resetForm} variant="outline">
                建立新盤點單
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


