'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

/**
 * 薪酬分析儀表板
 * 顯示薪酬相關的數據分析和圖表
 */
export default function CompensationDashboardPage() {
  // TODO: 從 Supabase 獲取真實數據
  const monthlyData = [
    { month: '2023-07', total: 2200000, average: 50000 },
    { month: '2023-08', total: 2250000, average: 51000 },
    { month: '2023-09', total: 2300000, average: 52000 },
    { month: '2023-10', total: 2350000, average: 53000 },
    { month: '2023-11', total: 2400000, average: 54000 },
    { month: '2023-12', total: 2450000, average: 55000 },
  ];

  const departmentData = [
    { department: '研發部', total: 1200000, count: 25 },
    { department: '業務部', total: 800000, count: 20 },
    { department: '人事部', total: 250000, count: 10 },
    { department: '財務部', total: 200000, count: 8 },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">薪酬分析</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          薪酬數據分析和趨勢
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Select defaultValue="2024">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="選擇年度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024 年</SelectItem>
            <SelectItem value="2023">2023 年</SelectItem>
            <SelectItem value="2022">2022 年</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 月度趨勢圖 */}
      <Card>
        <CardHeader>
          <CardTitle>月度薪酬趨勢</CardTitle>
          <CardDescription>過去 6 個月的薪酬總額和平均薪資趨勢</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#8884d8" name="總額 (NT$)" />
              <Line type="monotone" dataKey="average" stroke="#82ca9d" name="平均 (NT$)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 部門分布圖 */}
      <Card>
        <CardHeader>
          <CardTitle>部門薪酬分布</CardTitle>
          <CardDescription>各部門的薪酬總額和員工人數</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#8884d8" name="總額 (NT$)" />
              <Bar dataKey="count" fill="#82ca9d" name="員工人數" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

