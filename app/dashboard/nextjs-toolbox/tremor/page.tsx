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
  SelectItem
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
  Settings
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// 範例數據 - 模擬 NetSuite 風格的業務數據
// 使用英文欄位名稱以確保 Tremor 圖表正常運作
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
  const barChartRef = useRef<HTMLDivElement>(null);

  // 修復柱狀圖顏色問題 - 使用柔和的顏色，適合暗色模式
  useEffect(() => {
    let isMounted = true;
    let observer: MutationObserver | null = null;
    const timers: NodeJS.Timeout[] = [];
    
    const fixBarColors = () => {
      if (!barChartRef.current || !isMounted) return;
      
      // 使用紫色，所有 bar 都使用同一個顏色
      const targetColor = '#a855f7'; // violet-500
      
      // 找到所有 SVG 元素
      const svg = barChartRef.current.querySelector('svg');
      if (!svg) return;
      
      // 找到所有 rect 元素
      const allRects = svg.querySelectorAll('rect');
      if (allRects.length === 0) return;
      
      // 過濾出 bar 元素（排除 grid lines 和其他非 bar 元素）
      const bars: SVGElement[] = [];
      allRects.forEach((rect) => {
        const fill = rect.getAttribute('fill');
        const stroke = rect.getAttribute('stroke');
        const className = rect.getAttribute('class') || '';
        
        // 跳過 grid lines 和其他非 bar 元素
        if (fill === 'none' || 
            fill === 'transparent' ||
            stroke ||
            className.includes('grid') ||
            className.includes('axis') ||
            rect.getAttribute('width') === '0' ||
            rect.getAttribute('height') === '0') {
          return;
        }
        
        // 檢查是否有實際的寬度和高度（bar 應該有）
        const width = parseFloat(rect.getAttribute('width') || '0');
        const height = parseFloat(rect.getAttribute('height') || '0');
        if (width > 0 && height > 0) {
          bars.push(rect);
        }
      });
      
      if (bars.length === 0) return;
      
      // 所有 bar 都使用同一個紫色
      bars.forEach((bar) => {
        // 強制設置顏色 - 使用多種方法確保生效
        bar.setAttribute('fill', targetColor);
        bar.style.fill = targetColor;
        bar.style.setProperty('fill', targetColor, 'important');
        bar.style.opacity = '1';
        
        // 也設置 stroke 為相同顏色（如果有 stroke）
        if (bar.getAttribute('stroke')) {
          bar.setAttribute('stroke', targetColor);
          bar.style.stroke = targetColor;
        }
      });
    };

    const fixTooltipColors = () => {
      if (!barChartRef.current || !isMounted) return;
      
      // 使用與底部圖例相同的顏色
      const colors = ['#60a5fa', '#34d399', '#fbbf24'];
      
      // 找到所有 tooltip 元素（使用多種選擇器）
      const tooltipSelectors = [
        '.recharts-tooltip-wrapper',
        '.recharts-default-tooltip',
        '.recharts-tooltip',
        '[class*="tooltip"]'
      ];
      
      let tooltip: Element | null = null;
      for (const selector of tooltipSelectors) {
        tooltip = barChartRef.current.querySelector(selector);
        if (tooltip) break;
      }
      
      if (!tooltip) return;
      
      // 找到所有 tooltip item（使用多種選擇器）
      const itemSelectors = [
        'li',
        '.recharts-tooltip-item',
        '[class*="tooltip-item"]',
        'div[class*="item"]'
      ];
      
      const tooltipItems: Element[] = [];
      itemSelectors.forEach(selector => {
        const items = tooltip!.querySelectorAll(selector);
        items.forEach(item => {
          if (!tooltipItems.includes(item)) {
            tooltipItems.push(item);
          }
        });
      });
      
      tooltipItems.forEach((item, index) => {
        const categoryIndex = index % 3;
        const targetColor = colors[categoryIndex];
        
        // 找到所有可能的顏色指示器（更全面的選擇器）
        const allChildren = item.querySelectorAll('*');
        const colorIndicators: (HTMLElement | SVGElement)[] = [];
        
        allChildren.forEach((child) => {
          const element = child as HTMLElement | SVGElement;
          const tagName = element.tagName?.toLowerCase();
          const className = element.className?.toString() || '';
          
          // 檢查是否可能是顏色指示器
          if (
            tagName === 'div' || 
            tagName === 'span' || 
            tagName === 'circle' || 
            tagName === 'rect' ||
            className.includes('color') ||
            className.includes('indicator') ||
            className.includes('dot') ||
            (element instanceof HTMLElement && element.style.backgroundColor) ||
            (element instanceof SVGElement && (element.getAttribute('fill') || element.getAttribute('stroke')))
          ) {
            colorIndicators.push(element);
          }
        });
        
        // 如果沒有找到，嘗試所有子元素
        if (colorIndicators.length === 0) {
          item.childNodes.forEach((child) => {
            if (child instanceof HTMLElement || child instanceof SVGElement) {
              colorIndicators.push(child);
            }
          });
        }
        
        // 設置顏色並改成圓點
        colorIndicators.forEach((indicator) => {
          // 設置背景色（對於 HTMLElement）
          if (indicator instanceof HTMLElement) {
            indicator.style.backgroundColor = targetColor;
            indicator.style.setProperty('background-color', targetColor, 'important');
            indicator.style.color = targetColor;
            // 改成圓點
            indicator.style.borderRadius = '50%';
            indicator.style.setProperty('border-radius', '50%', 'important');
            indicator.style.width = '8px';
            indicator.style.height = '8px';
            indicator.style.setProperty('width', '8px', 'important');
            indicator.style.setProperty('height', '8px', 'important');
            indicator.style.minWidth = '8px';
            indicator.style.minHeight = '8px';
            indicator.style.border = 'none';
            indicator.setAttribute('style', `${indicator.getAttribute('style') || ''}; background-color: ${targetColor} !important; border-radius: 50% !important; width: 8px !important; height: 8px !important;`);
          }
          
          // 設置 fill 和 stroke（對於 SVG 元素）
          if (indicator instanceof SVGElement) {
            indicator.setAttribute('fill', targetColor);
            indicator.setAttribute('stroke', targetColor);
            indicator.style.setProperty('fill', targetColor, 'important');
            indicator.style.setProperty('stroke', targetColor, 'important');
            // 如果是 rect，改成圓角
            if (indicator.tagName?.toLowerCase() === 'rect') {
              indicator.setAttribute('rx', '4');
              indicator.setAttribute('ry', '4');
              indicator.setAttribute('width', '8');
              indicator.setAttribute('height', '8');
            }
            // 如果是 circle，設置半徑
            if (indicator.tagName?.toLowerCase() === 'circle') {
              indicator.setAttribute('r', '4');
            }
          }
        });
        
        // 也直接在 item 的第一個子元素上設置（作為備用）
        const itemElement = item as HTMLElement;
        if (itemElement.firstElementChild) {
          const firstChild = itemElement.firstElementChild as HTMLElement | SVGElement;
          if (firstChild instanceof HTMLElement) {
            firstChild.style.backgroundColor = targetColor;
            firstChild.style.setProperty('background-color', targetColor, 'important');
            firstChild.style.borderRadius = '50%';
            firstChild.style.setProperty('border-radius', '50%', 'important');
            firstChild.style.width = '8px';
            firstChild.style.height = '8px';
            firstChild.style.setProperty('width', '8px', 'important');
            firstChild.style.setProperty('height', '8px', 'important');
          } else if (firstChild instanceof SVGElement) {
            firstChild.setAttribute('fill', targetColor);
            firstChild.style.setProperty('fill', targetColor, 'important');
            if (firstChild.tagName?.toLowerCase() === 'rect') {
              firstChild.setAttribute('rx', '4');
              firstChild.setAttribute('ry', '4');
              firstChild.setAttribute('width', '8');
              firstChild.setAttribute('height', '8');
            }
          }
        }
        
        // 移除長條（背景條或分隔線）
        const separator = item.querySelector('.recharts-tooltip-item-separator');
        if (separator) {
          (separator as HTMLElement).style.display = 'none';
        }
        
        // 移除可能的背景條（檢查所有子元素，找出寬度明顯大於高度的元素）
        allChildren.forEach((child) => {
          const element = child as HTMLElement;
          if (element instanceof HTMLElement) {
            const rect = element.getBoundingClientRect();
            // 如果寬度明顯大於高度（可能是長條），且不是文字元素
            if (rect.width > rect.height * 2 && rect.width > 20) {
              const computedStyle = window.getComputedStyle(element);
              // 如果是背景條（有背景色但沒有文字內容或只有很少文字）
              if (computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                  computedStyle.backgroundColor !== 'transparent' &&
                  element.textContent && element.textContent.trim().length < 3) {
                element.style.display = 'none';
              }
            }
          }
        });
        
        // 移除 tooltip item 的背景圖
        itemElement.style.backgroundImage = 'none';
        itemElement.style.setProperty('background-image', 'none', 'important');
      });
    };

    // 使用 MutationObserver 監聽 DOM 變化，但只在 attributes 變化時觸發
    if (barChartRef.current) {
      observer = new MutationObserver((mutations) => {
        // 只在子節點變化時觸發，避免因為我們修改 fill 屬性而無限循環
        const hasChildListChange = mutations.some(m => m.type === 'childList');
        if (hasChildListChange) {
          fixBarColors();
          fixTooltipColors();
        }
      });

      observer.observe(barChartRef.current, { 
        childList: true, 
        subtree: true
      });
      
      // 使用 requestAnimationFrame 確保在渲染後執行
      const applyColors = () => {
        if (!isMounted) return;
        fixBarColors();
        fixTooltipColors();
        requestAnimationFrame(() => {
          if (isMounted) {
            fixBarColors();
            fixTooltipColors();
          }
        });
      };
      
      // 多次嘗試執行，確保在圖表完全渲染後應用顏色
      timers.push(
        setTimeout(applyColors, 50),
        setTimeout(applyColors, 100),
        setTimeout(applyColors, 200),
        setTimeout(applyColors, 300),
        setTimeout(applyColors, 500),
        setTimeout(applyColors, 800),
        setTimeout(applyColors, 1000),
        setTimeout(applyColors, 1500),
        setTimeout(applyColors, 2000)
      );
      
      // 監聽滑鼠移動事件，當 tooltip 顯示時修復顏色
      const handleMouseMove = () => {
        // 使用 requestAnimationFrame 確保在 DOM 更新後執行
        requestAnimationFrame(() => {
          fixTooltipColors();
          // 再延遲一點確保 tooltip 完全渲染
          setTimeout(fixTooltipColors, 10);
        });
      };
      
      // 也監聽 mouseenter 和 mouseleave
      const handleMouseEnter = () => {
        setTimeout(fixTooltipColors, 50);
        setTimeout(fixTooltipColors, 100);
        setTimeout(fixTooltipColors, 200);
      };
      
      barChartRef.current.addEventListener('mousemove', handleMouseMove);
      barChartRef.current.addEventListener('mouseenter', handleMouseEnter);
      
      // 使用 requestAnimationFrame 持續檢查（但限制頻率）
      let rafId: number;
      let lastCheck = 0;
      const checkColors = () => {
        if (!isMounted) return;
        const now = Date.now();
        // 每 100ms 檢查一次，避免過於頻繁
        if (now - lastCheck > 100) {
          fixBarColors();
          lastCheck = now;
        }
        rafId = requestAnimationFrame(checkColors);
      };
      rafId = requestAnimationFrame(checkColors);
      
      return () => {
        isMounted = false;
        timers.forEach(timer => clearTimeout(timer));
        if (rafId) cancelAnimationFrame(rafId);
        if (observer) {
          observer.disconnect();
        }
        barChartRef.current?.removeEventListener('mousemove', handleMouseMove);
        barChartRef.current?.removeEventListener('mouseenter', handleMouseEnter);
      };
    }
    
    // 如果 barChartRef.current 不存在，返回一個清理函數
    return () => {
      isMounted = false;
      timers.forEach(timer => clearTimeout(timer));
      if (observer) {
        observer.disconnect();
      }
    };
  }, []); // 移除依賴項，只在組件掛載時執行一次

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 頁面標題區 - NetSuite 風格 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Tremor 數據視覺化展示
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              展示 Tremor 主要功能，參考 NetSuite Next UI 設計風格
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="搜尋..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-[#1a2332] rounded-lg bg-white text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
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

        {/* KPI 指標卡片 - NetSuite 風格 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Title className="text-xl font-semibold dark:text-white">關鍵績效指標</Title>
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

        {/* 季度銷售分析 - 柱狀圖 */}
        <TremorCard className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Title className="dark:text-white">季度銷售分析</Title>
              <Text className="dark:text-gray-300">各季度的銷售額、訂單數與客戶數對比</Text>
            </div>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#252f3f] rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <div ref={barChartRef} className="mt-6 h-80 pl-6 pr-4 overflow-visible bar-chart-container">
            <style dangerouslySetInnerHTML={{__html: `
              /* 強制設置柱狀圖顏色 - 所有 bar 都使用紫色 */
              .bar-chart-container svg rect.recharts-bar-rectangle,
              .bar-chart-container svg rect[fill]:not([fill="none"]):not([stroke]) {
                fill: #a855f7 !important;
              }
              
              /* 隱藏 Tremor 內建圖例 */
              .bar-chart-container .tremor-Legend-legendItem,
              .bar-chart-container .tremor-Legend-root,
              .bar-chart-container [class*="Legend"],
              .bar-chart-container m[name="sales"],
              .bar-chart-container m[name="orders"],
              .bar-chart-container m[name="customers"] {
                display: none !important;
              }
              
              /* 隱藏 tooltip 中的長條（背景條或分隔線） */
              .bar-chart-container .recharts-tooltip-wrapper li::after,
              .bar-chart-container .recharts-tooltip-wrapper li::before,
              .bar-chart-container .recharts-default-tooltip li::after,
              .bar-chart-container .recharts-default-tooltip li::before,
              .bar-chart-container [class*="tooltip"] li::after,
              .bar-chart-container [class*="tooltip"] li::before,
              .bar-chart-container .recharts-tooltip-wrapper li .recharts-tooltip-item-separator,
              .bar-chart-container .recharts-default-tooltip li .recharts-tooltip-item-separator {
                display: none !important;
              }
              
              /* 移除 tooltip item 的背景條（但保留文字） */
              .bar-chart-container .recharts-tooltip-wrapper li,
              .bar-chart-container .recharts-default-tooltip li {
                background-image: none !important;
              }
              
              /* 修改 tooltip 中的顏色點點 - 改成圓點 */
              .bar-chart-container .recharts-tooltip-wrapper li:nth-child(1) > *:first-child,
              .bar-chart-container .recharts-tooltip-wrapper li:nth-child(1) .recharts-tooltip-item-color,
              .bar-chart-container .recharts-tooltip-wrapper li:nth-child(1) div:first-child,
              .bar-chart-container .recharts-tooltip-wrapper li:nth-child(1) span:first-child,
              .bar-chart-container .recharts-default-tooltip li:nth-child(1) > *:first-child,
              .bar-chart-container .recharts-default-tooltip li:nth-child(1) .recharts-tooltip-item-color,
              .bar-chart-container .recharts-default-tooltip li:nth-child(1) div:first-child,
              .bar-chart-container .recharts-default-tooltip li:nth-child(1) span:first-child,
              .bar-chart-container [class*="tooltip"] li:nth-child(1) > *:first-child {
                background-color: #60a5fa !important;
                fill: #60a5fa !important;
                stroke: #60a5fa !important;
                color: #60a5fa !important;
                border-radius: 50% !important;
                width: 8px !important;
                height: 8px !important;
                min-width: 8px !important;
                min-height: 8px !important;
                border: none !important;
              }
              
              .bar-chart-container .recharts-tooltip-wrapper li:nth-child(2) > *:first-child,
              .bar-chart-container .recharts-tooltip-wrapper li:nth-child(2) .recharts-tooltip-item-color,
              .bar-chart-container .recharts-tooltip-wrapper li:nth-child(2) div:first-child,
              .bar-chart-container .recharts-tooltip-wrapper li:nth-child(2) span:first-child,
              .bar-chart-container .recharts-default-tooltip li:nth-child(2) > *:first-child,
              .bar-chart-container .recharts-default-tooltip li:nth-child(2) .recharts-tooltip-item-color,
              .bar-chart-container .recharts-default-tooltip li:nth-child(2) div:first-child,
              .bar-chart-container .recharts-default-tooltip li:nth-child(2) span:first-child,
              .bar-chart-container [class*="tooltip"] li:nth-child(2) > *:first-child {
                background-color: #34d399 !important;
                fill: #34d399 !important;
                stroke: #34d399 !important;
                color: #34d399 !important;
                border-radius: 50% !important;
                width: 8px !important;
                height: 8px !important;
                min-width: 8px !important;
                min-height: 8px !important;
                border: none !important;
              }
              
              .bar-chart-container .recharts-tooltip-wrapper li:nth-child(3) > *:first-child,
              .bar-chart-container .recharts-tooltip-wrapper li:nth-child(3) .recharts-tooltip-item-color,
              .bar-chart-container .recharts-tooltip-wrapper li:nth-child(3) div:first-child,
              .bar-chart-container .recharts-tooltip-wrapper li:nth-child(3) span:first-child,
              .bar-chart-container .recharts-default-tooltip li:nth-child(3) > *:first-child,
              .bar-chart-container .recharts-default-tooltip li:nth-child(3) .recharts-tooltip-item-color,
              .bar-chart-container .recharts-default-tooltip li:nth-child(3) div:first-child,
              .bar-chart-container .recharts-default-tooltip li:nth-child(3) span:first-child,
              .bar-chart-container [class*="tooltip"] li:nth-child(3) > *:first-child {
                background-color: #fbbf24 !important;
                fill: #fbbf24 !important;
                stroke: #fbbf24 !important;
                color: #fbbf24 !important;
                border-radius: 50% !important;
                width: 8px !important;
                height: 8px !important;
                min-width: 8px !important;
                min-height: 8px !important;
                border: none !important;
              }
              
              /* 確保 tooltip item 中的 rect 也變成圓點 */
              .bar-chart-container .recharts-tooltip-wrapper li svg rect,
              .bar-chart-container .recharts-default-tooltip li svg rect {
                rx: 4 !important;
                ry: 4 !important;
                width: 8px !important;
                height: 8px !important;
              }
            `}} />
            <BarChart
              data={salesData}
              index="name"
              categories={['sales', 'orders', 'customers']}
              colors={['#a855f7', '#a855f7', '#a855f7']}
              yAxisWidth={90}
              showLegend={false}
              stack={false}
              margin={{ left: 20, right: 20 }}
              valueFormatter={(value) => {
                // 根據類別決定格式化方式
                if (value > 1000) {
                  return `$${value.toLocaleString()}`;
                }
                return value.toString();
              }}
            />
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#60a5fa' }}></div>
              <span>銷售額 (Sales)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#34d399' }}></div>
              <span>訂單數 (Orders)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#fbbf24' }}></div>
              <span>客戶數 (Customers)</span>
            </div>
          </div>
        </TremorCard>

        {/* 月度財務趨勢 - 折線圖與面積圖並排 */}
        <Grid numItems={1} numItemsLg={2} className="gap-6">
          <TremorCard className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700">
            <Title className="dark:text-white">月度收入趨勢</Title>
            <Text className="dark:text-gray-300">過去六個月的收入與支出變化</Text>
            <div className="mt-6 h-80 pl-4 pr-4">
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
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500"></div>
                <span>收入 (Revenue)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-rose-500"></div>
                <span>支出 (Expense)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span>利潤 (Profit)</span>
              </div>
            </div>
          </TremorCard>

          <TremorCard className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700">
            <Title className="dark:text-white">財務面積圖</Title>
            <Text className="dark:text-gray-300">收入與支出的視覺化對比</Text>
            <div className="mt-6 h-80 pl-4 pr-4">
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
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500"></div>
                <span>收入 (Revenue)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-rose-500"></div>
                <span>支出 (Expense)</span>
              </div>
            </div>
          </TremorCard>
        </Grid>

        {/* 產品類別分布與績效指標 */}
        <Grid numItems={1} numItemsLg={2} className="gap-6">
          <TremorCard className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700">
            <Title className="dark:text-white">產品類別分布</Title>
            <Text className="dark:text-gray-300">各類別銷售占比分析</Text>
            <div className="mt-6 h-80">
              <DonutChart
                data={categoryDistribution}
                category="value"
                index="name"
                colors={['blue', 'emerald', 'amber', 'violet', 'gray']}
                showLabel={true}
                valueFormatter={(value) => `${value}%`}
              />
            </div>
          </TremorCard>

          <TremorCard className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700">
            <Title className="dark:text-white">績效指標追蹤</Title>
            <Text className="dark:text-gray-300">各項關鍵指標達成率</Text>
            <div className="mt-6 space-y-4">
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
        </Grid>

        {/* 客戶訂單統計表格 */}
        <TremorCard className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Title className="dark:text-white">客戶訂單統計</Title>
              <Text className="dark:text-gray-300">前五大客戶訂單詳情與進度追蹤</Text>
            </div>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              匯出報表
            </button>
          </div>
          <Table className="mt-6">
            <TableHead>
              <TableRow>
                <TableHeaderCell>客戶名稱</TableHeaderCell>
                <TableHeaderCell>訂單數</TableHeaderCell>
                <TableHeaderCell>總金額</TableHeaderCell>
                <TableHeaderCell>進度</TableHeaderCell>
                <TableHeaderCell>狀態</TableHeaderCell>
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

        {/* 組合圖表展示 */}
        <TremorCard className="hover:shadow-lg transition-shadow dark:bg-[#1a2332] dark:border-gray-700">
          <Title className="dark:text-white">綜合數據分析</Title>
          <Text className="dark:text-gray-300">多維度數據對比分析</Text>
          <Grid numItems={1} numItemsLg={2} className="mt-6 gap-6">
            <div className="space-y-4">
              <Text className="font-semibold dark:text-white">銷售額季度分布</Text>
              <div className="h-64 pl-4 pr-4">
                <BarChart
                  data={salesData}
                  index="name"
                  categories={['sales']}
                  colors={['blue']}
                  yAxisWidth={80}
                  margin={{ left: 10, right: 10 }}
                  valueFormatter={(value) => `$${value.toLocaleString()}`}
                />
              </div>
            </div>
            <div className="space-y-4">
              <Text className="font-semibold dark:text-white">訂單數季度分布</Text>
              <div className="h-64 pl-4 pr-4">
                <BarChart
                  data={salesData}
                  index="name"
                  categories={['orders']}
                  colors={['emerald']}
                  yAxisWidth={80}
                  margin={{ left: 10, right: 10 }}
                />
              </div>
            </div>
          </Grid>
        </TremorCard>
      </div>
    </div>
  );
}
