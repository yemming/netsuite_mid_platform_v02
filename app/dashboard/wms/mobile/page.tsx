'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Scan, 
  Package, 
  ShoppingCart,
  Warehouse,
  CheckCircle2,
  MapPin,
  Clock,
  TrendingUp,
  BarChart3
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

interface MobileTask {
  id: string;
  type: 'receiving' | 'putaway' | 'picking' | 'cycle-count';
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
}

export default function WMSMobilePage() {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState<MobileTask[]>([
    {
      id: '1',
      type: 'receiving',
      title: '收貨作業 - PO-2024-001',
      description: '採購單 PO-2024-001 的收貨作業',
      status: 'pending',
      priority: 'high',
      createdAt: new Date(),
    },
    {
      id: '2',
      type: 'picking',
      title: '揀貨作業 - WAVE-001',
      description: '波次 WAVE-001 的揀貨作業',
      status: 'in-progress',
      priority: 'high',
      createdAt: new Date(),
    },
    {
      id: '3',
      type: 'cycle-count',
      title: '週期盤點 - A區',
      description: 'A區儲位的週期盤點作業',
      status: 'pending',
      priority: 'medium',
      createdAt: new Date(),
    },
  ]);

  const [scanHistory, setScanHistory] = useState<Array<{
    id: string;
    barcode: string;
    itemName: string;
    action: string;
    timestamp: Date;
  }>>([]);

  // 處理掃描
  const handleScan = () => {
    if (!barcodeInput.trim()) {
      showToast('請輸入或掃描條碼', 'error');
      return;
    }

    // 模擬商品資料
    const mockItems: Record<string, string> = {
      '4710012345678': '可口可樂 330ml',
      '4710012345679': '統一泡麵',
      '4710012345680': '衛生紙',
      '4710012345681': '礦泉水',
      '4710012345682': '麵包',
    };

    const itemName = mockItems[barcodeInput.trim()] || '未知商品';
    const action = activeTab === 'receiving' ? '收貨' : 
                   activeTab === 'picking' ? '揀貨' : 
                   activeTab === 'putaway' ? '上架' : '盤點';

    // 記錄掃描歷史
    const scanRecord = {
      id: `SCAN${Date.now()}`,
      barcode: barcodeInput.trim(),
      itemName,
      action,
      timestamp: new Date(),
    };
    setScanHistory([scanRecord, ...scanHistory]);

    showToast(`${action}：${itemName}`, 'success');
    setBarcodeInput('');
  };

  // 完成任務
  const handleCompleteTask = (taskId: string) => {
    setTasks(tasks.map((task) => 
      task.id === taskId 
        ? { ...task, status: 'completed' as const }
        : task
    ));
    showToast('任務已完成', 'success');
  };

  // 開始任務
  const handleStartTask = (taskId: string) => {
    setTasks(tasks.map((task) => 
      task.id === taskId 
        ? { ...task, status: 'in-progress' as const }
        : task
    ));
    showToast('任務已開始', 'success');
  };

  // 獲取任務統計
  const taskStats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] pb-6">
      <div className="max-w-4xl mx-auto p-4">
        {/* 標題列 */}
        <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">WMS 行動裝置</h1>
            </div>
            <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
              {taskStats.inProgress} 進行中
            </Badge>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <Card className="dark:bg-[#1a2332] dark:border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{taskStats.total}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">總任務</p>
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-[#1a2332] dark:border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{taskStats.pending}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">待處理</p>
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-[#1a2332] dark:border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{taskStats.inProgress}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">進行中</p>
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-[#1a2332] dark:border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{taskStats.completed}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">已完成</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 主要內容區域 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 dark:bg-gray-800">
            <TabsTrigger value="tasks">任務列表</TabsTrigger>
            <TabsTrigger value="receiving">收貨</TabsTrigger>
            <TabsTrigger value="picking">揀貨</TabsTrigger>
            <TabsTrigger value="putaway">上架</TabsTrigger>
          </TabsList>

          {/* 任務列表 */}
          <TabsContent value="tasks" className="space-y-4">
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                  <BarChart3 className="h-4 w-4" />
                  我的任務
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>尚無任務</p>
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {task.type === 'receiving' && <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                            {task.type === 'picking' && <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />}
                            {task.type === 'putaway' && <Warehouse className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                            {task.type === 'cycle-count' && <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                            <span className="font-medium text-gray-900 dark:text-white">{task.title}</span>
                          </div>
                          <Badge
                            variant={
                              task.status === 'completed'
                                ? 'default'
                                : task.status === 'in-progress'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="dark:border-gray-600 dark:text-gray-300"
                          >
                            {task.status === 'completed'
                              ? '已完成'
                              : task.status === 'in-progress'
                              ? '進行中'
                              : '待處理'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            {new Date(task.createdAt).toLocaleString('zh-TW')}
                          </div>
                          <div className="flex gap-2">
                            {task.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleStartTask(task.id)}
                              >
                                開始
                              </Button>
                            )}
                            {task.status === 'in-progress' && (
                              <Button
                                size="sm"
                                onClick={() => handleCompleteTask(task.id)}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                完成
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 收貨 */}
          <TabsContent value="receiving" className="space-y-4">
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                  <Scan className="h-4 w-4" />
                  行動收貨掃描
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
                    <Button onClick={handleScan}>
                      <Scan className="h-4 w-4 mr-2" />
                      掃描
                    </Button>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-2">
                      💡 行動收貨功能：
                    </p>
                    <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <p>• 即時掃描條碼進行收貨</p>
                      <p>• 自動建議儲位位置</p>
                      <p>• 支援品質檢驗流程</p>
                      <p>• 即時更新庫存記錄</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 揀貨 */}
          <TabsContent value="picking" className="space-y-4">
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                  <Scan className="h-4 w-4" />
                  行動揀貨掃描
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="掃描條碼確認揀貨"
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
                    <Button onClick={handleScan}>
                      <Scan className="h-4 w-4 mr-2" />
                      掃描
                    </Button>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-xs font-medium text-green-900 dark:text-green-200 mb-2">
                      💡 行動揀貨功能：
                    </p>
                    <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                      <p>• 引導至正確儲位位置</p>
                      <p>• 強制掃描確保準確性</p>
                      <p>• 即時驗證揀貨資料</p>
                      <p>• 減少揀貨錯誤</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 上架 */}
          <TabsContent value="putaway" className="space-y-4">
            <Card className="dark:bg-[#1a2332] dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                  <Scan className="h-4 w-4" />
                  行動上架掃描
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="掃描商品條碼"
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
                    <Button onClick={handleScan}>
                      <Scan className="h-4 w-4 mr-2" />
                      掃描
                    </Button>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                    <p className="text-xs font-medium text-purple-900 dark:text-purple-200 mb-2">
                      💡 行動上架功能：
                    </p>
                    <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                      <p>• 逐步引導上架流程</p>
                      <p>• 確保商品存放正確位置</p>
                      <p>• 即時更新儲位庫存</p>
                      <p>• 優化倉庫空間利用</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 掃描歷史 */}
        {scanHistory.length > 0 && (
          <Card className="mt-4 dark:bg-[#1a2332] dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                <TrendingUp className="h-4 w-4" />
                掃描歷史
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {scanHistory.slice(0, 10).map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span className="text-gray-900 dark:text-white">{scan.itemName}</span>
                      <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                        {scan.action}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(scan.timestamp).toLocaleTimeString('zh-TW')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

