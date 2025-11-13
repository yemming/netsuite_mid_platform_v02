'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart as LineChartIcon } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

// 範例數據
const lineData = [
  { name: '1月', 收入: 4000, 支出: 2400 },
  { name: '2月', 收入: 3000, 支出: 1398 },
  { name: '3月', 收入: 2000, 支出: 9800 },
  { name: '4月', 收入: 2780, 支出: 3908 },
  { name: '5月', 收入: 1890, 支出: 4800 },
  { name: '6月', 收入: 2390, 支出: 3800 },
];

const barData = [
  { name: '產品 A', 銷售額: 4000, 利潤: 2400 },
  { name: '產品 B', 銷售額: 3000, 利潤: 1398 },
  { name: '產品 C', 銷售額: 2000, 利潤: 9800 },
  { name: '產品 D', 銷售額: 2780, 利潤: 3908 },
  { name: '產品 E', 銷售額: 1890, 利潤: 4800 },
];

const pieData = [
  { name: '電子產品', value: 35, color: '#0088FE' },
  { name: '服飾', value: 25, color: '#00C49F' },
  { name: '食品', value: 20, color: '#FFBB28' },
  { name: '家具', value: 15, color: '#FF8042' },
  { name: '其他', value: 5, color: '#8884d8' },
];

const radarData = [
  { subject: '銷售', A: 120, B: 110, fullMark: 150 },
  { subject: '行銷', A: 98, B: 130, fullMark: 150 },
  { subject: '開發', A: 86, B: 130, fullMark: 150 },
  { subject: '客服', A: 99, B: 100, fullMark: 150 },
  { subject: '研發', A: 85, B: 90, fullMark: 150 },
  { subject: '管理', A: 65, B: 85, fullMark: 150 },
];

const scatterData = [
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
  { x: 150, y: 400, z: 500 },
  { x: 110, y: 280, z: 200 },
];

const composedData = [
  { name: '1月', 銷售額: 4000, 利潤: 2400, 訂單數: 2400 },
  { name: '2月', 銷售額: 3000, 利潤: 1398, 訂單數: 2210 },
  { name: '3月', 銷售額: 2000, 利潤: 9800, 訂單數: 2290 },
  { name: '4月', 銷售額: 2780, 利潤: 3908, 訂單數: 2000 },
  { name: '5月', 銷售額: 1890, 利潤: 4800, 訂單數: 2181 },
  { name: '6月', 銷售額: 2390, 利潤: 3800, 訂單數: 2500 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function RechartsShowcasePage() {
  // Legend with Opacity 效果
  const [opacity, setOpacity] = useState({
    收入: 1,
    支出: 1,
  });

  const handleMouseEnter = (o: any) => {
    const { dataKey } = o;
    setOpacity({ ...opacity, [dataKey]: 0.5 });
  };

  const handleMouseLeave = (o: any) => {
    const { dataKey } = o;
    setOpacity({ ...opacity, [dataKey]: 1 });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <Card className="dark:bg-[#1a2332] dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <LineChartIcon className="h-5 w-5" />
              Recharts 元件展示 - 完整的圖表庫展示
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              展示 Recharts 所有主要元件，參考 NetSuite Next UI 設計風格
            </p>
          </CardHeader>
        </Card>

        {/* Legend with Opacity 效果 - 重點展示 */}
        <Card className="dark:bg-[#1a2332] dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Legend with Opacity 效果</CardTitle>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              提示：將滑鼠懸停在圖例上，對應的數據線會變透明
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={lineData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af"
                  style={{ fill: '#9ca3af' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fill: '#9ca3af' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Legend 
                  onMouseEnter={handleMouseEnter} 
                  onMouseLeave={handleMouseLeave}
                  wrapperStyle={{ color: '#d1d5db' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="收入" 
                  strokeOpacity={opacity.收入} 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="支出" 
                  strokeOpacity={opacity.支出} 
                  stroke="#82ca9d" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 折線圖 */}
        <Card className="dark:bg-[#1a2332] dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">折線圖 (LineChart)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" style={{ fill: '#9ca3af' }} />
                <YAxis stroke="#9ca3af" style={{ fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Legend wrapperStyle={{ color: '#d1d5db' }} />
                <Line type="monotone" dataKey="收入" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="支出" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 柱狀圖 */}
        <Card className="dark:bg-[#1a2332] dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">柱狀圖 (BarChart)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" style={{ fill: '#9ca3af' }} />
                <YAxis stroke="#9ca3af" style={{ fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Legend wrapperStyle={{ color: '#d1d5db' }} />
                <Bar dataKey="銷售額" fill="#8884d8" />
                <Bar dataKey="利潤" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 面積圖 */}
        <Card className="dark:bg-[#1a2332] dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">面積圖 (AreaChart)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" style={{ fill: '#9ca3af' }} />
                <YAxis stroke="#9ca3af" style={{ fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Legend wrapperStyle={{ color: '#d1d5db' }} />
                <Area type="monotone" dataKey="收入" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="支出" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 圓餅圖與雷達圖並排 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="dark:bg-[#1a2332] dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">圓餅圖 (PieChart)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f3f4f6'
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#d1d5db' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="dark:bg-[#1a2332] dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">雷達圖 (RadarChart)</CardTitle>
            </CardHeader>
            <CardContent>
              <RadarChart
                style={{ width: '100%', height: '100%', maxWidth: '500px', maxHeight: '80vh', aspectRatio: 1 }}
                responsive
                outerRadius="80%"
                data={radarData}
                margin={{
                  top: 20,
                  left: 20,
                  right: 20,
                  bottom: 20,
                }}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis />
                <Radar name="團隊 A" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Radar name="團隊 B" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </CardContent>
          </Card>
        </div>

        {/* 散點圖 */}
        <Card className="dark:bg-[#1a2332] dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">散點圖 (ScatterChart)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" dataKey="x" name="X 軸" stroke="#9ca3af" style={{ fill: '#9ca3af' }} />
                <YAxis type="number" dataKey="y" name="Y 軸" stroke="#9ca3af" style={{ fill: '#9ca3af' }} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Scatter name="數據點" data={scatterData} fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 組合圖表 */}
        <Card className="dark:bg-[#1a2332] dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">組合圖表 (ComposedChart)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={composedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" style={{ fill: '#9ca3af' }} />
                <YAxis yAxisId="left" stroke="#9ca3af" style={{ fill: '#9ca3af' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" style={{ fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Legend wrapperStyle={{ color: '#d1d5db' }} />
                <Area yAxisId="left" type="monotone" dataKey="銷售額" fill="#8884d8" stroke="#8884d8" />
                <Bar yAxisId="right" dataKey="訂單數" fill="#82ca9d" />
                <Line yAxisId="left" type="monotone" dataKey="利潤" stroke="#ff7300" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 進階折線圖 - 帶有動畫和漸變 */}
        <Card className="dark:bg-[#1a2332] dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">進階折線圖 - 動畫與漸變效果</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" style={{ fill: '#9ca3af' }} />
                <YAxis stroke="#9ca3af" style={{ fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Legend wrapperStyle={{ color: '#d1d5db' }} />
                <Area type="monotone" dataKey="收入" stroke="#8884d8" fillOpacity={1} fill="url(#colorUv)" />
                <Area type="monotone" dataKey="支出" stroke="#82ca9d" fillOpacity={1} fill="url(#colorPv)" />
                <Line type="monotone" dataKey="收入" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="支出" stroke="#82ca9d" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 堆疊柱狀圖 */}
        <Card className="dark:bg-[#1a2332] dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">堆疊柱狀圖</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" style={{ fill: '#9ca3af' }} />
                <YAxis stroke="#9ca3af" style={{ fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Legend wrapperStyle={{ color: '#d1d5db' }} />
                <Bar dataKey="銷售額" stackId="a" fill="#8884d8" />
                <Bar dataKey="利潤" stackId="a" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
