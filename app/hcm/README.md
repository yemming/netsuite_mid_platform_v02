# HCM 人力資本管理系統

## 系統概述

本 HCM 系統是根據「專案需求文檔：SANS 平台之 Gaia X HCM (Next.js 克隆版)」建立的完整人力資本管理系統。

## 目錄結構

```
app/hcm/
├── (auth)/                    # 身份驗證模組
│   └── login/                 # 登入頁面
├── (core)/                    # 核心應用程式
│   ├── layout.tsx             # 核心 Layout（包含側邊欄和頂部導航）
│   ├── admin/                 # HR 管理員模組
│   │   ├── employees/         # 人事管理
│   │   ├── attendance/        # 考勤管理
│   │   ├── payroll/           # 薪酬管理
│   │   ├── workflows/         # 流程管理
│   │   └── dashboards/        # BI 儀表板
│   ├── ess/                   # 員工自助 (ESS)
│   ├── mss/                   # 主管自助 (MSS)
│   └── recruitment/           # 招募管理 (ATS)
└── page.tsx                   # 入口頁面
```

## 功能模組

### 1. HR 管理員模組 (`/hcm/admin`)

#### 人事管理 (`/employees`)
- 員工清單管理
- 員工詳細資料編輯
- 組織架構管理

#### 考勤管理 (`/attendance`)
- 排班管理 (`/scheduling`)
- 考勤結果 (`/results`)
- 考勤規則 (`/rules`)

#### 薪酬管理 (`/payroll`)
- 薪酬模型 (`/models`)
- 執行薪資 (`/run`)

#### 流程管理 (`/workflows`)
- 流程設計器 (`/designer/[id]`)

#### BI 儀表板 (`/dashboards`)
- 薪酬分析 (`/compensation`)
- 考勤分析 (`/attendance`)

### 2. 員工自助 (ESS) (`/hcm/ess`)

- 儀表板 (`/dashboard`)
- 表單申請 (`/forms`)
- 我的審批 (`/approvals`)
- 薪資單 (`/payslip`)

### 3. 主管自助 (MSS) (`/hcm/mss`)

- 團隊管理 (`/team`)

### 4. 招募管理 (ATS) (`/hcm/recruitment`)

- 職缺管理 (`/requisitions`)
- 候選人 (`/candidates`)

## 技術架構

- **框架**: Next.js 14+ (App Router)
- **UI 元件**: shadcn/ui + Radix UI
- **樣式**: Tailwind CSS
- **圖表**: Recharts
- **狀態管理**: React Hooks (未來可擴展為 Zustand)

## 共享元件

### 元件位置
- `components/hcm/sidebar.tsx` - HCM 系統側邊欄
- `components/hcm/header.tsx` - HCM 系統頂部導航

### 工具函數
- `lib/hcm-utils.ts` - HCM 相關工具函數

## 使用說明

### 訪問系統
1. 訪問 `/hcm` 進入系統入口
2. 系統會自動導向 `/hcm/admin/employees`

### 導航
- 使用左側側邊欄進行模組切換
- 頂部導航提供搜尋和使用者選單

## 待實作功能

以下功能目前為前端框架，需要後續實作：

1. **資料庫整合**
   - 連接 Supabase 資料庫
   - 實作 CRUD 操作
   - 實作資料驗證

2. **身份驗證**
   - 整合 Supabase Auth
   - 實作角色權限控制

3. **API 整合**
   - 建立 API Routes
   - 整合 n8n 工作流
   - 整合 NetSuite（如需要）

4. **流程設計器**
   - 實作流程設計畫布
   - 整合 n8n 或自訂設計器

5. **報表功能**
   - 實作 PDF 匯出
   - 實作 Excel 匯出

## 開發規範

- 所有頁面使用 TypeScript
- 遵循專案的命名規範（kebab-case 檔案名）
- 使用繁體中文註解和 UI 文字
- 遵循 Next.js App Router 最佳實踐

## 相關文件

- 專案需求文檔：`專案需求文檔：SANS 平台之 Gaia X HCM (Next.js 克隆版).md`
- 專案規範：`.cursorrules`

