'use client';

import { 
  Card as TremorCard, 
  Title, 
  Text, 
  Metric, 
  BarChart, 
  LineChart, 
  AreaChart,
  DonutChart,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Grid,
  Flex,
  ProgressBar,
  Select,
  SelectItem,
  TextInput
} from '@tremor/react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingCart,
  Activity,
  Search,
  Filter,
  Download,
  Share2,
  Settings,
  Menu,
  ChevronDown,
  Calendar,
  Bell,
  User
} from 'lucide-react';
import { useState } from 'react';

// 範例數據
const salesData = [
  { name: 'Q1', sales: 125000, orders: 342, customers: 89 },
  { name: 'Q2', sales: 145000, orders: 398, customers: 102 },
  { name: 'Q3', sales: 138000, orders: 375, customers: 95 },
  { name: 'Q4', sales: 162000, orders: 445, customers: 118 },
];

const monthlyRevenue = [
  { month: '1月', revenue: 45000, expense: 28000, profit: 17000 },
  { month: '2月', revenue: 52000, expense: 30000, profit: 22000 },
  { month: '3月', revenue: 48000, expense: 29000, profit: 19000 },
  { month: '4月', revenue: 61000, expense: 32000, profit: 29000 },
  { month: '5月', revenue: 55000, expense: 31000, profit: 24000 },
  { month: '6月', revenue: 67000, expense: 35000, profit: 32000 },
];

const categoryDistribution = [
  { name: '電子產品', value: 35, color: 'blue' },
  { name: '服飾配件', value: 28, color: 'emerald' },
  { name: '食品飲料', value: 22, color: 'amber' },
  { name: '家具家飾', value: 12, color: 'violet' },
  { name: '其他', value: 3, color: 'gray' },
];

const customerTableData = [
  { id: 1, 客戶名稱: 'ABC科技股份有限公司', 訂單數: 45, 總金額: 125000, 狀態: '活躍', 進度: 85 },
  { id: 2, 客戶名稱: 'XYZ企業集團', 訂單數: 32, 總金額: 89000, 狀態: '活躍', 進度: 72 },
  { id: 3, 客戶名稱: 'DEF製造業', 訂單數: 28, 總金額: 67000, 狀態: '一般', 進度: 58 },
  { id: 4, 客戶名稱: 'GHI貿易公司', 訂單數: 15, 總金額: 34000, 狀態: '一般', 進度: 45 },
  { id: 5, 客戶名稱: 'JKL零售連鎖', 訂單數: 8, 總金額: 12000, 狀態: '休眠', 進度: 20 },
];

const performanceMetrics = [
  { name: '轉換率', value: 68, target: 75 },
  { name: '客戶滿意度', value: 92, target: 90 },
  { name: '庫存周轉', value: 45, target: 50 },
  { name: '交付準時率', value: 88, target: 85 },
];

export default function TremorShowcasePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('6個月');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 頁面標題區 - NetSuite 風格 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Tremor 元件展示
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              完整的 Tremor 元件庫展示，參考 NetSuite Next UI 設計風格
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <TextInput
                placeholder="搜尋元件..."
                className="pl-10 pr-4 py-2"
              />
            </div>
            <Select
              value={selectedPeriod}
              onValueChange={setSelectedPeriod}
              className="w-40"
            >
              <SelectItem value="1個月">1個月</SelectItem>
              <SelectItem value="3個月">3個月</SelectItem>
              <SelectItem value="6個月">6個月</SelectItem>
              <SelectItem value="12個月">12個月</SelectItem>
            </Select>
            <button className="p-2 border border-gray-300 dark:border-gray-700 dark:bg-[#1a2332] rounded-lg hover:bg-gray-100 dark:hover:bg-[#252f3f] transition-colors">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button className="p-2 border border-gray-300 dark:border-gray-700 dark:bg-[#1a2332] rounded-lg hover:bg-gray-100 dark:hover:bg-[#252f3f] transition-colors">
              <Download className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button className="p-2 border border-gray-300 dark:border-gray-700 dark:bg-[#1a2332] rounded-lg hover:bg-gray-100 dark:hover:bg-[#252f3f] transition-colors">
              <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* KPI 指標卡片 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Title className="text-xl font-semibold dark:text-white">關鍵績效指標 (Metric)</Title>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              查看詳情
            </button>
          </div>
          <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4">
            <TremorCard 
              decoration="top" 
              decorationColor="violet"
              className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700"
            >
              <Flex justifyContent="start" className="space-x-4">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
                  <DollarSign className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1">
                  <Text className="text-gray-600 dark:text-gray-300">總銷售額</Text>
                  <Metric className="text-2xl dark:text-white">$570,000</Metric>
                  <Flex className="mt-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mr-1" />
                    <Text className="text-emerald-600 dark:text-emerald-400">+12.5%</Text>
                    <Text className="text-gray-500 dark:text-gray-400 ml-1">較上月</Text>
                  </Flex>
                </div>
              </Flex>
            </TremorCard>

            <TremorCard 
              decoration="top" 
              decorationColor="violet"
              className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700"
            >
              <Flex justifyContent="start" className="space-x-4">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1">
                  <Text className="text-gray-600 dark:text-gray-300">訂單數量</Text>
                  <Metric className="text-2xl dark:text-white">1,560</Metric>
                  <Flex className="mt-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mr-1" />
                    <Text className="text-emerald-600 dark:text-emerald-400">+8.2%</Text>
                    <Text className="text-gray-500 dark:text-gray-400 ml-1">較上月</Text>
                  </Flex>
                </div>
              </Flex>
            </TremorCard>

            <TremorCard 
              decoration="top" 
              decorationColor="violet"
              className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700"
            >
              <Flex justifyContent="start" className="space-x-4">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
                  <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1">
                  <Text className="text-gray-600 dark:text-gray-300">活躍客戶</Text>
                  <Metric className="text-2xl dark:text-white">404</Metric>
                  <Flex className="mt-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mr-1" />
                    <Text className="text-emerald-600 dark:text-emerald-400">+15.3%</Text>
                    <Text className="text-gray-500 dark:text-gray-400 ml-1">較上月</Text>
                  </Flex>
                </div>
              </Flex>
            </TremorCard>

            <TremorCard 
              decoration="top" 
              decorationColor="violet"
              className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700"
            >
              <Flex justifyContent="start" className="space-x-4">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
                  <Activity className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1">
                  <Text className="text-gray-600 dark:text-gray-300">平均訂單金額</Text>
                  <Metric className="text-2xl dark:text-white">$365</Metric>
                  <Flex className="mt-2">
                    <Text className="text-rose-600 dark:text-rose-400">-2.1%</Text>
                    <Text className="text-gray-500 dark:text-gray-400 ml-1">較上月</Text>
                  </Flex>
                </div>
              </Flex>
            </TremorCard>
          </Grid>
        </div>

        {/* 圖表元件展示 */}
        <div>
          <Title className="text-xl font-semibold dark:text-white mb-4">圖表元件 (Charts)</Title>
          
          {/* 柱狀圖 */}
          <TremorCard className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Title className="dark:text-white">柱狀圖 (BarChart)</Title>
                <Text className="dark:text-gray-300">季度銷售分析</Text>
              </div>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#252f3f] rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <BarChart
              data={salesData}
              index="name"
              categories={['sales']}
              colors={['violet']}
              yAxisWidth={80}
              showLegend={true}
              margin={{ left: 10, right: 10 }}
              valueFormatter={(value) => `$${value.toLocaleString()}`}
            />
          </TremorCard>

          {/* 折線圖與面積圖 */}
          <Grid numItems={1} numItemsLg={2} className="gap-6 mb-6">
            <TremorCard className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700">
              <Title className="dark:text-white">折線圖 (LineChart)</Title>
              <Text className="dark:text-gray-300">月度收入趨勢</Text>
              <LineChart
                data={monthlyRevenue}
                index="month"
                categories={['revenue', 'expense', 'profit']}
                colors={['emerald', 'rose', 'blue']}
                yAxisWidth={80}
                showLegend={true}
                margin={{ left: 10, right: 10 }}
                valueFormatter={(value) => `$${value.toLocaleString()}`}
              />
            </TremorCard>

            <TremorCard className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700">
              <Title className="dark:text-white">面積圖 (AreaChart)</Title>
              <Text className="dark:text-gray-300">收入與支出對比</Text>
              <AreaChart
                data={monthlyRevenue}
                index="month"
                categories={['revenue', 'expense']}
                colors={['emerald', 'rose']}
                yAxisWidth={80}
                showLegend={true}
                margin={{ left: 10, right: 10 }}
                valueFormatter={(value) => `$${value.toLocaleString()}`}
              />
            </TremorCard>
          </Grid>

          {/* 圓餅圖 */}
          <TremorCard className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700 mb-6">
            <Title className="dark:text-white">圓餅圖 (DonutChart)</Title>
            <Text className="dark:text-gray-300">產品類別分布</Text>
            <DonutChart
              data={categoryDistribution}
              category="value"
              index="name"
              colors={['blue', 'emerald', 'amber', 'violet', 'gray']}
              showLabel={true}
              valueFormatter={(value) => `${value}%`}
            />
          </TremorCard>
        </div>

        {/* 輸入元件展示 */}
        <div>
          <Title className="text-xl font-semibold dark:text-white mb-4">輸入元件 (Inputs)</Title>
          <Grid numItems={1} numItemsLg={3} className="gap-6">
            <TremorCard className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700">
              <Title className="dark:text-white">文字輸入 (TextInput)</Title>
              <Text className="dark:text-gray-300 mb-4">基本文字輸入框</Text>
              <div className="space-y-4">
                <TextInput placeholder="輸入文字..." />
                <TextInput placeholder="帶圖示的輸入框" icon={Search} />
                <TextInput placeholder="錯誤狀態" error={true} errorMessage="此欄位為必填" />
              </div>
            </TremorCard>

            <TremorCard className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700">
              <Title className="dark:text-white">下拉選單 (Select)</Title>
              <Text className="dark:text-gray-300 mb-4">選擇單一選項</Text>
              <div className="space-y-4">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectItem value="1個月">1個月</SelectItem>
                  <SelectItem value="3個月">3個月</SelectItem>
                  <SelectItem value="6個月">6個月</SelectItem>
                  <SelectItem value="12個月">12個月</SelectItem>
                </Select>
                <Select placeholder="選擇期間...">
                  <SelectItem value="today">今天</SelectItem>
                  <SelectItem value="week">本週</SelectItem>
                  <SelectItem value="month">本月</SelectItem>
                </Select>
              </div>
            </TremorCard>

            <TremorCard className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700">
              <Title className="dark:text-white">更多輸入選項</Title>
              <Text className="dark:text-gray-300 mb-4">其他輸入元件展示</Text>
              <div className="space-y-4">
                <TextInput placeholder="帶圖示的輸入框" icon={Calendar} />
                <TextInput placeholder="數字輸入" type="number" />
                <TextInput placeholder="密碼輸入" type="password" />
              </div>
            </TremorCard>
          </Grid>
        </div>

        {/* 表格元件 */}
        <TremorCard className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Title className="dark:text-white">表格元件 (Table)</Title>
              <Text className="dark:text-gray-300">客戶訂單統計</Text>
            </div>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              匯出報表
            </button>
          </div>
          <Table className="mt-6">
            <TableHead>
              <TableRow>
                <TableHeaderCell className="dark:text-gray-300">客戶名稱</TableHeaderCell>
                <TableHeaderCell className="dark:text-gray-300">訂單數</TableHeaderCell>
                <TableHeaderCell className="dark:text-gray-300">總金額</TableHeaderCell>
                <TableHeaderCell className="dark:text-gray-300">進度</TableHeaderCell>
                <TableHeaderCell className="dark:text-gray-300">狀態</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customerTableData.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-[#252f3f] transition-colors">
                  <TableCell className="font-medium dark:text-white">{item.客戶名稱}</TableCell>
                  <TableCell className="dark:text-gray-300">{item.訂單數}</TableCell>
                  <TableCell className="dark:text-gray-300">${item.總金額.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            item.進度 >= 70 ? 'bg-emerald-500' : 
                            item.進度 >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${item.進度}%` }}
                        />
                      </div>
                      <Text className="text-sm text-gray-600 dark:text-gray-300 w-12 text-right">
                        {item.進度}%
                      </Text>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      color={
                        item.狀態 === '活躍' ? 'emerald' : 
                        item.狀態 === '一般' ? 'amber' : 'gray'
                      }
                    >
                      {item.狀態}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TremorCard>

        {/* 進度條與徽章 */}
        <Grid numItems={1} numItemsLg={2} className="gap-6">
          <TremorCard className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700">
            <Title className="dark:text-white">進度條 (ProgressBar)</Title>
            <Text className="dark:text-gray-300 mb-4">績效指標追蹤</Text>
            <div className="space-y-4">
              {performanceMetrics.map((metric) => (
                <div key={metric.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Text className="text-gray-700 dark:text-gray-300">{metric.name}</Text>
                    <Text className="font-semibold dark:text-white">
                      {metric.value}% / {metric.target}%
                    </Text>
                  </div>
                  <ProgressBar 
                    value={metric.value} 
                    color={metric.value >= metric.target ? 'emerald' : 'amber'}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </TremorCard>

          <TremorCard className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700">
            <Title className="dark:text-white">徽章 (Badge)</Title>
            <Text className="dark:text-gray-300 mb-4">狀態標籤展示</Text>
            <div className="flex flex-wrap gap-3">
              <Badge color="emerald">成功</Badge>
              <Badge color="amber">警告</Badge>
              <Badge color="rose">錯誤</Badge>
              <Badge color="blue">資訊</Badge>
              <Badge color="violet">主要</Badge>
              <Badge color="gray">預設</Badge>
            </div>
          </TremorCard>
        </Grid>
      </div>
    </div>
  );
}
