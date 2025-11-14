'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

/**
 * 考勤分析儀表板
 * 顯示考勤相關的數據分析和圖表
 */
export default function AttendanceDashboardPage() {
  // TODO: 從 Supabase 獲取真實數據
  const monthlyData = [
    { month: '2023-07', attendanceRate: 92.5, lateCount: 15 },
    { month: '2023-08', attendanceRate: 93.2, lateCount: 12 },
    { month: '2023-09', attendanceRate: 94.1, lateCount: 10 },
    { month: '2023-10', attendanceRate: 94.8, lateCount: 8 },
    { month: '2023-11', attendanceRate: 95.0, lateCount: 6 },
    { month: '2023-12', attendanceRate: 95.2, lateCount: 5 },
  ];

  const statusData = [
    { name: '正常', value: 75, color: '#8884d8' },
    { name: '遲到', value: 10, color: '#ffc658' },
    { name: '請假', value: 12, color: '#82ca9d' },
    { name: '其他', value: 3, color: '#ff7300' },
  ];

  const departmentData = [
    { department: '研發部', attendanceRate: 96.5, lateCount: 2 },
    { department: '業務部', attendanceRate: 94.2, lateCount: 5 },
    { department: '人事部', attendanceRate: 95.8, lateCount: 1 },
    { department: '財務部', attendanceRate: 97.0, lateCount: 0 },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">考勤分析</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          考勤數據分析和趨勢
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
          <CardTitle>月度出勤率趨勢</CardTitle>
          <CardDescription>過去 6 個月的出勤率和遲到次數趨勢</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="attendanceRate" stroke="#8884d8" name="出勤率 (%)" />
              <Line type="monotone" dataKey="lateCount" stroke="#ff7300" name="遲到次數" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 狀態分布圖 */}
        <Card>
          <CardHeader>
            <CardTitle>考勤狀態分布</CardTitle>
            <CardDescription>當月考勤狀態比例</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 部門分布圖 */}
        <Card>
          <CardHeader>
            <CardTitle>部門考勤比較</CardTitle>
            <CardDescription>各部門的出勤率和遲到次數</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="attendanceRate" fill="#8884d8" name="出勤率 (%)" />
                <Bar dataKey="lateCount" fill="#ff7300" name="遲到次數" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

