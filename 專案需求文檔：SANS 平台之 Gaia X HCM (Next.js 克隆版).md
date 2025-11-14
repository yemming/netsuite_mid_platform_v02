# 專案需求文檔：SANS 平台之 Gaia X HCM (Next.js 克隆版)

## 1. 專案概觀 (Project Overview)

### 1.1 專案目的

本專案旨在借鑒 MetaGuru Gaia X HCM 系統 (下稱「目標系統」) 的成熟功能，使用現代化的前端技術棧，打造一個高效能、高擴展性、高使用者體驗的人力資本管理系統 (HCM) 前端。此系統將作為 SANS (Supabase, Appsmith/Next.js, n8n, NetSuite) 平台的核心人資模組。

### 1.2 技術棧 (Tech Stack)

* **前端 (Frontend):** Next.js 14+ (App Router)
* **UI 框架:** Shadcn/ui + Tailwind CSS
* **狀態管理 (State):** Zustand / React Context
* **後端 (Backend):** Supabase (PostgreSQL, Auth)
* **數據/邏輯自動化:** n8n (用於 ETL 和複雜工作流)
* **圖表 (Charts):** Recharts / Tremor
* **表單 (Forms):** `react-hook-form` + `zod`
* **Component 庫:** Radix UI

### 1.3 核心設計原則

1.  **元件驅動 (Component-Driven):** 所有 UI 均由可重用的 Server/Client Component 組成。
2.  **數據後端分離:** 前端專注於 UI/UX，所有數據通過 Server Actions 或 API (由 Supabase or n8n 提供) 進行交互。
3.  **效能優先:** 盡可能使用 RSC (React Server Components) 進行數據獲取與渲染。

## 2. 建議目錄結構 (Proposed Directory Structure)

```bash
.
└── app/
    ├── (core)/                     # 核心應用程式 (登入後)
    │   ├── admin/                  # HR 管理員模組
    │   │   ├── employees/          # 1. 人事管理
    │   │   │   └── [id]/page.tsx
    │   │   ├── attendance/         # 2. 考勤管理
    │   │   │   ├── scheduling/page.tsx
    │   │   │   ├── results/page.tsx
    │   │   │   └── rules/page.tsx
    │   │   ├── payroll/            # 3. 薪酬管理
    │   │   │   ├── models/page.tsx
    │   │   │   └── run/page.tsx
    │   │   ├── workflows/          # 4. 流程 (BPM)
    │   │   │   └── designer/[id]/page.tsx
    │   │   └── dashboards/         # 5. BI 儀表板
    │   │       ├── compensation/page.tsx
    │   │       └── attendance/page.tsx
    │   ├── ess/                    # 6. 員工自助 (ESS)
    │   │   ├── dashboard/page.tsx
    │   │   ├── forms/page.tsx
    │   │   ├── approvals/page.tsx
    │   │   └── payslip/page.tsx
    │   ├── mss/                    # 7. 主管自助 (MSS)
    │   │   └── team/page.tsx
    │   ├── recruitment/            # 8. 招募管理 (ATS)
    │   │   ├── requisitions/page.tsx
    │   │   └── candidates/page.tsx
    │   └── layout.tsx              # 核心 AppShell
    ├── (auth)/                     # 身份驗證
    │   └── login/page.tsx
    └── page.tsx                    # 企業 Portal / 儀表板