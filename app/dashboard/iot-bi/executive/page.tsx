'use client';

import { useState } from 'react';
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
} from 'recharts';
import { Activity, AlertTriangle, PowerOff, WifiOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * 高階主管應用看板
 * 7.1.2 畫面: 高階主管應用看板 (Page 66)
 * 
 * UI 要求：
 * - 高對比/深色主題（背景色 #222733），Tiled Grid 佈局
 * - 頂部 KPI Card 區 (運轉, 異常, 停機, 斷訊)
 * - 中部 Bar Chart 區 (各區稼動率)
 * - 底部 Data Grid 區 (機台日報表)
 * - 必須實現「下鑽 (Drill-Down)」功能
 */
export default function ExecutiveDashboardPage() {
  const router = useRouter();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);

  // KPI 數據
  const kpiData = {
    運轉: 120,
    異常: 5,
    停機: 22,
    斷訊: 3
  };

  // 各區稼動率數據
  const zoneData = [
    { zone: '01區', 稼動率: 95, 機台數: 30 },
    { zone: '02區', 稼動率: 88, 機台數: 25 },
    { zone: '03區', 稼動率: 92, 機台數: 28 },
    { zone: '04區', 稼動率: 87, 機台數: 22 },
    { zone: '05區', 稼動率: 94, 機台數: 26 },
    { zone: '06區', 稼動率: 90, 機台數: 19 },
  ];

  // 機台日報表數據
  const machineReportData = [
    { 機台號: 'M-001', 區別: '01區', 狀態: '運轉', 稼動率: 95, 產量: 1250, 異常次數: 0 },
    { 機台號: 'M-002', 區別: '01區', 狀態: '運轉', 稼動率: 92, 產量: 1180, 異常次數: 0 },
    { 機台號: 'M-003', 區別: '02區', 狀態: '異常', 稼動率: 45, 產量: 560, 異常次數: 3 },
    { 機台號: 'M-004', 區別: '02區', 狀態: '運轉', 稼動率: 88, 產量: 1100, 異常次數: 1 },
    { 機台號: 'M-005', 區別: '03區', 狀態: '運轉', 稼動率: 96, 產量: 1300, 異常次數: 0 },
    { 機台號: 'M-006', 區別: '03區', 狀態: '停機', 稼動率: 0, 產量: 0, 異常次數: 0 },
    { 機台號: 'M-007', 區別: '04區', 狀態: '運轉', 稼動率: 87, 產量: 1050, 異常次數: 0 },
    { 機台號: 'M-008', 區別: '05區', 狀態: '運轉', 稼動率: 94, 產量: 1220, 異常次數: 0 },
  ];

  // 處理區別下鑽
  const handleZoneClick = (zone: string) => {
    setSelectedZone(zone);
    // 跳轉到各區機台現況查詢頁面（未來實作）
    // router.push(`/dashboard/iot-bi/executive/zone/${zone}`);
    console.log(`下鑽到 ${zone} 的機台現況`);
  };

  // 處理機台下鑽
  const handleMachineClick = (machineId: string) => {
    setSelectedMachine(machineId);
    // 跳轉到單一機台現況查詢頁面（未來實作）
    // router.push(`/dashboard/iot-bi/executive/machine/${machineId}`);
    console.log(`下鑽到機台 ${machineId} 的詳細資訊`);
  };

  // 獲取狀態顏色
  const getStatusColor = (status: string) => {
    switch (status) {
      case '運轉':
        return '#8BC34A';
      case '異常':
        return '#FF5722';
      case '停機':
        return '#BDBDBD';
      case '斷訊':
        return '#FFC107';
      default:
        return '#607D8B';
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#222733' }}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">高階主管應用看板</h1>
          <p className="text-gray-400">決策支援與生產監控總覽</p>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#2a3441] border-gray-700 hover:border-green-500/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-400" />
                運轉
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{kpiData.運轉}</div>
              <p className="text-xs text-gray-400 mt-1">機台數</p>
            </CardContent>
          </Card>

          <Card className="bg-[#2a3441] border-gray-700 hover:border-red-500/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                異常
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{kpiData.異常}</div>
              <p className="text-xs text-gray-400 mt-1">需要處理</p>
            </CardContent>
          </Card>

          <Card className="bg-[#2a3441] border-gray-700 hover:border-gray-500/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <PowerOff className="h-4 w-4 text-gray-400" />
                停機
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-400">{kpiData.停機}</div>
              <p className="text-xs text-gray-400 mt-1">機台數</p>
            </CardContent>
          </Card>

          <Card className="bg-[#2a3441] border-gray-700 hover:border-yellow-500/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-yellow-400" />
                斷訊
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{kpiData.斷訊}</div>
              <p className="text-xs text-gray-400 mt-1">機台數</p>
            </CardContent>
          </Card>
        </div>

        {/* Middle Bar Chart - 各區稼動率 */}
        <Card className="bg-[#2a3441] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">各區稼動率</CardTitle>
            <p className="text-sm text-gray-400">點擊圖表可下鑽查看該區機台現況</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={zoneData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="zone" 
                  stroke="#9ca3af" 
                  style={{ fill: '#9ca3af' }}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  style={{ fill: '#9ca3af' }}
                  domain={[0, 100]}
                  label={{ value: '稼動率 (%)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
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
                <Bar 
                  dataKey="稼動率" 
                  fill="#2196F3" 
                  radius={[8, 8, 0, 0]}
                  onClick={(data) => handleZoneClick(data.zone)}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bottom Data Grid - 機台日報表 */}
        <Card className="bg-[#2a3441] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">機台日報表</CardTitle>
            <p className="text-sm text-gray-400">點擊機台號可下鑽查看該機台詳細資訊</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">機台號</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">區別</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">狀態</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-medium">稼動率</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-medium">產量</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-medium">異常次數</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {machineReportData.map((row, index) => (
                    <tr 
                      key={row.機台號}
                      className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
                        index % 2 === 0 ? 'bg-gray-800/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleMachineClick(row.機台號)}
                          className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                        >
                          {row.機台號}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{row.區別}</td>
                      <td className="py-3 px-4">
                        <span 
                          className="inline-block w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: getStatusColor(row.狀態) }}
                        />
                        <span className="text-gray-300">{row.狀態}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300">{row.稼動率}%</td>
                      <td className="py-3 px-4 text-right text-gray-300">{row.產量.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={row.異常次數 > 0 ? 'text-red-400' : 'text-gray-300'}>
                          {row.異常次數}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleMachineClick(row.機台號)}
                          className="text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 mx-auto"
                        >
                          查看
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

