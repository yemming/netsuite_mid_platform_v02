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
  Warehouse, 
  Scan, 
  MapPin, 
  Package, 
  ArrowRight, 
  RefreshCw,
  Search,
  Grid3x3,
  TrendingUp,
  BarChart3,
  Move,
  CheckCircle2
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

interface BinLocation {
  binId: string;
  zone: string;
  itemName?: string;
  quantity?: number;
  capacity?: number;
  utilization?: number;
}

interface TransferRecord {
  id: string;
  fromBin: string;
  toBin: string;
  itemName: string;
  quantity: number;
  createdAt: Date;
}

export default function WMSStoragePage() {
  const [bins, setBins] = useState<BinLocation[]>([
    { binId: 'A-01-01', zone: 'A區', itemName: '可口可樂 330ml', quantity: 50, capacity: 100, utilization: 50 },
    { binId: 'A-01-02', zone: 'A區', itemName: '礦泉水', quantity: 30, capacity: 100, utilization: 30 },
    { binId: 'B-03-01', zone: 'B區', itemName: '統一泡麵', quantity: 80, capacity: 100, utilization: 80 },
    { binId: 'C-02-05', zone: 'C區', itemName: '衛生紙', quantity: 20, capacity: 100, utilization: 20 },
    { binId: 'D-01-01', zone: 'D區', itemName: '麵包', quantity: 15, capacity: 50, utilization: 30 },
  ]);
  const [transferRecords, setTransferRecords] = useState<TransferRecord[]>([]);
  const [searchBin, setSearchBin] = useState('');
  const [selectedBin, setSelectedBin] = useState<BinLocation | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isReplenishOpen, setIsReplenishOpen] = useState(false);
  const [transferFromBin, setTransferFromBin] = useState('');
  const [transferToBin, setTransferToBin] = useState('');
  const [transferQuantity, setTransferQuantity] = useState('');
  const [replenishBin, setReplenishBin] = useState('');
  const [replenishQuantity, setReplenishQuantity] = useState('');

  // 搜尋儲位
  const handleSearchBin = () => {
    if (!searchBin.trim()) {
      showToast('請輸入儲位編號', 'error');
      return;
    }

    const bin = bins.find((b) => b.binId === searchBin.trim().toUpperCase());
    if (bin) {
      setSelectedBin(bin);
      showToast(`找到儲位：${bin.binId}`, 'success');
    } else {
      showToast('找不到此儲位', 'error');
      setSelectedBin(null);
    }
  };

  // 開啟轉移對話框
  const handleOpenTransfer = (bin: BinLocation) => {
    setSelectedBin(bin);
    setTransferFromBin(bin.binId);
    setTransferToBin('');
    setTransferQuantity('');
    setIsTransferOpen(true);
  };

  // 完成轉移
  const handleCompleteTransfer = () => {
    if (!transferFromBin || !transferToBin || !transferQuantity) {
      showToast('請填寫完整資訊', 'error');
      return;
    }

    const quantity = parseInt(transferQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      showToast('數量必須大於 0', 'error');
      return;
    }

    const fromBin = bins.find((b) => b.binId === transferFromBin);
    if (!fromBin || !fromBin.quantity || fromBin.quantity < quantity) {
      showToast('來源儲位庫存不足', 'error');
      return;
    }

    // 更新儲位庫存
    const updatedBins = bins.map((bin) => {
      if (bin.binId === transferFromBin) {
        return {
          ...bin,
          quantity: (bin.quantity || 0) - quantity,
          utilization: bin.capacity ? ((bin.quantity || 0) - quantity) / bin.capacity * 100 : 0,
        };
      }
      if (bin.binId === transferToBin) {
        return {
          ...bin,
          quantity: (bin.quantity || 0) + quantity,
          utilization: bin.capacity ? ((bin.quantity || 0) + quantity) / bin.capacity * 100 : 0,
          itemName: fromBin.itemName,
        };
      }
      return bin;
    });
    setBins(updatedBins);

    // 記錄轉移
    const transferRecord: TransferRecord = {
      id: `TRF${Date.now()}`,
      fromBin: transferFromBin,
      toBin: transferToBin,
      itemName: fromBin.itemName || '未知商品',
      quantity,
      createdAt: new Date(),
    };
    setTransferRecords([transferRecord, ...transferRecords]);

    setIsTransferOpen(false);
    setSelectedBin(null);
    showToast('儲位轉移完成', 'success');
  };

  // 開啟補貨對話框
  const handleOpenReplenish = (bin: BinLocation) => {
    setSelectedBin(bin);
    setReplenishBin(bin.binId);
    setReplenishQuantity('');
    setIsReplenishOpen(true);
  };

  // 完成補貨
  const handleCompleteReplenish = () => {
    if (!replenishBin || !replenishQuantity) {
      showToast('請填寫完整資訊', 'error');
      return;
    }

    const quantity = parseInt(replenishQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      showToast('數量必須大於 0', 'error');
      return;
    }

    const bin = bins.find((b) => b.binId === replenishBin);
    if (!bin) {
      showToast('找不到儲位', 'error');
      return;
    }

    // 更新儲位庫存
    const updatedBins = bins.map((b) => {
      if (b.binId === replenishBin) {
        const newQuantity = (b.quantity || 0) + quantity;
        return {
          ...b,
          quantity: newQuantity,
          utilization: b.capacity ? newQuantity / b.capacity * 100 : 0,
        };
      }
      return b;
    });
    setBins(updatedBins);

    setIsReplenishOpen(false);
    setSelectedBin(null);
    showToast('補貨完成', 'success');
  };

  // 計算總體利用率
  const totalUtilization = bins.reduce((sum, bin) => sum + (bin.utilization || 0), 0) / bins.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] pb-6">
      <div className="max-w-6xl mx-auto p-4">
        {/* 標題列 */}
        <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">WMS 儲存管理</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
                總利用率：{totalUtilization.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 左側：搜尋和操作 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 儲位搜尋 */}
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                  <Search className="h-4 w-4" />
                  儲位查詢
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="輸入儲位編號"
                      value={searchBin}
                      onChange={(e) => setSearchBin(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchBin();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button onClick={handleSearchBin}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  {selectedBin && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-200">儲位編號</span>
                          <span className="text-sm text-blue-700 dark:text-blue-300 font-mono">{selectedBin.binId}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-200">區域</span>
                          <span className="text-sm text-blue-700 dark:text-blue-300">{selectedBin.zone}</span>
                        </div>
                        {selectedBin.itemName && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">商品</span>
                            <span className="text-sm text-blue-700 dark:text-blue-300">{selectedBin.itemName}</span>
                          </div>
                        )}
                        {selectedBin.quantity !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">庫存</span>
                            <span className="text-sm text-blue-700 dark:text-blue-300">{selectedBin.quantity}</span>
                          </div>
                        )}
                        {selectedBin.utilization !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">利用率</span>
                            <span className="text-sm text-blue-700 dark:text-blue-300">{selectedBin.utilization.toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base dark:text-white">快速操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-2">
                    💡 功能說明：
                  </p>
                  <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <p>• 儲位轉移：在不同儲位間移動庫存</p>
                    <p>• 補貨作業：補充儲位庫存</p>
                    <p>• 週期盤點：定期盤點儲位庫存</p>
                    <p>• 空間優化：根據流動性調整儲位</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右側：儲位列表 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 儲位列表 */}
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between dark:text-white">
                  <div className="flex items-center gap-2">
                    <Grid3x3 className="h-4 w-4" />
                    儲位列表
                  </div>
                  <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                    {bins.length} 個儲位
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bins.map((bin) => (
                    <div
                      key={bin.binId}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium text-gray-900 dark:text-white font-mono">
                            {bin.binId}
                          </span>
                          <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                            {bin.zone}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                          {bin.itemName && (
                            <p>商品：{bin.itemName}</p>
                          )}
                          <div className="flex items-center gap-4">
                            {bin.quantity !== undefined && (
                              <span>庫存：{bin.quantity}</span>
                            )}
                            {bin.capacity && (
                              <span>容量：{bin.capacity}</span>
                            )}
                            {bin.utilization !== undefined && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                <span>利用率：{bin.utilization.toFixed(1)}%</span>
                              </div>
                            )}
                          </div>
                          {bin.utilization !== undefined && (
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                              <div
                                className={`h-2 rounded-full ${
                                  bin.utilization >= 80 ? 'bg-red-500' :
                                  bin.utilization >= 50 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(bin.utilization, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenTransfer(bin)}
                          className="h-8 px-2"
                        >
                          <Move className="h-3 w-3 mr-1" />
                          轉移
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReplenish(bin)}
                          className="h-8 px-2"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          補貨
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 統計資訊 */}
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                  <BarChart3 className="h-4 w-4" />
                  儲位統計
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {bins.length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">總儲位數</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {bins.filter((b) => b.utilization && b.utilization < 50).length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">空閒儲位</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {totalUtilization.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">平均利用率</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 儲位轉移對話框 */}
        <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>儲位轉移</DialogTitle>
              <DialogDescription>
                將商品從一個儲位轉移到另一個儲位
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>來源儲位</Label>
                <Input
                  value={transferFromBin}
                  onChange={(e) => setTransferFromBin(e.target.value)}
                  className="mt-1"
                  disabled
                />
              </div>
              <div>
                <Label>目標儲位</Label>
                <Input
                  value={transferToBin}
                  onChange={(e) => setTransferToBin(e.target.value.toUpperCase())}
                  placeholder="輸入目標儲位編號"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>轉移數量</Label>
                <Input
                  type="number"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(e.target.value)}
                  placeholder="輸入轉移數量"
                  className="mt-1"
                  min="1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTransferOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCompleteTransfer}>
                <ArrowRight className="h-4 w-4 mr-2" />
                確認轉移
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 補貨對話框 */}
        <Dialog open={isReplenishOpen} onOpenChange={setIsReplenishOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>補貨作業</DialogTitle>
              <DialogDescription>
                補充儲位庫存
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>儲位編號</Label>
                <Input
                  value={replenishBin}
                  onChange={(e) => setReplenishBin(e.target.value.toUpperCase())}
                  className="mt-1"
                  disabled
                />
              </div>
              <div>
                <Label>補貨數量</Label>
                <Input
                  type="number"
                  value={replenishQuantity}
                  onChange={(e) => setReplenishQuantity(e.target.value)}
                  placeholder="輸入補貨數量"
                  className="mt-1"
                  min="1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReplenishOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCompleteReplenish}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                確認補貨
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

