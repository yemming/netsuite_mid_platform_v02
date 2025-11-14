# o9 需求規劃平台 - 前台系統

這是基於 SRS 文件開發的 o9 需求規劃平台前台系統，使用 Next.js 14+ (App Router)、TypeScript 和 Tailwind CSS 建置。

## 專案結構

```
SCM/
├── app/                          # Next.js App Router 頁面
│   ├── layout.tsx               # 根佈局（暗黑模式設定）
│   ├── page.tsx                  # 首頁（模組導航）
│   ├── globals.css               # 全域樣式
│   ├── eda/                      # M1: 探索性數據分析
│   │   └── page.tsx
│   ├── forecast-analysis/        # M2: 預測分析駕駛艙
│   │   └── page.tsx
│   └── demand-assumptions/        # M3: 需求假設與預測層
│       └── page.tsx
└── components/                   # React 元件
    ├── eda/                      # EDA 模組元件
    │   ├── EDAOverview.tsx
    │   ├── EDATable.tsx
    │   ├── EDAChart.tsx
    │   ├── EDADetailView.tsx
    │   └── EventAttributionModal.tsx
    ├── forecast/                 # 預測分析模組元件
    │   ├── ForecastViolationsDashboard.tsx
    │   ├── ViolationDetailView.tsx
    │   ├── ViolationChart.tsx
    │   ├── AlgorithmInsights.tsx
    │   └── AlgorithmSettings.tsx
    └── demand-assumptions/       # 需求假設模組元件
        ├── DemandAssumptionsView.tsx
        ├── AssumptionsSummary.tsx
        ├── AssumptionDetails.tsx
        ├── ForecastLayersDashboard.tsx
        └── WaterfallChart.tsx
```

## 功能模組

### M1: 探索性數據分析 (EDA)
- **S1.1: EDA 總覽儀表板** - 表格展示所有交叉點，支援過濾和排序
- **S1.2: 交叉點詳細視圖** - 時間序列圖表顯示歷史數據和異常標記
- **S1.3: 事件歸因彈窗** - 手動將未知異常關聯到已知事件

### M2: 預測分析駕駛艙
- **S2.1: 違規告警儀表板** - 表格顯示所有偵測到的違規
- **S2.2: 違規詳情視圖** - 圖表疊加顯示歷史數據和系統預測，視覺化違規
- **S2.3: 算法洞察駕駛艙** - 分析各算法的表現統計
- **S2.4: 算法設定頁面** - 管理算法的啟用/停用和參數調整

### M3: 需求假設與預測層
- **S3.1: 需求假設主視圖** - 主檔頭表格 + 明細輸入網格
- **S3.2: 預測圖層儀表板** - 瀑布圖可視化各圖層疊加，明細網格顯示數值

## 視覺規格

### 配色方案
- **背景**: `#1F1F1F` (深灰/近黑)
- **文字**: `#E0E0E0` (淺灰)
- **主色調**: `#3B82F6` (亮藍色，用於可交互元素)
- **歷史/實際數據**: `#EC4899` (桃紅色) 或 `#F97316` (亮橘色)
- **預測數據**: `#EF4444` (紅色虛線) 或白色虛線
- **異常標記**:
  - 波峰: `#F97316` (橘色)
  - 波谷: `#22C55E` (綠色)
  - 缺貨時段: `#4B5563` (灰色區域)
- **時間欄位表頭**: `#FCD34D` (黃色/金色背景)

### 字體
- 使用 Inter 字體（透過 Next.js Google Fonts）

## 開發狀態

⚠️ **目前狀態**: 前台 UI 已完成，使用模擬數據
- ✅ 所有頁面和元件已建立
- ✅ 視覺規格已實作（暗黑模式、配色）
- ✅ 基本交互功能已實作（過濾、排序、下鑽）
- ⏳ API 整合待實作
- ⏳ n8n 工作流整合待實作

## 使用方式

1. 確保專案根目錄有 `tailwind.config.js` 和 `tsconfig.json`
2. 在專案根目錄執行：
   ```bash
   npm install
   npm run dev
   ```
3. 訪問 `http://localhost:3000/scm` (或根據你的路由設定)

## 注意事項

- 目前所有數據都是模擬數據，用於展示 UI 和交互
- API 端點和 n8n 工作流尚未整合
- 部分功能（如事件關聯、假設提交）目前只有前端交互，尚未連接後端

