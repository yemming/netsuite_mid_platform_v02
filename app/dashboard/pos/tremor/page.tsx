'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
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
  Grid
} from '@tremor/react';

// 範例數據
const salesData = [
  { name: '產品 A', 銷售額: 9800, 數量: 245 },
  { name: '產品 B', 銷售額: 4567, 數量: 180 },
  { name: '產品 C', 銷售額: 3908, 數量: 156 },
  { name: '產品 D', 銷售額: 2400, 數量: 120 },
  { name: '產品 E', 銷售額: 1890, 數量: 95 },
];

const revenueData = [
  { date: '1月', 收入: 45000, 支出: 28000 },
  { date: '2月', 收入: 52000, 支出: 30000 },
  { date: '3月', 收入: 48000, 支出: 29000 },
  { date: '4月', 收入: 61000, 支出: 32000 },
  { date: '5月', 收入: 55000, 支出: 31000 },
  { date: '6月', 收入: 67000, 支出: 35000 },
];

const categoryData = [
  { name: '電子產品', value: 35, color: 'blue' },
  { name: '服飾', value: 25, color: 'green' },
  { name: '食品', value: 20, color: 'yellow' },
  { name: '家具', value: 15, color: 'purple' },
  { name: '其他', value: 5, color: 'gray' },
];

const tableData = [
  { id: 1, 客戶: 'ABC公司', 訂單數: 45, 總金額: 125000, 狀態: '活躍' },
  { id: 2, 客戶: 'XYZ企業', 訂單數: 32, 總金額: 89000, 狀態: '活躍' },
  { id: 3, 客戶: 'DEF集團', 訂單數: 28, 總金額: 67000, 狀態: '一般' },
  { id: 4, 客戶: 'GHI公司', 訂單數: 15, 總金額: 34000, 狀態: '一般' },
  { id: 5, 客戶: 'JKL企業', 訂單數: 8, 總金額: 12000, 狀態: '休眠' },
];

export default function TremorShowcasePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Tremor展示 - Dashboard 元件庫
          </CardTitle>
        </CardHeader>
      </Card>

      {/* KPI 指標卡片 */}
      <div>
        <Title className="mb-4">關鍵績效指標 (KPI)</Title>
        <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4">
          <TremorCard decoration="top" decorationColor="blue">
            <Text>總銷售額</Text>
            <Metric>$225,765</Metric>
            <Text className="mt-2 text-green-600">+12.5% 較上月</Text>
          </TremorCard>
          <TremorCard decoration="top" decorationColor="green">
            <Text>訂單數量</Text>
            <Metric>1,234</Metric>
            <Text className="mt-2 text-green-600">+8.2% 較上月</Text>
          </TremorCard>
          <TremorCard decoration="top" decorationColor="yellow">
            <Text>平均訂單金額</Text>
            <Metric>$183</Metric>
            <Text className="mt-2 text-red-600">-2.1% 較上月</Text>
          </TremorCard>
          <TremorCard decoration="top" decorationColor="purple">
            <Text>客戶數</Text>
            <Metric>5,678</Metric>
            <Text className="mt-2 text-green-600">+15.3% 較上月</Text>
          </TremorCard>
        </Grid>
      </div>

      {/* 柱狀圖 */}
      <TremorCard>
        <Title>產品銷售額分析</Title>
        <Text>各產品的銷售額與數量對比</Text>
        <BarChart
          className="mt-6"
          data={salesData}
          index="name"
          categories={['銷售額', '數量']}
          colors={['blue', 'green']}
          yAxisWidth={60}
          showLegend={true}
        />
      </TremorCard>

      {/* 折線圖 */}
      <TremorCard>
        <Title>月度收入與支出趨勢</Title>
        <Text>過去六個月的財務數據</Text>
        <LineChart
          className="mt-6"
          data={revenueData}
          index="date"
          categories={['收入', '支出']}
          colors={['emerald', 'rose']}
          yAxisWidth={60}
          showLegend={true}
        />
      </TremorCard>

      {/* 面積圖 */}
      <TremorCard>
        <Title>收入與支出面積圖</Title>
        <Text>視覺化財務趨勢</Text>
        <AreaChart
          className="mt-6"
          data={revenueData}
          index="date"
          categories={['收入', '支出']}
          colors={['emerald', 'rose']}
          yAxisWidth={60}
          showLegend={true}
        />
      </TremorCard>

      {/* 圓餅圖與表格並排 */}
      <Grid numItems={1} numItemsLg={2} className="gap-6">
        <TremorCard>
          <Title>產品類別分布</Title>
          <Text>各類別銷售占比</Text>
          <DonutChart
            className="mt-6"
            data={categoryData}
            category="value"
            index="name"
            colors={['blue', 'green', 'yellow', 'purple', 'gray']}
            showLabel={true}
          />
        </TremorCard>

        <TremorCard>
          <Title>客戶訂單統計</Title>
          <Text>前五大客戶訂單詳情</Text>
          <Table className="mt-6">
            <TableHead>
              <TableRow>
                <TableHeaderCell>客戶</TableHeaderCell>
                <TableHeaderCell>訂單數</TableHeaderCell>
                <TableHeaderCell>總金額</TableHeaderCell>
                <TableHeaderCell>狀態</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.客戶}</TableCell>
                  <TableCell>{item.訂單數}</TableCell>
                  <TableCell>${item.總金額.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge 
                      color={
                        item.狀態 === '活躍' ? 'emerald' : 
                        item.狀態 === '一般' ? 'yellow' : 'gray'
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
      </Grid>

      {/* 組合圖表 - 多指標展示 */}
      <TremorCard>
        <Title>綜合數據分析</Title>
        <Text>銷售額與數量的多維度對比</Text>
        <Grid numItems={1} numItemsLg={2} className="mt-6 gap-6">
          <div>
            <Text className="mb-2">銷售額分布</Text>
            <BarChart
              data={salesData}
              index="name"
              categories={['銷售額']}
              colors={['blue']}
              yAxisWidth={60}
            />
          </div>
          <div>
            <Text className="mb-2">數量分布</Text>
            <BarChart
              data={salesData}
              index="name"
              categories={['數量']}
              colors={['green']}
              yAxisWidth={60}
            />
          </div>
        </Grid>
      </TremorCard>
    </div>
  );
}
