# CRM 業務協同系統

## 系統概述

本系統是根據「AI 業務 Agent 協同系統」文檔建立的完整前端實作，實現了人機協作的自動化業務回覆流程。

## 功能模組

### 1. 公開表單頁面 (`/public/lead-form`)

**用途**: 供潛在客戶填寫業務諮詢表單

**功能**:
- 客戶基本資訊填寫（姓名、Email、公司名稱）
- 專案需求說明
- 表單提交與成功提示
- 流程說明展示

**路由**: `/public/lead-form`

### 2. CRM 主儀表板 (`/dashboard/crm`)

**用途**: 業務人員審核 AI 生成的郵件草稿

**功能**:
- 待審核草稿清單顯示
- 搜尋與篩選功能（依狀態、關鍵字）
- 統計資訊（待審核數、已批准數、總數）
- 草稿預覽與快速查看

**路由**: `/dashboard/crm`

### 3. 草稿詳情頁面 (`/dashboard/crm/drafts/[id]`)

**用途**: 詳細審核單一草稿，執行批准或修訂操作

**功能**:
- 客戶資訊展示
- AI 背景研究結果展示
- 郵件草稿內容（可編輯）
- 版本歷史追蹤
- 批准並發送功能
- 請求修訂功能（提供回饋給 AI）

**路由**: `/dashboard/crm/drafts/[id]`

## 資料流程

```
1. 潛在客戶填寫表單
   ↓
2. 表單提交 → API: POST /api/crm/leads
   ↓
3. (後端) 觸發 n8n 工作流程
   ↓
4. AI Agent 1: 背景研究 → 生成 CompanyResearch
   ↓
5. AI Agent 2: 草稿生成 → 生成 EmailDraft v1
   ↓
6. 草稿狀態: pending_review
   ↓
7. 業務人員在儀表板看到待審核草稿
   ↓
8. 業務人員選擇：
   - 批准 → 發送郵件 → 狀態: approved
   - 修訂 → 提供回饋 → AI Agent 3 重新生成 → 狀態: pending_review (新版本)
```

## 資料型別

所有資料型別定義在 `lib/types/crm.ts`:

- `Lead`: 潛在客戶資訊
- `CompanyResearch`: AI 背景研究結果
- `EmailDraft`: 郵件草稿（包含版本歷史）
- `EmailDraftVersion`: 單一版本資訊
- `LeadFormData`: 表單提交資料
- `RevisionFeedback`: 修訂回饋

## 頁面狀態

### EmailDraft 狀態

- `pending_review`: 待審核（預設狀態）
- `approved`: 已批准並發送
- `modifying`: 修訂中（AI 正在根據回饋重新生成）

## 後續實作項目

### 後端 API

1. **POST /api/crm/leads**: 處理表單提交
   - 儲存到 Supabase
   - 觸發 n8n webhook

2. **GET /api/crm/drafts**: 取得草稿清單
   - 從 Supabase 查詢
   - 支援篩選與分頁

3. **GET /api/crm/drafts/[id]**: 取得單一草稿詳情

4. **POST /api/crm/drafts/[id]/approve**: 批准草稿
   - 更新狀態為 `approved`
   - 發送郵件給客戶

5. **POST /api/crm/drafts/[id]/revise**: 請求修訂
   - 儲存修訂回饋
   - 觸發 n8n 工作流程（AI Agent 3）

### n8n 工作流程

1. **Lead Processing Workflow**
   - 接收表單提交
   - 呼叫 AI Agent 1（背景研究）
   - 呼叫 AI Agent 2（草稿生成）
   - 儲存草稿到 Supabase

2. **Revision Workflow**
   - 接收修訂請求
   - 呼叫 AI Agent 3（修訂生成）
   - 更新草稿版本

## 使用方式

### 開發環境

```bash
# 啟動開發伺服器
npm run dev

# 訪問公開表單
http://localhost:3000/public/lead-form

# 訪問 CRM 儀表板（需登入）
http://localhost:3000/dashboard/crm
```

### 測試流程

1. 訪問 `/public/lead-form` 填寫表單
2. 提交表單（目前會顯示成功訊息，實際 API 尚未實作）
3. 登入後訪問 `/dashboard/crm` 查看草稿清單
4. 點擊「查看」進入草稿詳情頁面
5. 測試「批准並發送」或「請求修訂」功能

## 技術架構

- **框架**: Next.js 14+ (App Router)
- **UI 元件**: shadcn/ui + Radix UI
- **樣式**: Tailwind CSS
- **型別**: TypeScript
- **狀態管理**: React Hooks (useState, useEffect)

## 注意事項

⚠️ **目前所有 API 呼叫都是模擬的**，實際的資料庫操作和 n8n 整合需要在後續階段實作。

目前的模擬資料位於：
- `app/dashboard/crm/page.tsx` (草稿清單)
- `app/dashboard/crm/drafts/[id]/page.tsx` (草稿詳情)

