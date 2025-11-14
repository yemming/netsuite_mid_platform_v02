'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Activity, TrendingUp, AlertTriangle, Package } from 'lucide-react';

/**
 * 工廠可視化 Kanban
 * 7.1.1 畫面: 工廠可視化 Kanban (Page 59, 68)
 * 
 * UI 要求：
 * - 高對比/深色主題（背景色 #222733）
 * - 包含 Gauge Chart (e.g., "100%")
 * - 包含 KPI Card (e.g., "436", "35")
 * - 包含 Bar Chart
 * - 嚴格複製 Page 59 右上角的儀表板佈局和顏色
 */
export default function FactoryKanbanPage() {
  const [kpiData] = useState({
    totalProduction: 436,
    todayProduction: 35,
    efficiency: 100,
    qualityRate: 98.5
  });

  // 機台稼動率數據
  const machineData = [
    { name: '01區', 稼動率: 95, 目標: 90 },
    { name: '02區', 稼動率: 88, 目標: 90 },
    { name: '03區', 稼動率: 92, 目標: 90 },
    { name: '04區', 稼動率: 87, 目標: 90 },
    { name: '05區', 稼動率: 94, 目標: 90 },
  ];

  // 設備狀態分佈（用於甜甜圈圖）
  const statusData = [
    { name: '運轉', value: 120, color: '#8BC34A' },
    { name: '異常', value: 5, color: '#FF5722' },
    { name: '維修', value: 3, color: '#FFC107' },
    { name: '停機', value: 22, color: '#BDBDBD' },
  ];

  // 簡化的 Gauge Chart 組件（使用 Bar Chart 模擬）
  const GaugeChartComponent = ({ value, max = 100 }: { value: number; max?: number }) => {
    const percentage = (value / max) * 100;
    const data = [
      { name: '已使用', value: percentage },
      { name: '剩餘', value: 100 - percentage }
    ];
    
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis dataKey="name" type="category" hide />
          <Bar dataKey="value" fill={percentage >= 90 ? '#8BC34A' : percentage >= 70 ? '#FFC107' : '#FF5722'}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? (percentage >= 90 ? '#8BC34A' : percentage >= 70 ? '#FFC107' : '#FF5722') : '#374151'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#222733' }}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">工廠可視化 Kanban</h1>
          <p className="text-gray-400">即時監控工廠生產狀態與設備稼動率</p>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#2a3441] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Package className="h-4 w-4" />
                至今逾期未交量
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{kpiData.totalProduction}</div>
              <p className="text-xs text-gray-400 mt-1">累計數量</p>
            </CardContent>
          </Card>

          <Card className="bg-[#2a3441] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                今日產量
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{kpiData.todayProduction}</div>
              <p className="text-xs text-gray-400 mt-1">單位：件</p>
            </CardContent>
          </Card>

          <Card className="bg-[#2a3441] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                整體效率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{kpiData.efficiency}%</div>
              <p className="text-xs text-gray-400 mt-1">目標: 90%</p>
            </CardContent>
          </Card>

          <Card className="bg-[#2a3441] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                品質合格率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{kpiData.qualityRate}%</div>
              <p className="text-xs text-gray-400 mt-1">目標: 98%</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gauge Chart - 整體效率 */}
          <Card className="bg-[#2a3441] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">整體效率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-green-400 mb-2">{kpiData.efficiency}%</div>
                <p className="text-gray-400 text-sm">目標達成率</p>
              </div>
              <GaugeChartComponent value={kpiData.efficiency} />
            </CardContent>
          </Card>

          {/* Bar Chart - 各區稼動率 */}
          <Card className="bg-[#2a3441] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">各區稼動率</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={machineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9ca3af" 
                    style={{ fill: '#9ca3af' }}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    style={{ fill: '#9ca3af' }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f3f4f6'
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#d1d5db' }} />
                  <Bar dataKey="稼動率" fill="#2196F3" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="目標" fill="#607D8B" radius={[8, 8, 0, 0]} opacity={0.5} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Device Status Distribution */}
        <Card className="bg-[#2a3441] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">設備狀態分佈</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statusData.map((status) => (
                <div key={status.name} className="text-center">
                  <div 
                    className="w-20 h-20 rounded-full mx-auto mb-2 flex items-center justify-center"
                    style={{ backgroundColor: status.color }}
                  >
                    <span className="text-2xl font-bold text-white">{status.value}</span>
                  </div>
                  <p className="text-sm text-gray-300">{status.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

