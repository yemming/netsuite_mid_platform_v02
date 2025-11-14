'use client';

import { useState } from 'react';
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
  Package, 
  Scan, 
  ShoppingCart, 
  MapPin,
  ArrowRight,
  CheckCircle2,
  Clock,
  Truck,
  Users,
  Zap,
  ListChecks,
  PlayCircle
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

interface PickItem {
  itemId: string;
  name: string;
  quantity: number;
  binLocation: string;
  lotNumber?: string;
  picked?: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  items: PickItem[];
  status: 'pending' | 'released' | 'picking' | 'picked' | 'packed' | 'shipped';
  shipDate?: string;
  shipMethod?: string;
  pickPath?: string[];
}

interface Wave {
  id: string;
  waveNumber: string;
  orders: Order[];
  status: 'pending' | 'released' | 'picking' | 'completed';
  createdAt: Date;
}

export default function WMSFulfilmentPage() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 'SO-2024-001',
      customer: '客戶A',
      items: [
        { itemId: '1', name: '可口可樂 330ml', quantity: 10, binLocation: 'A-01-01', picked: false },
        { itemId: '2', name: '統一泡麵', quantity: 5, binLocation: 'B-03-01', picked: false },
      ],
      status: 'pending',
      shipDate: '2024-01-15',
      shipMethod: '標準配送',
    },
    {
      id: '2',
      orderNumber: 'SO-2024-002',
      customer: '客戶B',
      items: [
        { itemId: '3', name: '衛生紙', quantity: 20, binLocation: 'C-02-05', picked: false },
        { itemId: '4', name: '礦泉水', quantity: 15, binLocation: 'A-01-02', picked: false },
      ],
      status: 'pending',
      shipDate: '2024-01-15',
      shipMethod: '急件配送',
    },
  ]);
  const [waves, setWaves] = useState<Wave[]>([]);
  const [selectedWave, setSelectedWave] = useState<Wave | null>(null);
  const [isWaveDialogOpen, setIsWaveDialogOpen] = useState(false);
  const [isPickingDialogOpen, setIsPickingDialogOpen] = useState(false);
  const [currentPickItem, setCurrentPickItem] = useState<PickItem | null>(null);
  const [pickStrategy, setPickStrategy] = useState<'fefo' | 'primary' | 'zone'>('primary');
  const [waveCriteria, setWaveCriteria] = useState({
    shipDate: '',
    shipMethod: '',
    customer: '',
  });

  // 建立揀貨波次
  const handleCreateWave = () => {
    // 根據條件篩選訂單
    let filteredOrders = [...orders];
    
    if (waveCriteria.shipDate) {
      filteredOrders = filteredOrders.filter((o) => o.shipDate === waveCriteria.shipDate);
    }
    if (waveCriteria.shipMethod) {
      filteredOrders = filteredOrders.filter((o) => o.shipMethod === waveCriteria.shipMethod);
    }
    if (waveCriteria.customer) {
      filteredOrders = filteredOrders.filter((o) => o.customer.includes(waveCriteria.customer));
    }

    // 只選擇待處理的訂單
    filteredOrders = filteredOrders.filter((o) => o.status === 'pending');

    if (filteredOrders.length === 0) {
      showToast('沒有符合條件的訂單', 'error');
      return;
    }

    const waveNumber = `WAVE${Date.now()}`;
    const newWave: Wave = {
      id: waveNumber,
      waveNumber,
      orders: filteredOrders.map((o) => ({ ...o, status: 'released' as const })),
      status: 'released',
      createdAt: new Date(),
    };

    // 更新訂單狀態
    const updatedOrders = orders.map((o) => {
      if (filteredOrders.some((fo) => fo.id === o.id)) {
        return { ...o, status: 'released' as const };
      }
      return o;
    });
    setOrders(updatedOrders);

    setWaves([newWave, ...waves]);
    setIsWaveDialogOpen(false);
    showToast(`波次 ${waveNumber} 已建立，包含 ${filteredOrders.length} 筆訂單`, 'success');
  };

  // 開始揀貨
  const handleStartPicking = (wave: Wave) => {
    setSelectedWave(wave);
    // 計算揀貨路徑
    const allBins = new Set<string>();
    wave.orders.forEach((order) => {
      order.items.forEach((item) => {
        allBins.add(item.binLocation);
      });
    });
    const pickPath = Array.from(allBins).sort();
    
    const updatedWave = {
      ...wave,
      status: 'picking' as const,
      orders: wave.orders.map((o) => ({ ...o, status: 'picking' as const, pickPath })),
    };
    
    setWaves(waves.map((w) => (w.id === wave.id ? updatedWave : w)));
    setSelectedWave(updatedWave);
    setIsPickingDialogOpen(true);
    
    // 設定第一個待揀貨項目
    const firstItem = wave.orders
      .flatMap((o) => o.items.map((item) => ({ ...item, orderId: o.id })))
      .find((item) => !item.picked);
    
    if (firstItem) {
      setCurrentPickItem(firstItem);
    }
  };

  // 完成揀貨項目
  const handleCompletePick = () => {
    if (!selectedWave || !currentPickItem) return;

    // 更新波次中的訂單項目
    const updatedWaves = waves.map((wave) => {
      if (wave.id === selectedWave.id) {
        const updatedOrders = wave.orders.map((order) => {
          const updatedItems = order.items.map((item) => {
            if (item.itemId === currentPickItem.itemId && item.binLocation === currentPickItem.binLocation) {
              return { ...item, picked: true };
            }
            return item;
          });
          return { ...order, items: updatedItems };
        });
        return { ...wave, orders: updatedOrders };
      }
      return wave;
    });
    setWaves(updatedWaves);

    // 尋找下一個待揀貨項目
    const nextItem = updatedWaves
      .find((w) => w.id === selectedWave.id)
      ?.orders.flatMap((o) => o.items.map((item) => ({ ...item, orderId: o.id })))
      .find((item) => !item.picked);

    if (nextItem) {
      setCurrentPickItem(nextItem);
      showToast(`已揀貨：${currentPickItem.name}`, 'success');
    } else {
      // 所有項目都揀完了
      const finalWaves = updatedWaves.map((wave) => {
        if (wave.id === selectedWave.id) {
          const allPicked = wave.orders.every((order) => 
            order.items.every((item) => item.picked)
          );
          return {
            ...wave,
            status: allPicked ? ('completed' as const) : wave.status,
            orders: wave.orders.map((o) => ({
              ...o,
              status: o.items.every((item) => item.picked) ? ('picked' as const) : o.status,
            })),
          };
        }
        return wave;
      });
      setWaves(finalWaves);
      setIsPickingDialogOpen(false);
      setSelectedWave(null);
      setCurrentPickItem(null);
      showToast('波次揀貨完成！', 'success');
    }
  };

  // 計算揀貨進度
  const getPickProgress = (wave: Wave) => {
    const totalItems = wave.orders.reduce((sum, order) => sum + order.items.length, 0);
    const pickedItems = wave.orders.reduce(
      (sum, order) => sum + order.items.filter((item) => item.picked).length,
      0
    );
    return totalItems > 0 ? (pickedItems / totalItems) * 100 : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] pb-6">
      <div className="max-w-6xl mx-auto p-4">
        {/* 標題列 */}
        <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">WMS 出貨作業</h1>
            </div>
            <Button onClick={() => setIsWaveDialogOpen(true)}>
              <Zap className="h-4 w-4 mr-2" />
              建立波次
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 左側：訂單列表 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 訂單列表 */}
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between dark:text-white">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    待處理訂單
                  </div>
                  <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                    {orders.filter((o) => o.status === 'pending').length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {orders.filter((o) => o.status === 'pending').length === 0 ? (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <p className="text-sm">尚無待處理訂單</p>
                    </div>
                  ) : (
                    orders
                      .filter((o) => o.status === 'pending')
                      .map((order) => (
                        <div
                          key={order.id}
                          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                              {order.orderNumber}
                            </span>
                            <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                              {order.items.length} 項
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            <p>客戶：{order.customer}</p>
                            {order.shipDate && <p>出貨日：{order.shipDate}</p>}
                            {order.shipMethod && <p>配送：{order.shipMethod}</p>}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 功能說明 */}
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base dark:text-white">功能說明</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-2">
                    💡 波次揀貨：
                  </p>
                  <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <p>• 根據條件批量釋放訂單</p>
                    <p>• 優化揀貨路徑減少移動</p>
                    <p>• 支援多訂單同時揀貨</p>
                    <p>• 自動計算最佳儲位順序</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右側：波次列表 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 波次列表 */}
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between dark:text-white">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
                    揀貨波次
                  </div>
                  <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                    {waves.length} 個波次
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {waves.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <ListChecks className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>尚無揀貨波次</p>
                      <p className="text-sm mt-1">點擊「建立波次」開始揀貨作業</p>
                    </div>
                  ) : (
                    waves.map((wave) => {
                      const progress = getPickProgress(wave);
                      return (
                        <div
                          key={wave.id}
                          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {wave.waveNumber}
                              </span>
                              <Badge
                                variant={
                                  wave.status === 'completed'
                                    ? 'default'
                                    : wave.status === 'picking'
                                    ? 'secondary'
                                    : 'outline'
                                }
                                className="dark:border-gray-600 dark:text-gray-300"
                              >
                                {wave.status === 'completed'
                                  ? '已完成'
                                  : wave.status === 'picking'
                                  ? '揀貨中'
                                  : wave.status === 'released'
                                  ? '已釋放'
                                  : '待處理'}
                              </Badge>
                            </div>
                            {wave.status === 'released' && (
                              <Button
                                size="sm"
                                onClick={() => handleStartPicking(wave)}
                              >
                                <PlayCircle className="h-3 w-3 mr-1" />
                                開始揀貨
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">訂單數</span>
                              <span className="text-gray-900 dark:text-white font-medium">
                                {wave.orders.length} 筆
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">揀貨進度</span>
                              <span className="text-gray-900 dark:text-white font-medium">
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              建立時間：{new Date(wave.createdAt).toLocaleString('zh-TW')}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 建立波次對話框 */}
        <Dialog open={isWaveDialogOpen} onOpenChange={setIsWaveDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>建立揀貨波次</DialogTitle>
              <DialogDescription>
                根據條件選擇訂單建立揀貨波次
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>出貨日期</Label>
                <Input
                  type="date"
                  value={waveCriteria.shipDate}
                  onChange={(e) => setWaveCriteria({ ...waveCriteria, shipDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>配送方式</Label>
                <Select
                  value={waveCriteria.shipMethod}
                  onValueChange={(value) => setWaveCriteria({ ...waveCriteria, shipMethod: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="選擇配送方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部</SelectItem>
                    <SelectItem value="標準配送">標準配送</SelectItem>
                    <SelectItem value="急件配送">急件配送</SelectItem>
                    <SelectItem value="當日配送">當日配送</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>客戶（選填）</Label>
                <Input
                  value={waveCriteria.customer}
                  onChange={(e) => setWaveCriteria({ ...waveCriteria, customer: e.target.value })}
                  placeholder="輸入客戶名稱"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>揀貨策略</Label>
                <Select
                  value={pickStrategy}
                  onValueChange={(value: 'fefo' | 'primary' | 'zone') => setPickStrategy(value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">主要儲位優先</SelectItem>
                    <SelectItem value="fefo">先進先出 (FEFO)</SelectItem>
                    <SelectItem value="zone">區域揀貨</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsWaveDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateWave}>
                <Zap className="h-4 w-4 mr-2" />
                建立波次
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 揀貨對話框 */}
        <Dialog open={isPickingDialogOpen} onOpenChange={setIsPickingDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>揀貨作業</DialogTitle>
              <DialogDescription>
                波次：{selectedWave?.waveNumber}
              </DialogDescription>
            </DialogHeader>

            {currentPickItem && (
              <div className="space-y-4 py-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-200">商品名稱</span>
                      <span className="text-sm text-blue-700 dark:text-blue-300 font-semibold">
                        {currentPickItem.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-200">揀貨數量</span>
                      <span className="text-sm text-blue-700 dark:text-blue-300 font-semibold">
                        {currentPickItem.quantity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-200">儲位位置</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-blue-700 dark:text-blue-300 font-mono font-semibold">
                          {currentPickItem.binLocation}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    💡 請前往指定儲位掃描條碼完成揀貨
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="掃描條碼確認"
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCompletePick();
                        }
                      }}
                    />
                    <Button onClick={handleCompletePick}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      確認揀貨
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPickingDialogOpen(false)}>
                取消
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

