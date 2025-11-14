'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Activity, TrendingUp } from 'lucide-react';

/**
 * 現場輪播看板
 * 7.1.3 畫面: 現場輪播看板 (Page 67)
 * 
 * UI 要求：
 * - 高對比/深色主題（背景色 #222733）
 * - 必須實現自動輪播 (Carousel)
 * - 視圖 1 (機台總覽): Status Grid 顯示第03區所有機台 (127-150) 及其狀態顏色
 * - 視圖 2 (效率總覽): 顯示第03區的總體效率 (e.g., "90%")
 * - 視圖 3 (異常提醒): [高優先級] 當機台異常時，必須顯示一個全螢幕的紅色警示
 */
export default function CarouselDashboardPage() {
  const [currentView, setCurrentView] = useState(0);
  const [alertMachines, setAlertMachines] = useState([
    { id: '150', reason: '手動停機' },
    { id: '142', reason: '設備故障' },
  ]);

  // 第03區機台數據 (127-150)
  const zone3Machines = Array.from({ length: 24 }, (_, i) => {
    const machineId = 127 + i;
    const statuses = ['運轉', '異常', '維修', '停機'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    return {
      id: machineId.toString(),
      status,
      efficiency: status === '運轉' ? Math.floor(Math.random() * 20) + 80 : 0
    };
  });

  // 自動輪播
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentView((prev) => (prev + 1) % 3);
    }, 10000); // 每 10 秒切換一次

    return () => clearInterval(interval);
  }, []);

  // 獲取狀態顏色
  const getStatusColor = (status: string) => {
    switch (status) {
      case '運轉':
        return '#8BC34A'; // 運行綠
      case '異常':
        return '#FF5722'; // 異常紅
      case '維修':
        return '#FFC107'; // 維修黃
      case '停機':
        return '#BDBDBD'; // 停機灰
      default:
        return '#607D8B';
    }
  };

  // 計算第03區總體效率
  const zone3Efficiency = Math.round(
    zone3Machines
      .filter(m => m.status === '運轉')
      .reduce((sum, m) => sum + m.efficiency, 0) / 
    zone3Machines.filter(m => m.status === '運轉').length || 1
  );

  // 檢查是否有異常機台
  const hasAlerts = alertMachines.length > 0;

  // 如果有異常，優先顯示異常提醒
  if (hasAlerts && currentView === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FF5722' }}>
        <div className="text-center p-8">
          <AlertTriangle className="h-24 w-24 text-white mx-auto mb-6 animate-pulse" />
          <h1 className="text-6xl font-bold text-white mb-4">機台異常提醒</h1>
          {alertMachines.map((machine) => (
            <div key={machine.id} className="mb-4">
              <p className="text-4xl font-bold text-white mb-2">機台號碼: {machine.id}</p>
              <p className="text-3xl text-white/90">異常原因: {machine.reason}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#222733' }}>
      <div className="container mx-auto p-6">
        {/* 視圖 1: 機台總覽 - Status Grid */}
        {currentView === 0 && (
          <div className="space-y-6">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-white mb-2">第03區機台總覽</h1>
              <p className="text-gray-400">機台編號: 127-150</p>
            </div>
            <Card className="bg-[#2a3441] border-gray-700">
              <CardContent className="p-6">
                <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3">
                  {zone3Machines.map((machine) => (
                    <div
                      key={machine.id}
                      className="aspect-square rounded-lg flex flex-col items-center justify-center p-2 transition-transform hover:scale-110"
                      style={{ backgroundColor: getStatusColor(machine.status) }}
                    >
                      <span className="text-xs font-bold text-white mb-1">{machine.id}</span>
                      <span className="text-[10px] text-white/80">{machine.status}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8BC34A' }} />
                    <span className="text-gray-300">運轉</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FF5722' }} />
                    <span className="text-gray-300">異常</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFC107' }} />
                    <span className="text-gray-300">維修</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#BDBDBD' }} />
                    <span className="text-gray-300">停機</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 視圖 2: 效率總覽 */}
        {currentView === 1 && (
          <div className="flex items-center justify-center min-h-[80vh]">
            <Card className="bg-[#2a3441] border-gray-700 w-full max-w-4xl">
              <CardHeader>
                <CardTitle className="text-white text-3xl text-center">第03區效率總覽</CardTitle>
              </CardHeader>
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="mb-8">
                    <Activity className="h-24 w-24 text-green-400 mx-auto mb-6" />
                    <div className="text-8xl font-bold text-green-400 mb-4">{zone3Efficiency}%</div>
                    <p className="text-2xl text-gray-400">總體效率</p>
                  </div>
                  <div className="grid grid-cols-3 gap-6 mt-12">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white mb-2">
                        {zone3Machines.filter(m => m.status === '運轉').length}
                      </div>
                      <p className="text-gray-400">運轉中</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white mb-2">
                        {zone3Machines.filter(m => m.status === '異常').length}
                      </div>
                      <p className="text-gray-400">異常</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white mb-2">
                        {zone3Machines.filter(m => m.status === '停機' || m.status === '維修').length}
                      </div>
                      <p className="text-gray-400">停機/維修</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 視圖 3: 異常提醒（如果有異常） */}
        {currentView === 2 && hasAlerts && (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center p-8 w-full">
              <AlertTriangle className="h-32 w-32 text-red-500 mx-auto mb-8 animate-pulse" />
              <h1 className="text-6xl font-bold text-red-500 mb-8">機台異常提醒</h1>
              {alertMachines.map((machine) => (
                <div key={machine.id} className="mb-6">
                  <p className="text-5xl font-bold text-white mb-4">機台號碼: {machine.id}</p>
                  <p className="text-4xl text-red-400">異常原因: {machine.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 視圖 3: 無異常時顯示正常狀態 */}
        {currentView === 2 && !hasAlerts && (
          <div className="flex items-center justify-center min-h-[80vh]">
            <Card className="bg-[#2a3441] border-gray-700 w-full max-w-4xl">
              <CardContent className="p-12">
                <div className="text-center">
                  <TrendingUp className="h-24 w-24 text-green-400 mx-auto mb-6" />
                  <h2 className="text-4xl font-bold text-white mb-4">系統運作正常</h2>
                  <p className="text-2xl text-gray-400">所有機台運轉正常，無異常狀況</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 輪播指示器 */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              onClick={() => setCurrentView(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentView === index ? 'bg-white w-8' : 'bg-gray-600'
              }`}
              aria-label={`切換到視圖 ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

