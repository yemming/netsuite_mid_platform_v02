'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Calendar } from 'lucide-react';

export default function ScheduleStatusPage() {
  const [machines] = useState(['F24-01', 'F24-02', 'DS-01', 'F10-01']);
  const dates = ['02/03', '02/04', '02/05', '02/06', '02/07', '02/08', '02/09'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-time':
        return 'bg-green-500 text-white';
      case 'delayed':
        return 'bg-red-500 text-white';
      case 'scheduled':
        return 'bg-blue-500 text-white';
      case 'completed':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-300 text-gray-700';
    }
  };

  // 模擬資料：每個機台在每個日期的狀態
  const getCellStatus = (machine: string, date: string) => {
    const rand = Math.random();
    if (rand < 0.3) return 'on-time';
    if (rand < 0.5) return 'scheduled';
    if (rand < 0.7) return 'completed';
    if (rand < 0.9) return 'delayed';
    return 'empty';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="bg-card border-b border-border px-8 py-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Search className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">機台排程狀況查詢</h1>
        </div>
        <p className="text-muted-foreground">
          以甘特圖形式查詢機台排程狀況
        </p>
      </div>

      {/* 圖例 */}
      <Card>
        <CardHeader>
          <CardTitle>狀態圖例</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-500"></div>
              <span className="text-sm">生產如期完工（運行綠）</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-red-500"></div>
              <span className="text-sm">生產逾期（異常紅）</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-500"></div>
              <span className="text-sm">已排程（製造藍）</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gray-300"></div>
              <span className="text-sm">未排產（停機灰）</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 甘特圖表格 */}
      <Card>
        <CardHeader>
          <CardTitle>排程甘特圖</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-border p-3 text-left bg-muted font-medium">機台代號</th>
                    {dates.map((date) => (
                      <th key={date} className="border border-border p-3 text-center bg-muted font-medium min-w-[100px]">
                        {date}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {machines.map((machine) => (
                    <tr key={machine}>
                      <td className="border border-border p-3 font-medium bg-card">{machine}</td>
                      {dates.map((date) => {
                        const status = getCellStatus(machine, date);
                        return (
                          <td
                            key={`${machine}-${date}`}
                            className={`border border-border p-3 text-center ${
                              status === 'empty' ? 'bg-background' : getStatusColor(status)
                            }`}
                          >
                            {status !== 'empty' && (
                              <div className="text-xs">
                                {status === 'on-time' && '如期'}
                                {status === 'delayed' && '逾期'}
                                {status === 'scheduled' && '已排'}
                                {status === 'completed' && '完工'}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

