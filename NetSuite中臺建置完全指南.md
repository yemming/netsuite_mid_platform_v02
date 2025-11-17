# NetSuite 串接中臺建置完全指南
## 從零到一的實戰手冊

> **文檔版本**: v1.3  
> **最後更新**: 2025-01-XX  
> **作者**: Claude x 你的團隊  
> **適用場景**: POS、EC、WMS、MES 系統串接 NetSuite
> 
> **v1.4 更新內容（2025-01-17）**：
> - 新增「13. NetSuite 風格 Visual ETL & SQL Generator」章節
> - 完整實作 NetSuite Import Assistant 風格的視覺化 ETL 工具
> - 支援 CSV 上傳、三欄式拖拉映射、智慧箭頭轉換規則設定
> - 自動生成 CREATE TABLE 和 UPSERT SQL 語句
> - 詳細記錄 UI 設計規範、API 架構、使用流程
> 
> **v1.3 更新內容（2025-01-XX）**：
> - 新增「12.11 報支系統資料庫結構重構（表頭-表身架構）」章節
> - 記錄從單一表改為表頭+表身結構的重大變更
> - 詳細說明 `expense_reviews`（表頭）和 `expense_lines`（表身）的設計
> - 記錄編輯功能、API 變更、前端實作等完整變動
> 
> **v1.2 更新內容（2025-11-09）**：
> - 新增「12. 報支審核流程完整實作」章節，詳細記錄報支審核系統的完整研發過程
> - 重點記錄「資料雙向寫回機制」：Supabase → NetSuite 和 NetSuite → Supabase 的完整流程
> - 記錄 Supabase Storage 整合、編輯功能、效能優化等實作細節
> - 新增 API 端點說明和資料流圖
> 
> **v1.1 更新內容（2025-11-09）**：
> - 新增「9.1 實際資料庫結構與指南的差異」章節，記錄實際 Supabase 資料庫結構與指南的差異
> - 更新所有表的 CREATE TABLE 語句，反映實際資料庫結構
> - 修正幣別表名（從 `ns_currency` 改為 `ns_currencies`，使用複數形式）
> - 修正 subsidiary 欄位處理方式（從 TEXT 改為 INTEGER，取第一個值）
> - 修正 Account 欄位名稱（從 account_search_display_name 改為 acct_name）
> - 記錄 Item 同步方式的修正（混合使用 SuiteQL + REST API）
> - 更新客戶、供應商、員工、運送方式表的實際結構差異（移除不存在的欄位）
> - 記錄 Employee 表沒有 fullname 欄位的特殊情況
> - 新增「4.4.3 報支審核表」章節，說明報支審核流程和 Supabase Storage 整合

---

## 📖 目錄

- [1. 專案概述](#1-專案概述)
- [2. 架構設計](#2-架構設計)
- [3. 核心概念](#3-核心概念)
- [4. Phase 1: Supabase 表結構建立](#4-phase-1-supabase-表結構建立)
- [5. Phase 2: Helper Functions](#5-phase-2-helper-functions)
- [6. Phase 3: 交易單據實作](#6-phase-3-交易單據實作)
- [7. Phase 4: 製造業專屬（MES/WMS）](#7-phase-4-製造業專屬meswms)
- [8. 實作時間表](#8-實作時間表)
- [9. 實際欄位對照總結](#9-實際欄位對照總結)
  - [9.1 主要差異與注意事項](#91-主要差異與注意事項)
  - [9.2 欄位類型轉換注意事項](#92-欄位類型轉換注意事項)
  - [9.3 同步實作建議](#93-同步實作建議)
  - [9.4 同步表維護與擴充](#94-同步表維護與擴充)
- [10. 常見問題與陷阱](#10-常見問題與陷阱)
- [11. 附錄](#11-附錄)
- [12. 報支審核流程完整實作](#12-報支審核流程完整實作)
- [13. NetSuite 風格 Visual ETL & SQL Generator](#13-netsuite-風格-visual-etl--sql-generator)
- [12. 報支審核流程完整實作](#12-報支審核流程完整實作)
  - [12.1 系統架構與資料流](#121-系統架構與資料流)
  - [12.2 資料雙向寫回機制](#122-資料雙向寫回機制)
  - [12.3 API 端點實作](#123-api-端點實作)
  - [12.4 前端頁面實作](#124-前端頁面實作)
  - [12.5 效能優化策略](#125-效能優化策略)
  - [12.6 錯誤處理與重試機制](#126-錯誤處理與重試機制)
- [13. LINE Pay 金流對接設計](#13-line-pay-金流對接設計)

---

## 1. 專案概述

### 1.1 為什麼需要中台？

你的業務系統（POS、EC、WMS、MES）需要與 NetSuite ERP 整合，但每次打 API 都需要：
- 查詢 Subsidiary ID（公司別）
- 查詢 Currency ID（幣別）
- 查詢 Department ID（部門）
- 查詢 Item ID（產品）
- 查詢 Account ID（會計科目）
- ...等等

如果每個系統都直接查 NetSuite，會導致：
- ❌ API 呼叫次數暴增
- ❌ 效能低下
- ❌ 開發複雜度高
- ❌ 維護困難

**中台的解決方案**：
```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│   POS    │────▶│  Supabase    │────▶│ NetSuite │
│   EC     │     │  中台        │     │   API    │
│   WMS    │     │ (Name↔ID)    │     │          │
│   MES    │     └──────────────┘     └──────────┘
└──────────┘
    快速查詢          一天同步一次          單一數據源
    本地資料          主檔資料              交易寫入
```

### 1.2 中台的核心功能

1. **Name-to-ID Mapping**：業務系統使用「名稱」，NetSuite 使用「Internal ID」
2. **資料快取**：本地快速查詢，不用每次都打 NetSuite API
3. **資料驗證**：打單前先驗證所有欄位是否有效
4. **交易組裝**：提供標準 API 組裝 NetSuite 交易格式

### 1.3 支援的單據類型

| 單據類型 | 英文名稱 | 適用系統 | 狀態 |
|---------|---------|---------|------|
| 銷售訂單 | Sales Order | POS, EC | ✅ 完全支援 |
| 採購單 | Purchase Order | 採購系統 | ✅ 完全支援 |
| 調撥單 | Transfer Order | WMS | ✅ 完全支援 |
| 入庫單 | Item Receipt | WMS | ✅ 完全支援 |
| 出貨單 | Item Fulfillment | WMS | ⚠️ 需要 SO ID |
| 工單 | Work Order | MES | ✅ 需要 BOM |
| 領料單 | Component Issue | MES | ✅ 需要 WO ID |
| 費用報銷 | Expense Report | 報支系統 | ✅ 完全支援 |
| 發票 | Invoice | 財務 | ⚠️ 建議從 SO 轉換 |
| 手切傳票 | Journal Entry | 財務 | ✅ 完全支援 |

---

## 2. 架構設計

### 2.1 技術堆疊

```
┌─────────────────────────────────────────────────────┐
│                  應用層                              │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │  POS   │  │   EC   │  │  WMS   │  │  MES   │   │
│  └───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘   │
│      │           │            │            │        │
└──────┼───────────┼────────────┼────────────┼────────┘
       │           │            │            │
       └───────────┴────────────┴────────────┘
                   │
        ┌──────────▼──────────────────┐
        │    API Gateway Layer        │
        │  (Supabase Functions)       │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │      Supabase 中台          │
        │  ┌──────────────────────┐   │
        │  │  主檔資料表 (15張)   │   │
        │  │  • Subsidiaries      │   │
        │  │  • Items             │   │
        │  │  • Accounts          │   │
        │  │  • ...               │   │
        │  └──────────────────────┘   │
        │  ┌──────────────────────┐   │
        │  │  Helper Functions    │   │
        │  │  • lookup_id()       │   │
        │  │  • validate()        │   │
        │  └──────────────────────┘   │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │     NetSuite ERP            │
        │  • SuiteQL 查詢             │
        │  • REST API 寫入            │
        │  • 主檔同步（需自行實作）   │
        └─────────────────────────────┘
```

### 2.2 數據流向

#### 查詢流程（讀取主檔）
```
POS 系統
  ↓ 查詢「台灣分公司」的 ID
Supabase 中台
  ↓ SELECT netsuite_internal_id FROM ns_subsidiary WHERE name = '台灣分公司'
返回: 1
```

#### 寫入流程（建立交易）
```
POS 系統
  ↓ 銷售單資料（使用名稱）
中台 API Gateway
  ↓ 轉換名稱為 ID
  ↓ 驗證資料完整性
  ↓ 組裝 NetSuite JSON
NetSuite API
  ↓ 建立 Sales Order
返回: SO-12345 (Internal ID: 9999)
  ↓ 儲存到 transaction_references
Supabase
```

### 2.3 關鍵設計原則

1. **單一資料源 (Single Source of Truth)**
   - NetSuite = 唯一的真實資料來源
   - Supabase = 唯讀快取層
   - 永遠不直接修改 Supabase 主檔資料

2. **Name-to-ID Mapping**
   - 每張表必有：`netsuite_internal_id` (INTEGER) + `name` (VARCHAR)
   - 業務系統用 name 查詢
   - NetSuite API 用 internal_id 寫入

3. **增量同步優先**
   - 小表（<1000筆）：每日全量同步
   - 大表（>10000筆）：增量同步 + 定期全量

4. **錯誤處理與重試**
   - 所有 API 呼叫都要有 try-catch
   - 記錄失敗原因到 sync_logs
   - 自動重試機制（最多3次）

---

## 3. 核心概念

### 3.1 NetSuite Transaction 結構

NetSuite 的所有交易都遵循相同結構：

```
Transaction
├── Header (單頭)
│   ├── subsidiary (必填)
│   ├── currency (必填)
│   ├── tranDate (必填)
│   ├── entity (客戶/供應商/員工)
│   ├── department (可選)
│   ├── class (可選)
│   └── location (可選)
│
└── Lines (單身明細)
    ├── Line 1
    │   ├── item (產品/服務)
    │   ├── quantity
    │   ├── rate
    │   ├── amount
    │   └── taxCode
    ├── Line 2
    └── ...
```

### 3.2 必填欄位邏輯

NetSuite 的必填欄位有**三個層級**：

1. **系統層級**：所有交易都必填
   - `subsidiary`
   - `currency`
   - `tranDate`

2. **Subsidiary 層級**：特定公司要求
   - 例如：台灣子公司強制填 `department`

3. **Transaction Form 層級**：特定單據格式要求
   - 例如：銷售訂單要求填 `shipMethod`

### 3.3 Segment（分段維度）

NetSuite 支援多維度分析，常見的 Segment：

- **Department**：部門（研發部、業務部）
- **Class**：類別（硬體事業、軟體事業）
- **Location**：地點（台北倉、台中倉）

這些 Segment 可以在：
- Header 層級設定（套用到所有明細）
- Line 層級覆寫（單一明細使用不同值）

---

## 4. Phase 1: Supabase 表結構建立

### 4.1 表命名規範

所有 NetSuite 主檔表統一使用 `ns_` 前綴，並使用 NetSuite 的 record name 作為表名：

```
ns_subsidiary          (公司別，NetSuite record: subsidiary)
ns_currencies          (幣別，NetSuite record: currency)
ns_department          (部門，NetSuite record: department)
ns_classification      (類別，NetSuite record: classification)
ns_location            (地點，NetSuite record: location)
ns_account             (會計科目，NetSuite record: account)
ns_item                (產品主檔，NetSuite record: item)
ns_customer            (客戶，NetSuite record: customer)
ns_vendor              (供應商，NetSuite record: vendor)
ns_employee            (員工，NetSuite record: employee)
ns_taxitem             (稅碼，NetSuite record: taxitem)
ns_expensecategory     (費用類別，NetSuite record: expensecategory)
ns_term                 (付款條件，NetSuite record: term)
ns_accountingperiod    (會計期間，NetSuite record: accountingperiod)
ns_shipitem            (運送方式，NetSuite record: shipitem)
ns_bom                 (BOM 配方，NetSuite record: bom)
ns_workcenter          (工作中心，NetSuite record: workcenter)
```

**命名原則**：
- ✅ 使用 `ns_` 前綴（NetSuite 的縮寫）
- ✅ 表名直接使用 NetSuite 的 record name（單數形式，小寫）
- ✅ 不使用複數形式（例如：`ns_subsidiaries` ❌ → `ns_subsidiary` ✅）
- ✅ 不使用 Account ID 作為前綴（例如：`td3018275_subsidiary` ❌）
- ✅ 系統表不使用 `ns_` 前綴：`transaction_references`, `sync_logs`, `table_mapping_config`

**實際使用範例**：
- 公司別表：`ns_subsidiary`
- 產品主檔表：`ns_item`
- 客戶表：`ns_customer`

### 4.2 核心表結構

#### 4.2.1 公司別（Subsidiaries）⭐ 最高優先級

```sql
-- ============================================
-- 公司別（Subsidiary）
-- 說明：NetSuite 的一切都屬於某個 Subsidiary
-- 優先級：🔴 最高（必須最先建立）
-- 
-- ⚠️ 重要：此結構已根據實際 NetSuite SuiteQL 查詢結果更新
-- ============================================
CREATE TABLE ns_subsidiary (
  -- 主鍵
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- NetSuite 映射
  netsuite_internal_id INTEGER UNIQUE NOT NULL,  -- NetSuite 的 internalId (id)
  name VARCHAR(255) NOT NULL,                     -- 公司名稱（name）
  legal_name VARCHAR(255),                        -- 法定名稱（legalname）
  
  -- 業務欄位
  country VARCHAR(100),                           -- 國家（country）
  base_currency_id INTEGER,                       -- 基準幣別 ID（currency）
  is_elimination BOOLEAN DEFAULT FALSE,           -- 是否為合併排除公司（iselimination = 'T'）
  
  -- 階層結構
  parent_id INTEGER,                              -- 父公司 ID（parent）
  full_name VARCHAR(500),                         -- 完整階層名稱（fullname，如 "HEADQUARTERS : AMERICAS : US - West"）
  
  -- 額外資訊
  state VARCHAR(100),                             -- 州/省（state）
  email VARCHAR(255),                             -- 電子郵件（email）
  fiscal_calendar_id INTEGER,                    -- 會計年度曆 ID（fiscalcalendar）
  
  -- 狀態與同步
  is_active BOOLEAN DEFAULT TRUE,                -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),       -- 最後同步時間
  
  -- 審計欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引（加速查詢）
CREATE INDEX idx_subsidiaries_internal_id ON ns_subsidiary(netsuite_internal_id);
CREATE INDEX idx_subsidiaries_name ON ns_subsidiary(name);
CREATE INDEX idx_subsidiaries_parent_id ON ns_subsidiary(parent_id);
CREATE INDEX idx_subsidiaries_full_name ON ns_subsidiary(full_name);

-- 註解
COMMENT ON TABLE ns_subsidiary IS 'NetSuite 公司別主檔';
COMMENT ON COLUMN ns_subsidiary.netsuite_internal_id IS 'NetSuite Internal ID (唯一識別碼)';
COMMENT ON COLUMN ns_subsidiary.name IS '公司名稱（業務系統查詢用）';
COMMENT ON COLUMN ns_subsidiary.parent_id IS '父公司 ID（支援階層式公司結構）';
COMMENT ON COLUMN ns_subsidiary.full_name IS '完整階層名稱（如 "HEADQUARTERS : AMERICAS : US - West"）';
COMMENT ON COLUMN ns_subsidiary.state IS '州/省代碼';
COMMENT ON COLUMN ns_subsidiary.email IS '公司電子郵件';
COMMENT ON COLUMN ns_subsidiary.fiscal_calendar_id IS '會計年度曆 ID';
```

**NetSuite SuiteQL 查詢範例**：
```sql
SELECT 
  id, 
  name, 
  legalname, 
  country, 
  currency, 
  parent,
  fullname,
  iselimination,
  state,
  email,
  fiscalcalendar,
  isinactive 
FROM subsidiary 
WHERE isinactive = 'F'
```

**欄位對照說明**：
- ✅ `id` → `netsuite_internal_id`
- ✅ `name` → `name`
- ✅ `legalname` → `legal_name`（可能為 NULL）
- ✅ `country` → `country`
- ✅ `currency` → `base_currency_id`
- ✅ `parent` → `parent_id`
- ✅ `fullname` → `full_name`
- ✅ `iselimination` → `is_elimination`（'T'/'F' → BOOLEAN）
- ✅ `isinactive` → `is_active`（'F'/'T' → BOOLEAN，需反轉）
- ✅ `state` → `state`
- ✅ `email` → `email`
- ✅ `fiscalcalendar` → `fiscal_calendar_id`

**額外發現的欄位**（可選，視需求加入）：
- `mainaddress` - 主要地址 ID
- `shippingaddress` - 運送地址 ID
- `returnaddress` - 退回地址 ID
- `lastmodifieddate` - 最後修改日期

#### 4.2.2 幣別（Currencies）

```sql
-- ============================================
-- 幣別（Currency）
-- 說明：所有交易都需要指定幣別
-- 優先級：🔴 最高
-- ============================================
CREATE TABLE ns_currencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  
  -- 基本資訊
  name VARCHAR(100) NOT NULL,                     -- "Taiwan Dollar" (name)
  symbol VARCHAR(10),                              -- "TWD" (symbol)
  display_symbol VARCHAR(10),                 -- 顯示符號（displaysymbol，如 "$"）
  
  -- 匯率
  exchange_rate DECIMAL(15,6),                    -- 對基準幣別的匯率 (exchangerate)
  is_base_currency BOOLEAN DEFAULT FALSE,         -- 是否為基準幣別 (isbasecurrency = 'T')
  currency_precision INTEGER DEFAULT 2,           -- 貨幣精度（小數位數，currencyprecision）
  
  -- 格式設定（可選）
  symbol_placement VARCHAR(50),                   -- 符號位置 (symbolplacement)
  override_currency_format BOOLEAN DEFAULT FALSE, -- 是否覆蓋貨幣格式 (overridecurrencyformat)
  include_in_fx_rate_updates BOOLEAN DEFAULT FALSE, -- 是否包含在匯率更新中 (includeinfxrateupdates)
  fx_rate_update_timezone VARCHAR(100),           -- 匯率更新時區 (fxrateupdatetimezone)
  
  -- 狀態
  is_active BOOLEAN DEFAULT TRUE,                -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_currencies_internal_id ON ns_currencies(netsuite_internal_id);
CREATE INDEX idx_currencies_symbol ON ns_currencies(symbol);

COMMENT ON TABLE ns_currencies IS 'NetSuite 幣別主檔';
```

#### 4.2.3 部門（Departments）

```sql
-- ============================================
-- 部門（Department）
-- 說明：組織架構的部門維度
-- 優先級：🟡 中（依賴 Subsidiary）
-- ============================================
CREATE TABLE ns_department (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  
  -- 基本資訊
  name VARCHAR(255) NOT NULL,                     -- "研發一部" (name)
  
  -- ⚠️ 重要：subsidiary 是字串列表，不是單一 INTEGER
  -- 格式為 "1, 3, 4, 5"，需要解析後使用
  subsidiary_ids TEXT,                            -- 所屬公司列表 (subsidiary，字串列表)
  
  -- 階層結構
  parent_id INTEGER,                              -- 上層部門 (parent)
  full_name VARCHAR(500),                         -- 完整階層名稱 (fullname，如 "總公司 : 研發處 : 研發一部")
  include_children BOOLEAN DEFAULT FALSE,          -- 是否包含子部門 (includechildren = 'T')
  
  -- 狀態
  is_inactive BOOLEAN DEFAULT FALSE,              -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_departments_internal_id ON ns_department(netsuite_internal_id);
CREATE INDEX idx_departments_name ON ns_department(name);
CREATE INDEX idx_departments_subsidiary_id ON ns_department(subsidiary_id);

COMMENT ON TABLE ns_department IS 'NetSuite 部門主檔';
COMMENT ON COLUMN ns_department.subsidiary_id IS '所屬公司 ID（從 NetSuite subsidiary 字串列表取第一個值轉換為 INTEGER）';
COMMENT ON COLUMN ns_department.full_name IS '完整階層名稱（查詢用）';
```

#### 4.2.4 類別（Classes）

```sql
-- ============================================
-- 類別（Class）
-- 說明：產品線/品牌/專案的分類維度
-- 優先級：🟡 中
-- ============================================
CREATE TABLE ns_classification (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  
  -- 基本資訊
  name VARCHAR(255) NOT NULL,                     -- "硬體事業部" (name)
  
  -- ⚠️ 重要：NetSuite SuiteQL 中 subsidiary 是字串列表（如 "1, 3, 4"）
  -- 但實際資料庫使用 subsidiary_id (INTEGER)，取第一個值
  subsidiary_id INTEGER,                          -- 所屬公司 ID（取第一個值）
  
  -- 階層結構
  parent_id INTEGER,
  full_name VARCHAR(500),
  
  -- 狀態
  is_inactive BOOLEAN DEFAULT FALSE,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_classes_internal_id ON ns_classification(netsuite_internal_id);
CREATE INDEX idx_classes_name ON ns_classification(name);

COMMENT ON TABLE ns_classification IS 'NetSuite 類別主檔（產品線/品牌/專案）';
```

#### 4.2.5 地點（Locations）

```sql
-- ============================================
-- 地點（Location）
-- 說明：倉庫/門市/辦公室
-- 優先級：🟡 中（WMS 必要）
-- ============================================
CREATE TABLE ns_location (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  
  -- 基本資訊
  name VARCHAR(255) NOT NULL,                     -- "台北倉" (name)
  
  -- ⚠️ 重要：NetSuite SuiteQL 中 subsidiary 是字串列表（如 "1, 3, 4"）
  -- 但實際資料庫使用 subsidiary_id (INTEGER)，取第一個值
  subsidiary_id INTEGER,                          -- 所屬公司 ID（取第一個值）
  
  -- ⚠️ 注意：實際資料庫中沒有以下欄位：
  -- parent_id, full_name, main_address_id, location_type,
  -- make_inventory_available, make_inventory_available_store,
  -- latitude, longitude, tran_prefix
  
  -- ✅ 實際資料庫中有但指南中沒有：
  address_text TEXT,                              -- 地址文字
  use_bins BOOLEAN,                               -- 是否使用儲位
  
  -- 狀態
  is_inactive BOOLEAN DEFAULT FALSE,              -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_locations_internal_id ON ns_location(netsuite_internal_id);
CREATE INDEX idx_locations_name ON ns_location(name);

COMMENT ON TABLE ns_location IS 'NetSuite 地點主檔（倉庫/門市/辦公室）';
COMMENT ON COLUMN ns_location.subsidiary_id IS '所屬公司 ID（從 NetSuite subsidiary 字串列表取第一個值轉換為 INTEGER）';
COMMENT ON COLUMN ns_location.address_text IS '地址文字';
COMMENT ON COLUMN ns_location.use_bins IS '是否使用儲位';
```

#### 4.2.6 會計科目（Accounts）⭐ 財務核心

```sql
-- ============================================
-- 會計科目（Account）
-- 說明：財務報表的底層邏輯
-- 優先級：🔴 高（費用報銷、日記帳必要）
-- ============================================
CREATE TABLE ns_account (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  
  -- ⚠️ 重要：acctnumber 和 acctname 在 NetSuite SuiteQL 中不存在！
  -- 實際欄位是 accountsearchdisplayname 和 displaynamewithhierarchy
  -- 但實際資料庫使用 acct_number 和 acct_name
  acct_number VARCHAR(255),                       -- 科目編號（可能為 NULL，NetSuite SuiteQL 中不存在）
  acct_name VARCHAR(255) NOT NULL,               -- 科目名稱（使用 displaynamewithhierarchy 或 accountsearchdisplayname）
  full_name VARCHAR(500),                        -- 完整階層名稱（使用 displaynamewithhierarchy）
  
  -- 科目類型
  acct_type VARCHAR(100),                         -- 科目類型 (accttype: Income, Expense, Asset, Liability, Equity)
  
  -- ⚠️ 注意：實際資料庫中沒有 parent_id 和 is_summary 欄位
  
  -- 所屬公司
  -- ⚠️ 重要：NetSuite SuiteQL 中 subsidiary 是字串列表（如 "1, 3, 4"）
  -- 但實際資料庫使用 subsidiary_id (INTEGER)，取第一個值
  subsidiary_id INTEGER,                          -- 所屬公司 ID（取第一個值）
  
  -- 狀態
  is_inactive BOOLEAN DEFAULT FALSE,             -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accounts_internal_id ON ns_account(netsuite_internal_id);
CREATE INDEX idx_accounts_acct_name ON ns_account(acct_name);
CREATE INDEX idx_accounts_type ON ns_account(acct_type);
CREATE INDEX idx_accounts_full_name ON ns_account(full_name);
CREATE INDEX idx_accounts_subsidiary_id ON ns_account(subsidiary_id);

COMMENT ON TABLE ns_account IS 'NetSuite 會計科目主檔';
COMMENT ON COLUMN ns_account.acct_number IS '科目編號（可能為 NULL，NetSuite SuiteQL 中不存在此欄位）';
COMMENT ON COLUMN ns_account.acct_name IS '科目名稱（使用 NetSuite displaynamewithhierarchy 或 accountsearchdisplayname）';
COMMENT ON COLUMN ns_account.full_name IS '完整階層名稱（使用 NetSuite displaynamewithhierarchy，如 "Salaries & Wages : Bonus"）';
COMMENT ON COLUMN ns_account.acct_type IS '科目類型：Income(收入)/Expense(費用)/Asset(資產)/Liability(負債)/Equity(權益)';
COMMENT ON COLUMN ns_account.subsidiary_id IS '所屬公司 ID（從 NetSuite subsidiary 字串列表取第一個值轉換為 INTEGER）';
```

#### 4.2.7 產品主檔（Items）⭐ 交易核心

```sql
-- ============================================
-- 產品/服務主檔（Item）
-- 說明：所有交易明細的核心
-- 優先級：🔴 最高（POS/EC/WMS 必要）
-- ============================================
CREATE TABLE ns_item (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  
  -- 基本資訊
  item_id VARCHAR(255) NOT NULL,                  -- 料號 (itemid)
  name VARCHAR(255) NOT NULL,                     -- 顯示名稱 (displayname)
  display_name VARCHAR(255),                      -- 顯示名稱 (displayname，與 name 相同)
  -- ⚠️ 注意：實際資料庫中沒有 full_name 欄位
  
  -- 產品類型
  item_type VARCHAR(100),                         -- 產品類型 (itemtype: Inventory, Non-Inventory, Service, Kit, Assembly)
  subtype VARCHAR(100),                           -- 子類型 (subtype)
  
  -- 描述
  description TEXT,                               -- 描述 (description)
  sales_description TEXT,                         -- 銷售描述 (salesdescription)
  purchase_description TEXT,                      -- 採購描述 (purchasedescription)
  
  -- 價格與成本
  base_price DECIMAL(15,2),                       -- 基本售價 (baseprice，從 REST API 取得)
  cost_estimate DECIMAL(15,2),                    -- 估計成本（可選）
  -- ⚠️ 注意：實際資料庫中沒有 costing_method 欄位
  
  -- 預設會計科目（可在交易時覆寫）
  income_account_id INTEGER,                      -- 銷貨收入科目 (incomeaccount)
  expense_account_id INTEGER,                     -- 銷貨成本科目 (expenseaccount)
  asset_account_id INTEGER,                       -- 存貨科目 (assetaccount)
  
  -- ⚠️ 注意：實際資料庫中沒有以下欄位：
  -- parent_id, subsidiary_ids, default_class_id, default_department_id, default_location_id
  
  -- 稅務
  tax_schedule_id INTEGER,                        -- 稅務排程 ID (可選)
  
  -- 製造業專用
  is_assembly BOOLEAN DEFAULT FALSE,              -- 是否為組合品（需要生產）
  build_time DECIMAL(10,2),                       -- 生產時間（小時，可選）
  default_build_location_id INTEGER,              -- 預設生產地點（可選）
  
  -- 狀態
  is_inactive BOOLEAN DEFAULT FALSE,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_items_internal_id ON ns_item(netsuite_internal_id);
CREATE INDEX idx_items_item_id ON ns_item(item_id);
CREATE INDEX idx_items_name ON ns_item(name);
CREATE INDEX idx_items_type ON ns_item(item_type);
CREATE INDEX idx_items_is_assembly ON ns_item(is_assembly) WHERE is_assembly = TRUE;

COMMENT ON TABLE ns_item IS 'NetSuite 產品/服務主檔';
COMMENT ON COLUMN ns_item.item_type IS '產品類型（優先使用 SuiteQL 的 itemtype，因為它更準確）：InvtPart(庫存品)/NonInvtPart(非庫存品)/Service(服務)/Kit(套裝)/Assembly(組合品)/GiftCert(禮品卡)/Markup(加價)/Discount(折扣)/Group(群組)';
COMMENT ON COLUMN ns_item.is_assembly IS '是否為需要生產的組合品（MES 用）';
COMMENT ON COLUMN ns_item.base_price IS '基本售價（從 REST API 取得，SuiteQL 不支援價格欄位）';
```

#### 4.2.8 客戶主檔（Customers）

```sql
-- ============================================
-- 客戶主檔（Customer）
-- 說明：銷售交易的對象
-- 優先級：🔴 高（POS/EC 必要）
-- ============================================
CREATE TABLE ns_customer (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  
  -- 基本資訊
  entity_id VARCHAR(255),                         -- 客戶編號 (entityid)
  name VARCHAR(255) NOT NULL,                     -- 公司名稱或個人名稱 (companyname 或 fullname)
  company_name VARCHAR(255),                      -- 公司名稱 (companyname)
  -- ⚠️ 注意：實際資料庫中沒有 alt_name, is_person, first_name, last_name 欄位
  
  -- 聯絡資訊
  email VARCHAR(255),                             -- 電子郵件 (email)
  phone VARCHAR(100),                             -- 電話 (phone)
  
  -- 預設值
  -- ⚠️ 重要：NetSuite SuiteQL 的 customer 表可能沒有 subsidiary 欄位
  subsidiary_id INTEGER,                          -- 所屬公司 ID（可能為 null）
  currency_id INTEGER,                            -- 預設幣別 (currency)
  terms_id INTEGER,                               -- 付款條件 (terms)
  
  -- 狀態
  is_inactive BOOLEAN DEFAULT FALSE,              -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_internal_id ON ns_customer(netsuite_internal_id);
CREATE INDEX idx_customers_entity_id ON ns_customer(entity_id);
CREATE INDEX idx_customers_name ON ns_customer(name);

COMMENT ON TABLE ns_customer IS 'NetSuite 客戶主檔';
```

#### 4.2.9 供應商主檔（Vendors）

```sql
-- ============================================
-- 供應商主檔（Vendor）
-- 說明：採購交易的對象
-- 優先級：🟡 中（採購系統必要）
-- ============================================
CREATE TABLE ns_vendor (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  
  -- 基本資訊
  entity_id VARCHAR(255),                         -- 供應商編號 (entityid)
  name VARCHAR(255) NOT NULL,                     -- 公司名稱或個人名稱 (companyname 或 fullname)
  company_name VARCHAR(255),                      -- 公司名稱 (companyname)
  -- ⚠️ 注意：實際資料庫中沒有 alt_name, is_person 欄位
  
  -- 聯絡資訊
  email VARCHAR(255),                             -- 電子郵件 (email)
  phone VARCHAR(100),                             -- 電話 (phone)
  
  -- 預設值
  -- ⚠️ 重要：NetSuite SuiteQL 的 vendor 表可能沒有 subsidiary 欄位
  subsidiary_id INTEGER,                          -- 所屬公司 ID（可能為 null）
  currency_id INTEGER,                            -- 預設幣別 (currency)
  terms_id INTEGER,                               -- 付款條件 (terms)
  
  -- 狀態
  is_inactive BOOLEAN DEFAULT FALSE,              -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendors_internal_id ON ns_vendor(netsuite_internal_id);
CREATE INDEX idx_vendors_entity_id ON ns_vendor(entity_id);
CREATE INDEX idx_vendors_name ON ns_vendor(name);

COMMENT ON TABLE ns_vendor IS 'NetSuite 供應商主檔';
```

#### 4.2.10 員工主檔（Employees）

```sql
-- ============================================
-- 員工主檔（Employee）
-- 說明：費用報銷的主體
-- 優先級：🟡 中（報支系統必要）
-- ============================================
CREATE TABLE ns_employee (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  
  -- 基本資訊
  entity_id VARCHAR(255),                         -- 員工編號 (entityid)
  name VARCHAR(255) NOT NULL,                     -- 完整名稱（由 firstname + lastname 組合，NetSuite SuiteQL 沒有 fullname 欄位）
  email VARCHAR(255),                             -- 電子郵件 (email)
  -- ⚠️ 注意：實際資料庫中沒有 first_name, last_name, title, hire_date, employee_status, employee_type 欄位
  
  -- 組織關係
  department_id INTEGER,                          -- 所屬部門 (department)
  subsidiary_id INTEGER,                          -- 所屬公司 (subsidiary，單一 INTEGER，與 Department/Class 不同)
  
  -- 狀態
  is_inactive BOOLEAN DEFAULT FALSE,              -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employees_internal_id ON ns_employee(netsuite_internal_id);
CREATE INDEX idx_employees_name ON ns_employee(name);
CREATE INDEX idx_employees_email ON ns_employee(email);

COMMENT ON TABLE ns_employee IS 'NetSuite 員工主檔';
```

#### 4.2.11 稅碼（Tax Codes）

```sql
-- ============================================
-- 稅碼（Tax Code）
-- 說明：台灣必備的營業稅設定
-- 優先級：🔴 高（所有銷售交易必要）
-- ============================================
CREATE TABLE ns_taxitem (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  
  -- ⚠️ 重要：NetSuite 使用 itemid 而不是 name
  name VARCHAR(255) NOT NULL,                     -- 稅碼名稱 (itemid，實際欄位名)
  
  -- 稅碼資訊
  rate DECIMAL(5,2),                              -- 稅率 (rate)
  description TEXT,                               -- 描述 (description)
  
  -- 組織關係
  country VARCHAR(100),                            -- 國家代碼（country，例如：TW, US, CN）
  -- ⚠️ 重要：根據 NetSuite 邏輯，稅碼是根據 Country 來篩選的
  -- 流程：Employee → Subsidiary → Country → Tax Code
  
  -- ⚠️ 注意：實際資料庫中沒有以下欄位：
  -- full_name, parent_id, tax_account_id, sale_account_id, updated_at, subsidiary_id
  
  -- 狀態
  is_inactive BOOLEAN DEFAULT FALSE,              -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tax_codes_internal_id ON ns_taxitem(netsuite_internal_id);
CREATE INDEX idx_tax_codes_name ON ns_taxitem(name);
CREATE INDEX idx_tax_codes_country ON ns_taxitem(country);

COMMENT ON TABLE ns_taxitem IS 'NetSuite 稅碼主檔';
COMMENT ON COLUMN ns_taxitem.country IS '國家代碼（country，例如：TW, US, CN），用於根據 Employee → Subsidiary → Country → Tax Code 的流程篩選稅碼';
```

#### 4.2.12 費用類別（Expense Categories）

```sql
-- ============================================
-- 費用類別（Expense Category）
-- 說明：費用報銷的分類（Account 的易用版）
-- 優先級：🟡 中（報支系統必要）
-- ============================================
CREATE TABLE ns_expensecategory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  
  -- 費用資訊
  name VARCHAR(255) NOT NULL,                     -- "交通費" (name)
  
  -- ⚠️ 重要：NetSuite 使用 expenseacct 而不是 account
  expense_account_id INTEGER,                     -- 對應的會計科目 ID (expenseacct)
  
  -- ⚠️ 注意：實際資料庫中沒有以下欄位：
  -- subsidiary_ids, default_rate, rate_required, updated_at
  
  -- 狀態
  is_inactive BOOLEAN DEFAULT FALSE,              -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expense_categories_internal_id ON ns_expensecategory(netsuite_internal_id);
CREATE INDEX idx_expense_categories_name ON ns_expensecategory(name);

COMMENT ON TABLE ns_expensecategory IS 'NetSuite 費用類別主檔（報支系統用）';
```

#### 4.2.13 付款條件（Terms）

```sql
-- ============================================
-- 付款條件（Terms）
-- 說明：客戶/供應商的付款條件
-- 優先級：🟢 低（可延後建立）
-- ============================================
CREATE TABLE ns_term (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  
  -- 條件資訊
  name VARCHAR(255) NOT NULL,                     -- "Net 30" (name)
  days_until_net_due INTEGER,                     -- 30 天內付款 (daysuntilnetdue)
  discount_percent DECIMAL(5,2),                  -- 提前付款折扣 (discountpercent)
  days_until_expiry INTEGER,                      -- 折扣期限 (daysuntilexpiry)
  
  -- ⚠️ 注意：實際資料庫中沒有以下欄位：
  -- is_date_driven, due_next_month_if_within_days, day_of_month_net_due, updated_at
  
  -- 狀態
  is_inactive BOOLEAN DEFAULT FALSE,              -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_terms_internal_id ON ns_term(netsuite_internal_id);

COMMENT ON TABLE ns_term IS 'NetSuite 付款條件主檔';
```

#### 4.2.14 會計期間（Accounting Periods）

**⚠️ 重要：SuiteQL 不支援此表，必須使用 REST API**

```sql
-- ============================================
-- 會計期間（Accounting Period）
-- 說明：財務過帳的期間控制
-- 優先級：🔴 高（所有交易必要）
-- 
-- ⚠️ 重要：此表無法透過 SuiteQL 查詢，必須使用 REST API
-- ============================================
CREATE TABLE ns_accountingperiod (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,     -- id (REST API 返回字串，需轉換為 INTEGER)
  
  -- 期間資訊
  period_name VARCHAR(100),                         -- 期間名稱 (periodName，如 "Jan 2025", "FY 2025")
  start_date DATE,                                   -- 開始日期 (startDate)
  end_date DATE,                                     -- 結束日期 (endDate)
  
  -- 期間類型
  is_quarter BOOLEAN DEFAULT FALSE,                -- 是否為季度 (isQuarter)
  is_year BOOLEAN DEFAULT FALSE,                    -- 是否為年度 (isYear)
  -- ⚠️ 注意：isAdjustment 在 REST API 中不存在，已移除
  
  -- 狀態
  -- ⚠️ 重要：REST API 欄位名是 closed，不是 isClosed
  is_closed BOOLEAN DEFAULT FALSE,                  -- 是否已關閉 (closed)
  is_inactive BOOLEAN DEFAULT FALSE,               -- 是否停用 (isInactive)
  is_posting BOOLEAN DEFAULT FALSE,                 -- 是否可過帳 (isPosting)
  
  -- 鎖定狀態
  all_locked BOOLEAN DEFAULT FALSE,                 -- 所有科目都已鎖定 (allLocked)
  ap_locked BOOLEAN DEFAULT FALSE,                  -- 應付帳款已鎖定 (apLocked)
  ar_locked BOOLEAN DEFAULT FALSE,                  -- 應收帳款已鎖定 (arLocked)
  allow_non_gl_changes BOOLEAN DEFAULT FALSE,       -- 是否允許非 GL 變更 (allowNonGLChanges)
  
  -- 會計年度曆
  fiscal_calendar_id INTEGER,                        -- 會計年度曆 ID (fiscalCalendar.id)
  
  -- 同步
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_periods_internal_id ON ns_accountingperiod(netsuite_internal_id);
CREATE INDEX idx_periods_dates ON ns_accountingperiod(start_date, end_date);
CREATE INDEX idx_periods_closed ON ns_accountingperiod(is_closed);

COMMENT ON TABLE ns_accountingperiod IS 'NetSuite 會計期間主檔（必須使用 REST API 同步）';
COMMENT ON COLUMN ns_accountingperiod.is_closed IS '是否已關閉（對應 REST API 的 closed 欄位，不是 isClosed）';
COMMENT ON COLUMN ns_accountingperiod.fiscal_calendar_id IS '會計年度曆 ID（從 fiscalCalendar.id 取得）';
```

**同步實作方式**（必須使用 REST API）：

```typescript
// 使用 REST API List API（SuiteQL 不支援）
const result = await netsuite.getRecordList('accountingperiod', {
  fetchAll: true,
  limit: 1000,
});

// 轉換資料時注意：
// 1. id 是字串，需要 parseInt(item.id)
// 2. closed 不是 isClosed
// 3. isAdjustment 不存在，需要移除
// 4. fiscalCalendar 是物件，需要取得 fiscalCalendar.id
```

#### 4.2.15 運送方式（Ship Methods）

```sql
-- ============================================
-- 運送方式（Ship Method）
-- 說明：出貨單的運送方式
-- 優先級：🟢 低（出貨流程才需要）
-- ============================================
CREATE TABLE ns_shipitem (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  
  -- ⚠️ 重要：NetSuite 使用 itemid 而不是 name
  name VARCHAR(255) NOT NULL,                     -- 運送方式名稱 (itemid，實際欄位名)
  -- ⚠️ 注意：實際資料庫中沒有 description, display_name, service_code, subsidiary_ids, updated_at 欄位
  
  -- 狀態
  is_inactive BOOLEAN DEFAULT FALSE,              -- isinactive = 'F'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ship_methods_internal_id ON ns_shipitem(netsuite_internal_id);

COMMENT ON TABLE ns_shipitem IS 'NetSuite 運送方式主檔';
```

### 4.3 製造業專屬表（MES/WMS）

#### 4.3.1 配方表頭（BOM Headers）⭐ 製造核心

**⚠️ 重要：SuiteQL 不支援此表，必須使用 REST API（製造模組啟用後可用）**

```sql
-- ============================================
-- 配方表頭（BOM Header）
-- 說明：定義成品由哪些原料組成
-- 優先級：🔴 最高（MES 必要）
-- 
-- ⚠️ 重要：此表無法透過 SuiteQL 查詢，必須使用 REST API
-- ✅ 已確認：製造模組啟用後，REST API 可以正常查詢
-- ============================================
CREATE TABLE ns_bom (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,     -- id (REST API 返回字串，需轉換為 INTEGER)
  
  -- BOM 資訊
  assembly_item_id INTEGER NOT NULL,              -- 成品的 Item ID (assembly.id，需從物件中取得)
  name VARCHAR(255),                               -- BOM 名稱 (name)
  -- ⚠️ 注意：REST API 中沒有 revision 欄位
  
  -- 有效期間
  is_active BOOLEAN DEFAULT TRUE,                  -- isInactive = false
  -- ⚠️ 注意：REST API 中沒有 effective_date 和 obsolete_date 欄位
  
  -- 設定
  available_for_all_assemblies BOOLEAN DEFAULT FALSE, -- availableForAllAssemblies
  available_for_all_locations BOOLEAN DEFAULT FALSE,  -- availableForAllLocations
  use_component_yield BOOLEAN DEFAULT FALSE,          -- useComponentYield
  used_on_assembly BOOLEAN DEFAULT FALSE,             -- usedOnAssembly
  
  -- 所屬公司
  subsidiary_ids TEXT,                              -- subsidiary (物件，需從 links 或物件中取得 ID)
  
  -- 說明
  memo TEXT,                                        -- memo（可選）
  
  -- 同步
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bom_headers_internal_id ON ns_bom(netsuite_internal_id);
CREATE INDEX idx_bom_headers_assembly ON ns_bom(assembly_item_id);
CREATE INDEX idx_bom_headers_active ON ns_bom(is_active);

COMMENT ON TABLE ns_bom IS 'NetSuite BOM 配方表頭（必須使用 REST API 同步）';
COMMENT ON COLUMN ns_bom.assembly_item_id IS '成品的 netsuite_internal_id（從 assembly.id 或 links 取得）';
```

**同步實作方式**（必須使用 REST API）：

```typescript
// 使用 REST API List API（SuiteQL 不支援）
const result = await netsuite.getRecordList('bom', {
  fetchAll: true,
  limit: 1000,
});

// 轉換資料時注意：
// 1. id 是字串，需要 parseInt(item.id)
// 2. assembly 是物件，需要取得 assembly.id 或透過 links 取得
// 3. subsidiary 是物件，需要取得 subsidiary.id
// 4. BOM Components（BOM Lines）需要從其他端點或子資源取得
```

#### 4.3.2 配方明細（BOM Lines）

```sql
-- ============================================
-- 配方明細（BOM Lines）
-- 說明：BOM 的組成原料清單
-- 優先級：🔴 最高（MES 必要）
-- ============================================
CREATE TABLE ns_bom_line (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 關聯
  bom_header_id UUID REFERENCES ns_bom(id),
  netsuite_bom_id INTEGER,                         -- 對應 ns_bom.netsuite_internal_id
  
  -- 明細資訊
  line_number INTEGER,                             -- 行號
  component_item_id INTEGER NOT NULL,              -- 原料/零件的 Item ID
  quantity DECIMAL(15,4) NOT NULL,                 -- 需要的數量
  unit_of_measure VARCHAR(50),                     -- 單位
  
  -- 進階欄位
  component_yield DECIMAL(5,2) DEFAULT 100.00,     -- 零件損耗率（%）
  is_phantom BOOLEAN DEFAULT FALSE,                -- 是否為虛擬組件
  supply_type VARCHAR(50),                         -- 'Purchase', 'Transfer', 'Phantom'
  
  -- 審計
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bom_lines_header ON ns_bom_line(bom_header_id);
CREATE INDEX idx_bom_lines_netsuite_bom ON ns_bom_line(netsuite_bom_id);
CREATE INDEX idx_bom_lines_component ON ns_bom_line(component_item_id);

COMMENT ON TABLE ns_bom_line IS 'NetSuite BOM 配方明細';
COMMENT ON COLUMN ns_bom_line.component_item_id IS '原料的 netsuite_internal_id (from ns_item)';
COMMENT ON COLUMN ns_bom_line.component_yield IS '良率（100 = 無損耗）';
```

#### 4.3.3 工作中心（Work Centers）

```sql
-- ============================================
-- 工作中心（Work Center）
-- 說明：產線/機台/工作站
-- 優先級：🟡 中（進階 MES 需要）
-- ============================================
CREATE TABLE ns_workcenter (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  
  -- 基本資訊
  name VARCHAR(255) NOT NULL,                      -- "包裝線 A"
  location_id INTEGER,                             -- 所在地點
  
  -- 產能資訊
  capacity_per_hour DECIMAL(10,2),                 -- 每小時產能
  cost_per_hour DECIMAL(10,2),                     -- 每小時成本
  
  -- 狀態
  is_active BOOLEAN DEFAULT TRUE,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_work_centers_internal_id ON ns_workcenter(netsuite_internal_id);
CREATE INDEX idx_work_centers_location ON ns_workcenter(location_id);

COMMENT ON TABLE ns_workcenter IS 'NetSuite 工作中心主檔（產線/機台）';
```

#### 4.3.4 工序表（Routings）- 選配

```sql
-- ============================================
-- 工序主表（Routing）
-- 說明：生產流程的工序定義
-- 優先級：🟢 低（進階 MES 才需要）
-- ============================================
CREATE TABLE ns_routing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  
  -- 工序資訊
  assembly_item_id INTEGER NOT NULL,              -- 成品 ID
  name VARCHAR(255),
  revision VARCHAR(50),
  
  -- 狀態
  is_active BOOLEAN DEFAULT TRUE,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routings_internal_id ON ns_routing(netsuite_internal_id);
CREATE INDEX idx_routings_assembly ON ns_routing(assembly_item_id);

-- ============================================
-- 工序明細（Routing Steps）
-- ============================================
CREATE TABLE ns_routing_step (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 關聯
  routing_id UUID REFERENCES ns_routing(id),
  netsuite_routing_id INTEGER,
  
  -- 工序資訊
  sequence_number INTEGER,                         -- 工序順序
  operation_name VARCHAR(255),                     -- "裝罐"、"封箱"、"貼標"
  work_center_id INTEGER,                          -- 在哪個產線做
  
  -- 時間
  setup_time DECIMAL(10,2),                        -- 準備時間（分鐘）
  run_time DECIMAL(10,2),                          -- 加工時間（分鐘/件）
  
  -- 審計
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routing_steps_routing ON ns_routing_step(routing_id);
CREATE INDEX idx_routing_steps_sequence ON ns_routing_step(sequence_number);

COMMENT ON TABLE ns_routing IS 'NetSuite 工序主表';
COMMENT ON TABLE ns_routing_step IS 'NetSuite 工序明細';
```

### 4.4 輔助系統表

#### 4.4.1 交易追蹤表

```sql
-- ============================================
-- 交易追蹤表（Transaction References）
-- 說明：記錄中台與 NetSuite 的交易對應關係
-- 用途：追蹤 POS/EC/WMS/MES 的單據在 NetSuite 的狀態
-- ============================================
CREATE TABLE transaction_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 來源系統
  source_system VARCHAR(100),                      -- 'POS', 'EC', 'WMS', 'MES'
  source_transaction_id VARCHAR(255),              -- 來源系統的單號
  source_transaction_type VARCHAR(100),            -- 'Sale', 'Purchase', 'Transfer'
  
  -- NetSuite 對應
  netsuite_record_type VARCHAR(100),               -- 'salesOrder', 'purchaseOrder', 'workOrder'
  netsuite_internal_id INTEGER,                    -- NetSuite 返回的 Internal ID
  netsuite_tran_id VARCHAR(100),                   -- NetSuite 的單號（如 SO-12345）
  
  -- 狀態追蹤
  status VARCHAR(50),                              -- 'pending', 'success', 'failed', 'cancelled'
  error_message TEXT,                              -- 錯誤訊息
  retry_count INTEGER DEFAULT 0,                   -- 重試次數
  
  -- JSON 備份（除錯用）
  request_payload JSONB,                           -- 發送給 NetSuite 的 JSON
  response_payload JSONB,                          -- NetSuite 返回的 JSON
  
  -- 審計
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ                            -- 成功同步到 NetSuite 的時間
);

CREATE INDEX idx_txn_refs_source ON transaction_references(source_system, source_transaction_id);
CREATE INDEX idx_txn_refs_netsuite ON transaction_references(netsuite_internal_id);
CREATE INDEX idx_txn_refs_status ON transaction_references(status);
CREATE INDEX idx_txn_refs_created ON transaction_references(created_at DESC);

COMMENT ON TABLE transaction_references IS '交易追蹤表：記錄業務系統與 NetSuite 的單據對應';
```

#### 4.4.2 工單追蹤表

```sql
-- ============================================
-- 工單追蹤表（Work Order Tracking）
-- 說明：追蹤工單的生產狀態
-- 用途：MES 系統查詢工單進度
-- ============================================
CREATE TABLE work_order_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 來源資訊
  source_system VARCHAR(100),                      -- 'MES'
  source_wo_number VARCHAR(255),                   -- MES 的工單號
  
  -- NetSuite 工單
  netsuite_wo_id INTEGER,                          -- NetSuite Work Order ID
  netsuite_wo_number VARCHAR(100),                 -- "WO-12345"
  
  -- 工單內容
  assembly_item_id INTEGER,                        -- 成品 ID
  quantity_ordered DECIMAL(15,4),                  -- 下單數量
  quantity_completed DECIMAL(15,4) DEFAULT 0,      -- 完成數量
  quantity_scrapped DECIMAL(15,4) DEFAULT 0,       -- 報廢數量
  
  -- 狀態
  status VARCHAR(50),                              -- 'Released', 'InProgress', 'Completed', 'Closed'
  
  -- 地點與時間
  location_id INTEGER,
  start_date DATE,
  end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  
  -- 審計
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wo_tracking_source ON work_order_tracking(source_system, source_wo_number);
CREATE INDEX idx_wo_tracking_netsuite ON work_order_tracking(netsuite_wo_id);
CREATE INDEX idx_wo_tracking_status ON work_order_tracking(status);
CREATE INDEX idx_wo_tracking_assembly ON work_order_tracking(assembly_item_id);

COMMENT ON TABLE work_order_tracking IS '工單追蹤表：記錄 MES 工單在 NetSuite 的狀態';
```

#### 4.4.3 報支審核表（Expense Reviews）⭐ 報支流程核心

```sql
-- ============================================
-- 報支審核表（Expense Review）
-- 說明：暫存報支資料，供財務人員檢核後再寫入 NetSuite
-- 用途：報支流程的中間審核層
-- 優先級：🔴 高（報支系統必要）
-- ============================================
CREATE TABLE expense_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- ============================================
  -- 基本報支資訊
  -- ============================================
  expense_date DATE NOT NULL,                      -- 報支日期
  expense_category_id UUID,                        -- 費用類別 ID（對應 ns_expense_categories.id）
  expense_category_name VARCHAR(255),             -- 費用類別名稱（快取，避免 JOIN）
  employee_id UUID,                               -- 員工 ID（對應 ns_entities_employees.id）
  employee_name VARCHAR(255),                     -- 員工名稱（快取）
  subsidiary_id UUID,                             -- 公司別 ID（對應 ns_subsidiaries.id）
  subsidiary_name VARCHAR(255),                  -- 公司別名稱（快取）
  location_id UUID,                               -- 地點 ID（對應 ns_locations.id，可選）
  location_name VARCHAR(255),                    -- 地點名稱（快取，可選）
  department_id UUID,                             -- 部門 ID（對應 ns_departments.id，可選）
  department_name VARCHAR(255),                  -- 部門名稱（快取，可選）
  class_id UUID,                                 -- 類別 ID（對應 ns_classes.id，可選）
  class_name VARCHAR(255),                       -- 類別名稱（快取，可選）
  
  -- 金額資訊
  receipt_amount DECIMAL(15,2) NOT NULL,           -- 收據金額
  receipt_currency VARCHAR(10) NOT NULL,          -- 幣別（TWD, USD 等）
  currency_id UUID,                               -- 幣別 ID（對應 ns_currencies.id）
  use_multi_currency BOOLEAN DEFAULT FALSE,        -- 是否使用多幣別（表頭設定，影響表身是否顯示外幣金額和匯率欄位）
  
  -- 描述
  description TEXT,                               -- 報支描述
  
  -- 收據狀態
  receipt_missing BOOLEAN DEFAULT FALSE,         -- 收據遺失
  
  -- ============================================
  -- OCR 識別結果（發票資訊）
  -- ============================================
  invoice_title VARCHAR(255),                    -- 發票標題
  invoice_period VARCHAR(50),                    -- 發票期別
  invoice_number VARCHAR(100),                   -- 發票號碼
  invoice_date DATE,                              -- 開立時間
  random_code VARCHAR(50),                        -- 隨機碼
  format_code VARCHAR(50),                        -- 格式代號
  
  -- 賣方資訊
  seller_name VARCHAR(255),                       -- 賣方名稱
  seller_tax_id VARCHAR(50),                     -- 賣方統編
  seller_address TEXT,                            -- 賣方地址
  
  -- 買方資訊
  buyer_name VARCHAR(255),                        -- 買方名稱
  buyer_tax_id VARCHAR(50),                       -- 買方統編
  buyer_address TEXT,                             -- 買方地址
  
  -- 金額明細
  untaxed_amount DECIMAL(15,2),                   -- 未稅銷售額
  tax_amount DECIMAL(15,2),                       -- 稅額
  total_amount DECIMAL(15,2),                     -- 總計金額
  
  -- ============================================
  -- OCR 元數據
  -- ============================================
  ocr_success BOOLEAN DEFAULT FALSE,                -- OCR 處理是否成功
  ocr_confidence DECIMAL(5,2),                     -- OCR 辨識信心度（%）
  ocr_document_type VARCHAR(100),                 -- OCR 文件類型
  ocr_errors TEXT,                                -- OCR 錯誤訊息
  ocr_warnings TEXT,                              -- OCR 警告訊息
  ocr_error_count INTEGER DEFAULT 0,              -- OCR 錯誤數量
  ocr_warning_count INTEGER DEFAULT 0,            -- OCR 警告數量
  ocr_quality_grade VARCHAR(50),                 -- OCR 品質等級
  ocr_file_name VARCHAR(255),                    -- OCR 檔案名稱
  ocr_file_id VARCHAR(255),                       -- OCR 檔案 ID
  ocr_web_view_link TEXT,                         -- OCR 預覽連結
  ocr_processed_at TIMESTAMPTZ,                   -- OCR 處理時間
  
  -- ============================================
  -- 附件（圖片）
  -- ============================================
  attachment_url TEXT,                             -- 附件 URL（Supabase Storage，優先使用）
  attachment_base64 TEXT,                         -- 附件圖片（Base64 格式，備用）
  
  -- ============================================
  -- 審核狀態
  -- ============================================
  review_status VARCHAR(50) DEFAULT 'pending',    -- 審核狀態：pending(待審核), approved(已審核), rejected(已拒絕), cancelled(已取消)
  reviewed_by UUID,                          -- 審核人員 ID（對應 Supabase auth.users.id）
  reviewed_by_name VARCHAR(255),                  -- 審核人員名稱（快取）
  reviewed_at TIMESTAMPTZ,                        -- 審核時間
  review_notes TEXT,                              -- 審核備註
  rejection_reason TEXT,                          -- 拒絕原因（如果被拒絕）
  
  -- ============================================
  -- NetSuite 同步狀態
  -- ============================================
  netsuite_sync_status VARCHAR(50) DEFAULT 'pending', -- 同步狀態：pending(待同步), syncing(同步中), success(成功), failed(失敗)
  netsuite_internal_id INTEGER,                   -- NetSuite Internal ID（同步成功後填入）
  netsuite_tran_id VARCHAR(100),                  -- NetSuite 交易編號（如 ER-12345）
  netsuite_sync_error TEXT,                       -- NetSuite 同步錯誤訊息
  netsuite_synced_at TIMESTAMPTZ,                 -- NetSuite 同步時間
  netsuite_sync_retry_count INTEGER DEFAULT 0,    -- NetSuite 同步重試次數
  
  -- NetSuite 請求/回應備份（除錯用）
  netsuite_request_payload JSONB,                 -- 發送給 NetSuite 的 JSON
  netsuite_response_payload JSONB,                -- NetSuite 返回的 JSON
  
  -- ============================================
  -- 審計欄位
  -- ============================================
  created_by UUID,                                -- 建立人員 ID（對應 Supabase auth.users.id）
  created_by_name VARCHAR(255),                  -- 建立人員名稱（快取）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- ============================================
  -- 內部欄位
  -- ============================================
  internal_notes TEXT,                            -- 內部備註（僅供系統管理員使用）
  priority VARCHAR(20) DEFAULT 'normal',         -- 優先級：low, normal, high, urgent
  tags TEXT[]                                     -- 標籤（用於分類和搜尋）
);

-- 索引
CREATE INDEX idx_expense_reviews_status ON expense_reviews(review_status);
CREATE INDEX idx_expense_reviews_sync_status ON expense_reviews(netsuite_sync_status);
CREATE INDEX idx_expense_reviews_employee ON expense_reviews(employee_id);
CREATE INDEX idx_expense_reviews_subsidiary ON expense_reviews(subsidiary_id);
CREATE INDEX idx_expense_reviews_date ON expense_reviews(expense_date DESC);
CREATE INDEX idx_expense_reviews_created_at ON expense_reviews(created_at DESC);
CREATE INDEX idx_expense_reviews_reviewed_at ON expense_reviews(reviewed_at DESC);
CREATE INDEX idx_expense_reviews_invoice_number ON expense_reviews(invoice_number) WHERE invoice_number IS NOT NULL;
CREATE INDEX idx_expense_reviews_attachment_url ON expense_reviews(attachment_url) WHERE attachment_url IS NOT NULL;

-- 複合索引（常用查詢）
CREATE INDEX idx_expense_reviews_status_date ON expense_reviews(review_status, expense_date DESC);
CREATE INDEX idx_expense_reviews_sync_status_date ON expense_reviews(netsuite_sync_status, expense_date DESC);

-- 註解
COMMENT ON TABLE expense_reviews IS '報支審核表：暫存報支資料，供財務人員檢核後再寫入 NetSuite';
COMMENT ON COLUMN expense_reviews.review_status IS '審核狀態：pending(待審核), approved(已審核), rejected(已拒絕), cancelled(已取消)';
COMMENT ON COLUMN expense_reviews.netsuite_sync_status IS 'NetSuite 同步狀態：pending(待同步), syncing(同步中), success(成功), failed(失敗)';
COMMENT ON COLUMN expense_reviews.attachment_url IS '附件圖片 URL（Supabase Storage），優先使用此欄位，attachment_base64 作為備用';
COMMENT ON COLUMN expense_reviews.attachment_base64 IS '附件圖片（Base64 格式），建議大小限制在 10MB 以內，僅作為備用方案';
COMMENT ON COLUMN expense_reviews.review_notes IS '審核備註：財務人員可以在此記錄審核意見';
COMMENT ON COLUMN expense_reviews.rejection_reason IS '拒絕原因：如果審核狀態為 rejected，記錄拒絕原因';
COMMENT ON COLUMN expense_reviews.internal_notes IS '內部備註：僅供系統管理員使用，一般使用者看不到';
```

**報支流程說明**：

1. **提交階段**：使用者填寫報支表單並上傳發票圖片，資料寫入 `expense_reviews` 表，狀態為 `pending`
2. **審核階段**：財務人員在審核頁面查看待審核的報支，可以通過、拒絕或取消
3. **同步階段**：審核通過後，系統自動同步到 NetSuite，更新 `netsuite_sync_status` 和 `netsuite_internal_id`

**附件儲存策略**：

- **優先使用 Supabase Storage**：圖片上傳到 `expense-receipts` bucket，URL 存入 `attachment_url`
- **Base64 備用**：如果 Storage 上傳失敗，使用 `attachment_base64` 作為備用方案
- **讀取邏輯**：前端優先讀取 `attachment_url`，如果不存在或載入失敗，再使用 `attachment_base64`

**Supabase Storage 設定**：

1. 在 Supabase Dashboard → Storage 建立 bucket：`expense-receipts`
2. 設定為 Private（需要認證才能存取）
3. 檔案命名規則：`{user_id}/{timestamp}_{filename}.{ext}`
4. 設定 RLS 政策，允許已認證使用者上傳和讀取自己的檔案

詳細設定請參考 `setup_storage_bucket.sql` 檔案。

#### 4.4.4 同步日誌表

```sql
-- ============================================
-- 同步日誌表（Sync Logs）
-- 說明：記錄主檔同步的執行結果
-- 用途：監控同步狀態、除錯
-- ============================================
CREATE TABLE sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 同步資訊
  table_name VARCHAR(100),                         -- 'ns_subsidiary', 'ns_item'
  sync_type VARCHAR(50),                           -- 'full', 'incremental'
  
  -- 執行結果
  sync_status VARCHAR(50),                         -- 'success', 'failed', 'partial'
  records_processed INTEGER,                       -- 處理的筆數
  records_inserted INTEGER,                        -- 新增的筆數
  records_updated INTEGER,                         -- 更新的筆數
  records_failed INTEGER,                          -- 失敗的筆數
  
  -- 錯誤資訊
  error_message TEXT,
  error_details JSONB,                             -- 詳細錯誤（JSON 格式）
  
  -- 時間追蹤
  sync_started_at TIMESTAMPTZ,
  sync_completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,                        -- 執行時間（秒）
  
  -- 審計
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_table_time ON sync_logs(table_name, created_at DESC);
CREATE INDEX idx_sync_logs_status ON sync_logs(sync_status);

COMMENT ON TABLE sync_logs IS '同步日誌表：記錄主檔同步的執行結果';
```

#### 4.4.4 監控視圖

```sql
-- ============================================
-- 監控視圖：最後同步狀態
-- 說明：快速查看每個表的同步健康狀態
-- ============================================
CREATE OR REPLACE VIEW vw_sync_status AS
WITH latest_syncs AS (
  SELECT 
    table_name,
    sync_status,
    records_processed,
    sync_completed_at,
    duration_seconds,
    ROW_NUMBER() OVER (PARTITION BY table_name ORDER BY created_at DESC) as rn
  FROM sync_logs
)
SELECT 
  table_name,
  sync_status,
  records_processed,
  sync_completed_at,
  duration_seconds,
  CASE 
    WHEN sync_status = 'failed' THEN '❌ 失敗'
    WHEN sync_completed_at > NOW() - INTERVAL '25 hours' THEN '✅ 正常'
    WHEN sync_completed_at > NOW() - INTERVAL '48 hours' THEN '⚠️ 延遲'
    ELSE '❌ 異常'
  END as health_status,
  EXTRACT(EPOCH FROM (NOW() - sync_completed_at))/3600 as hours_since_sync
FROM latest_syncs
WHERE rn = 1
ORDER BY table_name;

COMMENT ON VIEW vw_sync_status IS '監控視圖：顯示每個表的最後同步狀態';

-- 使用方式：
-- SELECT * FROM vw_sync_status;
```

---

## 5. Phase 2: Helper Functions

### 5.1 Name-to-ID 查詢函數

```sql
-- ============================================
-- 函數：通用 Name 查詢 Internal ID
-- 用途：讓業務系統用名稱查詢 NetSuite ID
-- 範例：SELECT lookup_netsuite_id('ns_subsidiary', '台灣分公司');
-- ============================================
CREATE OR REPLACE FUNCTION lookup_netsuite_id(
  p_table_name VARCHAR,
  p_name VARCHAR
)
RETURNS INTEGER AS $$
DECLARE
  v_id INTEGER;
  v_query TEXT;
BEGIN
  -- 動態生成查詢語句
  v_query := format(
    'SELECT netsuite_internal_id FROM %I WHERE name = $1 AND (is_inactive = FALSE OR is_active = TRUE) LIMIT 1',
    p_table_name
  );
  
  -- 執行查詢
  EXECUTE v_query INTO v_id USING p_name;
  
  -- 返回結果
  RETURN v_id;
  
EXCEPTION
  WHEN OTHERS THEN
    -- 發生錯誤時返回 NULL
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 使用範例
-- SELECT lookup_netsuite_id('ns_subsidiary', '台灣分公司');
-- SELECT lookup_netsuite_id('ns_department', '研發一部');
-- SELECT lookup_netsuite_id('ns_item', '可口可樂 330ml');

COMMENT ON FUNCTION lookup_netsuite_id IS '通用函數：用名稱查詢 NetSuite Internal ID';
```

### 5.2 交易驗證函數

```sql
-- ============================================
-- 函數：驗證交易所需的組件是否都有效
-- 用途：在建立交易前先驗證，避免 API 失敗
-- ============================================
CREATE OR REPLACE FUNCTION validate_transaction_components(
  p_subsidiary_name VARCHAR,
  p_currency_symbol VARCHAR,
  p_customer_name VARCHAR DEFAULT NULL,
  p_department_name VARCHAR DEFAULT NULL,
  p_class_name VARCHAR DEFAULT NULL,
  p_location_name VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_errors TEXT[] := '{}';
  v_subsidiary_id INTEGER;
  v_currency_id INTEGER;
  v_customer_id INTEGER;
  v_department_id INTEGER;
  v_class_id INTEGER;
  v_location_id INTEGER;
  v_result JSON;
BEGIN
  -- 檢查 Subsidiary（必填）
  SELECT netsuite_internal_id INTO v_subsidiary_id 
  FROM ns_subsidiary 
  WHERE name = p_subsidiary_name AND is_active = TRUE;
  
  IF v_subsidiary_id IS NULL THEN
    v_errors := array_append(v_errors, 'Invalid subsidiary: ' || p_subsidiary_name);
  END IF;
  
  -- 檢查 Currency（必填）
  SELECT netsuite_internal_id INTO v_currency_id
  FROM ns_currencies
  WHERE symbol = p_currency_symbol AND is_active = TRUE;
  
  IF v_currency_id IS NULL THEN
    v_errors := array_append(v_errors, 'Invalid currency: ' || p_currency_symbol);
  END IF;
  
  -- 檢查 Customer（如果有提供）
  IF p_customer_name IS NOT NULL THEN
    SELECT netsuite_internal_id INTO v_customer_id
    FROM ns_customer
    WHERE name = p_customer_name AND is_inactive = FALSE;
    
    IF v_customer_id IS NULL THEN
      v_errors := array_append(v_errors, 'Invalid customer: ' || p_customer_name);
    END IF;
  END IF;
  
  -- 檢查 Department（如果有提供）
  IF p_department_name IS NOT NULL THEN
    SELECT netsuite_internal_id INTO v_department_id
    FROM ns_department
    WHERE name = p_department_name AND is_inactive = FALSE;
    
    IF v_department_id IS NULL THEN
      v_errors := array_append(v_errors, 'Invalid department: ' || p_department_name);
    END IF;
  END IF;
  
  -- 檢查 Class（如果有提供）
  IF p_class_name IS NOT NULL THEN
    SELECT netsuite_internal_id INTO v_class_id
    FROM ns_classification
    WHERE name = p_class_name AND is_inactive = FALSE;
    
    IF v_class_id IS NULL THEN
      v_errors := array_append(v_errors, 'Invalid class: ' || p_class_name);
    END IF;
  END IF;
  
  -- 檢查 Location（如果有提供）
  IF p_location_name IS NOT NULL THEN
    SELECT netsuite_internal_id INTO v_location_id
    FROM ns_location
    WHERE name = p_location_name AND is_inactive = FALSE;
    
    IF v_location_id IS NULL THEN
      v_errors := array_append(v_errors, 'Invalid location: ' || p_location_name);
    END IF;
  END IF;
  
  -- 組合結果
  SELECT json_build_object(
    'is_valid', array_length(v_errors, 1) IS NULL,
    'errors', v_errors,
    'components', json_build_object(
      'subsidiary_id', v_subsidiary_id,
      'currency_id', v_currency_id,
      'customer_id', v_customer_id,
      'department_id', v_department_id,
      'class_id', v_class_id,
      'location_id', v_location_id
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 使用範例
-- SELECT validate_transaction_components(
--   '台灣分公司',
--   'TWD',
--   '測試客戶',
--   '研發一部'
-- );

COMMENT ON FUNCTION validate_transaction_components IS '驗證交易組件是否都有效';
```

### 5.3 BOM 查詢函數

```sql
-- ============================================
-- 函數：查詢 BOM 組成（給 MES 用）
-- 用途：根據成品 ID 查詢需要哪些原料
-- ============================================
CREATE OR REPLACE FUNCTION get_bom_components(
  p_assembly_item_id INTEGER,
  p_quantity DECIMAL DEFAULT 1
)
RETURNS TABLE (
  component_item_id INTEGER,
  component_name VARCHAR,
  required_quantity DECIMAL,
  unit_of_measure VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bl.component_item_id,
    i.name as component_name,
    bl.quantity * p_quantity as required_quantity,
    bl.unit_of_measure
  FROM ns_bom bh
  JOIN ns_bom_line bl ON bl.netsuite_bom_id = bh.netsuite_internal_id
  JOIN ns_item i ON i.netsuite_internal_id = bl.component_item_id
  WHERE bh.assembly_item_id = p_assembly_item_id
    AND bh.is_active = TRUE
    AND (bh.effective_date IS NULL OR bh.effective_date <= CURRENT_DATE)
    AND (bh.obsolete_date IS NULL OR bh.obsolete_date > CURRENT_DATE)
  ORDER BY bl.line_number;
END;
$$ LANGUAGE plpgsql;

-- 使用範例
-- SELECT * FROM get_bom_components(201, 100);  -- 查詢生產 100 箱需要哪些原料

COMMENT ON FUNCTION get_bom_components IS '查詢 BOM 組成：根據成品和數量計算所需原料';
```

### 5.4 傳票驗證函數（Journal Entry）

```sql
-- ============================================
-- 函數：驗證傳票資料完整性
-- 用途：檢查借貸平衡、會計期間是否開放、科目是否有效
-- ============================================
CREATE OR REPLACE FUNCTION validate_journal_entry(
  p_subsidiary_name VARCHAR,
  p_currency_symbol VARCHAR,
  p_period_name VARCHAR,
  p_tran_date DATE,
  p_lines JSONB  -- [{ account_name, debit, credit, department_name?, class_name?, location_name?, entity_name? }]
)
RETURNS JSON AS $$
DECLARE
  v_errors TEXT[] := '{}';
  v_subsidiary_id INTEGER;
  v_currency_id INTEGER;
  v_period_id INTEGER;
  v_period_closed BOOLEAN;
  v_total_debit DECIMAL(15,2) := 0;
  v_total_credit DECIMAL(15,2) := 0;
  v_line_account_id INTEGER;
  v_line_department_id INTEGER;
  v_line_class_id INTEGER;
  v_line_location_id INTEGER;
  v_line_entity_id INTEGER;
  v_account_type VARCHAR;
  v_account_needs_entity BOOLEAN := FALSE;
  v_result JSON;
  v_line JSONB;
BEGIN
  -- 檢查 Subsidiary（必填）
  SELECT netsuite_internal_id INTO v_subsidiary_id 
  FROM ns_subsidiary 
  WHERE name = p_subsidiary_name AND is_active = TRUE;
  
  IF v_subsidiary_id IS NULL THEN
    v_errors := array_append(v_errors, 'Invalid subsidiary: ' || p_subsidiary_name);
  END IF;
  
  -- 檢查 Currency（必填）
  SELECT netsuite_internal_id INTO v_currency_id
  FROM ns_currencies
  WHERE symbol = p_currency_symbol AND is_active = TRUE;
  
  IF v_currency_id IS NULL THEN
    v_errors := array_append(v_errors, 'Invalid currency: ' || p_currency_symbol);
  END IF;
  
  -- 檢查會計期間（必填）
  SELECT netsuite_internal_id, is_closed INTO v_period_id, v_period_closed
  FROM ns_accountingperiod
  WHERE period_name = p_period_name;
  
  IF v_period_id IS NULL THEN
    v_errors := array_append(v_errors, 'Invalid accounting period: ' || p_period_name);
  ELSIF v_period_closed = TRUE THEN
    v_errors := array_append(v_errors, 'Accounting period is closed: ' || p_period_name);
  END IF;
  
  -- 檢查傳票日期是否在會計期間內
  IF v_period_id IS NOT NULL THEN
    DECLARE
      v_period_start DATE;
      v_period_end DATE;
    BEGIN
      SELECT start_date, end_date INTO v_period_start, v_period_end
      FROM ns_accountingperiod
      WHERE netsuite_internal_id = v_period_id;
      
      IF p_tran_date < v_period_start OR p_tran_date > v_period_end THEN
        v_errors := array_append(v_errors, 
          format('Transaction date %s is outside period %s (%s to %s)', 
            p_tran_date::TEXT, p_period_name, v_period_start::TEXT, v_period_end::TEXT));
      END IF;
    END;
  END IF;
  
  -- 驗證每筆明細
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    DECLARE
      v_account_name VARCHAR := v_line->>'account_name';
      v_debit DECIMAL(15,2) := COALESCE((v_line->>'debit')::DECIMAL, 0);
      v_credit DECIMAL(15,2) := COALESCE((v_line->>'credit')::DECIMAL, 0);
      v_department_name VARCHAR := v_line->>'department_name';
      v_class_name VARCHAR := v_line->>'class_name';
      v_location_name VARCHAR := v_line->>'location_name';
      v_entity_name VARCHAR := v_line->>'entity_name';
    BEGIN
      -- 檢查借貸金額
      IF v_debit < 0 OR v_credit < 0 THEN
        v_errors := array_append(v_errors, format('Line %s: 金額不能為負數', v_account_name));
      END IF;
      
      IF v_debit > 0 AND v_credit > 0 THEN
        v_errors := array_append(v_errors, format('Line %s: 不能同時有借方和貸方金額', v_account_name));
      END IF;
      
      IF v_debit = 0 AND v_credit = 0 THEN
        v_errors := array_append(v_errors, format('Line %s: 至少需要借方或貸方金額', v_account_name));
      END IF;
      
      -- 累計借貸總額
      v_total_debit := v_total_debit + v_debit;
      v_total_credit := v_total_credit + v_credit;
      
      -- 檢查會計科目
      SELECT netsuite_internal_id, acct_type INTO v_line_account_id, v_account_type
      FROM ns_account
      WHERE (acct_name = v_account_name OR full_name = v_account_name)
        AND is_inactive = FALSE
        AND (subsidiary_id IS NULL OR subsidiary_id = v_subsidiary_id);
      
      IF v_line_account_id IS NULL THEN
        v_errors := array_append(v_errors, format('Invalid account: %s', v_account_name));
      ELSE
        -- 某些科目類型需要 Entity（如應收帳款需要客戶、應付帳款需要供應商）
        IF v_account_type IN ('Accounts Receivable', 'Accounts Payable') THEN
          v_account_needs_entity := TRUE;
        END IF;
      END IF;
      
      -- 檢查 Department（如果有提供）
      IF v_department_name IS NOT NULL THEN
        SELECT netsuite_internal_id INTO v_line_department_id
        FROM ns_department
        WHERE name = v_department_name 
          AND is_inactive = FALSE
          AND (subsidiary_id IS NULL OR subsidiary_id = v_subsidiary_id);
        
        IF v_line_department_id IS NULL THEN
          v_errors := array_append(v_errors, format('Invalid department: %s', v_department_name));
        END IF;
      END IF;
      
      -- 檢查 Class（如果有提供）
      IF v_class_name IS NOT NULL THEN
        SELECT netsuite_internal_id INTO v_line_class_id
        FROM ns_classification
        WHERE name = v_class_name 
          AND is_inactive = FALSE
          AND (subsidiary_id IS NULL OR subsidiary_id = v_subsidiary_id);
        
        IF v_line_class_id IS NULL THEN
          v_errors := array_append(v_errors, format('Invalid class: %s', v_class_name));
        END IF;
      END IF;
      
      -- 檢查 Location（如果有提供）
      IF v_location_name IS NOT NULL THEN
        SELECT netsuite_internal_id INTO v_line_location_id
        FROM ns_location
        WHERE name = v_location_name 
          AND is_inactive = FALSE
          AND (subsidiary_id IS NULL OR subsidiary_id = v_subsidiary_id);
        
        IF v_line_location_id IS NULL THEN
          v_errors := array_append(v_errors, format('Invalid location: %s', v_location_name));
        END IF;
      END IF;
      
      -- 檢查 Entity（如果需要）
      IF v_account_needs_entity AND v_entity_name IS NOT NULL THEN
        -- 先查客戶
        SELECT netsuite_internal_id INTO v_line_entity_id
        FROM ns_customer
        WHERE name = v_entity_name AND is_inactive = FALSE;
        
        -- 如果沒找到，查供應商
        IF v_line_entity_id IS NULL THEN
          SELECT netsuite_internal_id INTO v_line_entity_id
          FROM ns_vendor
          WHERE name = v_entity_name AND is_inactive = FALSE;
        END IF;
        
        -- 如果還是沒找到，查員工
        IF v_line_entity_id IS NULL THEN
          SELECT netsuite_internal_id INTO v_line_entity_id
          FROM ns_employee
          WHERE name = v_entity_name AND is_inactive = FALSE;
        END IF;
        
        IF v_line_entity_id IS NULL THEN
          v_errors := array_append(v_errors, format('Invalid entity: %s', v_entity_name));
        END IF;
      ELSIF v_account_needs_entity AND v_entity_name IS NULL THEN
        v_errors := array_append(v_errors, format('Account %s requires an entity (customer/vendor/employee)', v_account_name));
      END IF;
    END;
  END LOOP;
  
  -- 檢查借貸平衡
  IF ABS(v_total_debit - v_total_credit) > 0.01 THEN
    v_errors := array_append(v_errors, 
      format('借貸不平衡：借方總額 %s ≠ 貸方總額 %s (差異: %s)', 
        v_total_debit, v_total_credit, ABS(v_total_debit - v_total_credit)));
  END IF;
  
  -- 檢查至少要有兩筆明細
  IF jsonb_array_length(p_lines) < 2 THEN
    v_errors := array_append(v_errors, '傳票至少需要兩筆明細（一借一貸）');
  END IF;
  
  -- 組合結果
  SELECT json_build_object(
    'is_valid', array_length(v_errors, 1) IS NULL,
    'errors', v_errors,
    'total_debit', v_total_debit,
    'total_credit', v_total_credit,
    'is_balanced', ABS(v_total_debit - v_total_credit) < 0.01,
    'components', json_build_object(
      'subsidiary_id', v_subsidiary_id,
      'currency_id', v_currency_id,
      'period_id', v_period_id
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 使用範例
-- SELECT validate_journal_entry(
--   '台灣分公司',
--   'TWD',
--   'Jan 2025',
--   '2025-01-15'::DATE,
--   '[
--     {"account_name": "現金", "debit": 1000, "credit": 0},
--     {"account_name": "銷貨收入", "debit": 0, "credit": 1000}
--   ]'::JSONB
-- );

COMMENT ON FUNCTION validate_journal_entry IS '驗證傳票資料：檢查借貸平衡、會計期間、科目有效性';
```

### 5.5 領料數量驗證函數

```sql
-- ============================================
-- 函數：驗證領料數量是否合理
-- 用途：避免超領或重複領料
-- ============================================
CREATE OR REPLACE FUNCTION validate_component_issue(
  p_work_order_id INTEGER,
  p_component_item_id INTEGER,
  p_quantity DECIMAL
)
RETURNS JSON AS $$
DECLARE
  v_required_qty DECIMAL;
  v_already_issued DECIMAL;
  v_remaining_qty DECIMAL;
  v_result JSON;
BEGIN
  -- 查這個工單需要多少這個原料（從 work_order_tracking 或直接算）
  -- 這裡簡化處理，實際應該從 NetSuite 或本地追蹤表查詢
  
  -- 假設已經建立了 component_issues 追蹤表
  -- SELECT COALESCE(SUM(quantity), 0) INTO v_already_issued
  -- FROM component_issues
  -- WHERE work_order_id = p_work_order_id
  --   AND component_item_id = p_component_item_id;
  
  v_already_issued := 0;  -- 簡化版
  
  -- 檢查是否超領
  IF p_quantity < 0 THEN
    v_result := json_build_object(
      'is_valid', FALSE,
      'error', '領料數量不能為負數'
    );
  ELSE
    v_result := json_build_object(
      'is_valid', TRUE
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_component_issue IS '驗證領料數量：防止超領或重複領料';
```

---

## 6. Phase 3: 交易單據實作

### 6.1 Sales Order（銷售訂單）- POS/EC 適用

#### API Payload 範本

```json
{
  "recordType": "salesOrder",
  "isDynamicMode": false,
  
  "_comment_header": "=== 單頭必填欄位 ===",
  "subsidiary": {
    "id": "1"
  },
  "currency": {
    "id": "1"
  },
  "entity": {
    "id": "100"
  },
  "tranDate": "2025-11-04",
  
  "_comment_optional": "=== 選填欄位 ===",
  "department": {
    "id": "5"
  },
  "class": {
    "id": "3"
  },
  "location": {
    "id": "10"
  },
  "terms": {
    "id": "2"
  },
  "shipMethod": {
    "id": "1"
  },
  "memo": "POS 銷售單",
  
  "_comment_lines": "=== 單身明細 ===",
  "item": {
    "items": [
      {
        "item": {
          "id": "200"
        },
        "quantity": 24,
        "rate": 25.00,
        "amount": 600.00,
        "taxCode": {
          "id": "1"
        },
        "taxRate1": 5.00,
        "location": {
          "id": "10"
        }
      }
    ]
  }
}
```

#### 中台 API 範例（Supabase Function）

```typescript
// Supabase Edge Function: create-sales-order
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // 解析請求
    const { 
      subsidiary_name,
      currency_symbol,
      customer_name,
      items,
      department_name,
      class_name,
      location_name
    } = await req.json()
    
    // 建立 Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )
    
    // 查詢 NetSuite IDs
    const { data: validation } = await supabase
      .rpc('validate_transaction_components', {
        p_subsidiary_name: subsidiary_name,
        p_currency_symbol: currency_symbol,
        p_customer_name: customer_name,
        p_department_name: department_name,
        p_class_name: class_name,
        p_location_name: location_name
      })
    
    // 驗證失敗
    if (!validation.is_valid) {
      return new Response(
        JSON.stringify({ error: validation.errors }),
        { status: 400 }
      )
    }
    
    // 組裝 NetSuite payload
    const netsuitePayload = {
      recordType: "salesOrder",
      subsidiary: { id: validation.components.subsidiary_id },
      currency: { id: validation.components.currency_id },
      entity: { id: validation.components.customer_id },
      tranDate: new Date().toISOString().split('T')[0],
      department: validation.components.department_id ? 
        { id: validation.components.department_id } : undefined,
      class: validation.components.class_id ?
        { id: validation.components.class_id } : undefined,
      location: validation.components.location_id ?
        { id: validation.components.location_id } : undefined,
      item: {
        items: items.map(item => ({
          item: { id: item.item_id },
          quantity: item.quantity,
          rate: item.rate,
          amount: item.quantity * item.rate
        }))
      }
    }
    
    // 呼叫 NetSuite API（這裡簡化，實際需要 OAuth 簽章）
    const netsuiteResponse = await fetch(
      `https://[ACCOUNT_ID].restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=xxx&deploy=1`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'OAuth ...'  // 實際需要 OAuth 1.0 簽章
        },
        body: JSON.stringify(netsuitePayload)
      }
    )
    
    const netsuiteResult = await netsuiteResponse.json()
    
    // 記錄到 transaction_references
    await supabase
      .from('transaction_references')
      .insert({
        source_system: 'POS',
        source_transaction_id: 'POS-' + Date.now(),
        netsuite_record_type: 'salesOrder',
        netsuite_internal_id: netsuiteResult.id,
        netsuite_tran_id: netsuiteResult.tranId,
        status: 'success',
        request_payload: netsuitePayload,
        response_payload: netsuiteResult
      })
    
    // 返回結果
    return new Response(
      JSON.stringify({
        success: true,
        netsuite_id: netsuiteResult.id,
        netsuite_tran_id: netsuiteResult.tranId
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

### 6.2 Purchase Order（採購單）

```json
{
  "recordType": "purchaseOrder",
  "subsidiary": { "id": "1" },
  "entity": { "id": "500" },
  "currency": { "id": "1" },
  "tranDate": "2025-11-04",
  "location": { "id": "10" },
  "terms": { "id": "2" },
  "memo": "採購原料一批",
  
  "item": {
    "items": [
      {
        "item": { "id": "200" },
        "quantity": 1000,
        "rate": 50.00,
        "amount": 50000.00,
        "location": { "id": "10" }
      }
    ]
  }
}
```

### 6.3 Transfer Order（調撥單）- WMS 適用

```json
{
  "recordType": "transferOrder",
  "subsidiary": { "id": "1" },
  "tranDate": "2025-11-04",
  "location": { "id": "10" },
  "transferLocation": { "id": "11" },
  "memo": "從台北倉調到台中倉",
  
  "item": {
    "items": [
      {
        "item": { "id": "200" },
        "quantity": 500
      }
    ]
  }
}
```

### 6.4 Expense Report（費用報銷）

```json
{
  "recordType": "expenseReport",
  "subsidiary": { "id": "1" },
  "entity": { "id": "300" },
  "currency": { "id": "1" },
  "tranDate": "2025-11-04",
  "department": { "id": "5" },
  "memo": "出差費用報銷",
  
  "expense": {
    "items": [
      {
        "category": { "id": "10" },
        "amount": 500.00,
        "taxCode": { "id": "1" },
        "memo": "計程車費"
      },
      {
        "category": { "id": "11" },
        "amount": 1200.00,
        "taxCode": { "id": "1" },
        "memo": "客戶聚餐"
      }
    ]
  }
}
```

### 6.5 Item Receipt（入庫單）- WMS 適用

```json
{
  "recordType": "itemReceipt",
  "createdFrom": { "id": "8888" },
  "subsidiary": { "id": "1" },
  "entity": { "id": "500" },
  "tranDate": "2025-11-04",
  "location": { "id": "10" },
  
  "item": {
    "items": [
      {
        "item": { "id": "200" },
        "quantity": 800,
        "location": { "id": "10" },
        "binNumbers": "A-01-01"
      }
    ]
  }
}
```

### 6.6 Journal Entry（手切傳票）⭐ 財務核心

#### 前置條件
1. ✅ 會計科目（Accounts）必須已同步
2. ✅ 會計期間（Accounting Periods）必須已同步且未關閉
3. ✅ 公司別（Subsidiaries）必須已同步
4. ✅ 幣別（Currencies）必須已同步
5. ⚠️ 部門/類別/地點（選填，但某些公司要求必填）
6. ⚠️ 客戶/供應商/員工（選填，但某些科目類型要求必填）

#### 從 NetSuite 需要拉取的資料

**必須同步的主檔**：
- ✅ `ns_account` - 會計科目（必填）
- ✅ `ns_accountingperiod` - 會計期間（必填）
- ✅ `ns_subsidiary` - 公司別（必填）
- ✅ `ns_currencies` - 幣別（必填）

**選填但建議同步的主檔**：
- ⚠️ `ns_department` - 部門（某些公司要求必填）
- ⚠️ `ns_classification` - 類別（某些公司要求必填）
- ⚠️ `ns_location` - 地點（某些公司要求必填）
- ⚠️ `ns_customer` - 客戶（應收帳款科目需要）
- ⚠️ `ns_vendor` - 供應商（應付帳款科目需要）
- ⚠️ `ns_employee` - 員工（員工相關科目需要）

#### API Payload 範本

```json
{
  "recordType": "journalEntry",
  "subsidiary": { "id": "1" },
  "currency": { "id": "1" },
  "postingPeriod": { "id": "123" },
  "tranDate": "2025-01-15",
  "memo": "手切傳票：調整分錄",
  "approved": true,
  
  "_comment_lines": "=== 傳票明細（必須借貸平衡） ===",
  "line": {
    "items": [
      {
        "_comment": "借方：現金增加",
        "account": { "id": "100" },
        "debit": 1000.00,
        "credit": 0,
        "department": { "id": "5" },
        "class": { "id": "3" },
        "location": { "id": "10" },
        "memo": "現金收入"
      },
      {
        "_comment": "貸方：銷貨收入增加",
        "account": { "id": "200" },
        "debit": 0,
        "credit": 1000.00,
        "department": { "id": "5" },
        "class": { "id": "3" },
        "location": { "id": "10" },
        "memo": "銷貨收入"
      }
    ]
  }
}
```

#### 特殊情況：需要 Entity 的科目

某些科目類型**必須**指定 Entity（客戶/供應商/員工）：

```json
{
  "recordType": "journalEntry",
  "subsidiary": { "id": "1" },
  "currency": { "id": "1" },
  "postingPeriod": { "id": "123" },
  "tranDate": "2025-01-15",
  
  "line": {
    "items": [
      {
        "_comment": "應收帳款科目需要指定客戶",
        "account": { "id": "300" },  // 應收帳款科目
        "debit": 5000.00,
        "credit": 0,
        "entity": { "id": "100" },  // 客戶 ID（必填）
        "memo": "應收帳款增加"
      },
      {
        "_comment": "貸方對應科目",
        "account": { "id": "400" },
        "debit": 0,
        "credit": 5000.00,
        "memo": "銷貨收入"
      }
    ]
  }
}
```

#### 中台 API 範例（Supabase Function）

```typescript
// Supabase Edge Function: create-journal-entry
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // 解析請求
    const { 
      subsidiary_name,
      currency_symbol,
      period_name,
      tran_date,
      memo,
      lines  // [{ account_name, debit, credit, department_name?, class_name?, location_name?, entity_name? }]
    } = await req.json()
    
    // 建立 Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )
    
    // 驗證傳票資料
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_journal_entry', {
        p_subsidiary_name: subsidiary_name,
        p_currency_symbol: currency_symbol,
        p_period_name: period_name,
        p_tran_date: tran_date,
        p_lines: lines
      })
    
    if (validationError || !validation.is_valid) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          details: validation.errors || validationError 
        }),
        { status: 400 }
      )
    }
    
    // 查詢會計期間 ID
    const { data: period } = await supabase
      .from('ns_accountingperiod')
      .select('netsuite_internal_id')
      .eq('period_name', period_name)
      .single()
    
    // 查詢所有明細的科目 ID
    const lineItems = await Promise.all(
      lines.map(async (line: any) => {
        // 查詢科目 ID
        const { data: account } = await supabase
          .from('ns_account')
          .select('netsuite_internal_id, acct_type')
          .or(`acct_name.eq.${line.account_name},full_name.eq.${line.account_name}`)
          .eq('is_inactive', false)
          .single()
        
        if (!account) {
          throw new Error(`Account not found: ${line.account_name}`)
        }
        
        // 查詢 Department（如果有）
        let departmentId = null
        if (line.department_name) {
          const { data: dept } = await supabase
            .rpc('lookup_netsuite_id', {
              p_table_name: 'ns_department',
              p_name: line.department_name
            })
          departmentId = dept
        }
        
        // 查詢 Class（如果有）
        let classId = null
        if (line.class_name) {
          const { data: cls } = await supabase
            .rpc('lookup_netsuite_id', {
              p_table_name: 'ns_classification',
              p_name: line.class_name
            })
          classId = cls
        }
        
        // 查詢 Location（如果有）
        let locationId = null
        if (line.location_name) {
          const { data: loc } = await supabase
            .rpc('lookup_netsuite_id', {
              p_table_name: 'ns_location',
              p_name: line.location_name
            })
          locationId = loc
        }
        
        // 查詢 Entity（如果需要）
        let entityId = null
        if (line.entity_name) {
          // 先查客戶
          const { data: customer } = await supabase
            .from('ns_customer')
            .select('netsuite_internal_id')
            .eq('name', line.entity_name)
            .eq('is_inactive', false)
            .single()
          
          if (customer) {
            entityId = customer.netsuite_internal_id
          } else {
            // 查供應商
            const { data: vendor } = await supabase
              .from('ns_vendor')
              .select('netsuite_internal_id')
              .eq('name', line.entity_name)
              .eq('is_inactive', false)
              .single()
            
            if (vendor) {
              entityId = vendor.netsuite_internal_id
            } else {
              // 查員工
              const { data: employee } = await supabase
                .from('ns_employee')
                .select('netsuite_internal_id')
                .eq('name', line.entity_name)
                .eq('is_inactive', false)
                .single()
              
              if (employee) {
                entityId = employee.netsuite_internal_id
              }
            }
          }
        }
        
        // 組裝 NetSuite Line Item
        const lineItem: any = {
          account: { id: account.netsuite_internal_id.toString() },
          debit: line.debit || 0,
          credit: line.credit || 0,
          memo: line.memo || ''
        }
        
        if (departmentId) {
          lineItem.department = { id: departmentId.toString() }
        }
        
        if (classId) {
          lineItem.class = { id: classId.toString() }
        }
        
        if (locationId) {
          lineItem.location = { id: locationId.toString() }
        }
        
        if (entityId) {
          lineItem.entity = { id: entityId.toString() }
        }
        
        return lineItem
      })
    )
    
    // 組裝 NetSuite payload
    const netsuitePayload = {
      recordType: "journalEntry",
      subsidiary: { id: validation.components.subsidiary_id.toString() },
      currency: { id: validation.components.currency_id.toString() },
      postingPeriod: { id: period.netsuite_internal_id.toString() },
      tranDate: tran_date,
      memo: memo || '手切傳票',
      approved: true,
      line: {
        items: lineItems
      }
    }
    
    // 呼叫 NetSuite API
    const netsuiteResponse = await fetch(
      `https://[ACCOUNT_ID].restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=xxx&deploy=1`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'OAuth ...'  // 實際需要 OAuth 1.0 簽章
        },
        body: JSON.stringify(netsuitePayload)
      }
    )
    
    const netsuiteResult = await netsuiteResponse.json()
    
    // 記錄到 transaction_references
    await supabase
      .from('transaction_references')
      .insert({
        source_system: 'MANUAL',
        source_transaction_id: 'JE-' + Date.now(),
        source_transaction_type: 'JournalEntry',
        netsuite_record_type: 'journalEntry',
        netsuite_internal_id: netsuiteResult.id,
        netsuite_tran_id: netsuiteResult.tranId,
        status: 'success',
        request_payload: netsuitePayload,
        response_payload: netsuiteResult
      })
    
    // 返回結果
    return new Response(
      JSON.stringify({
        success: true,
        netsuite_id: netsuiteResult.id,
        netsuite_tran_id: netsuiteResult.tranId,
        total_debit: validation.total_debit,
        total_credit: validation.total_credit
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

#### Next.js 前臺需要的 Mapping 資料

**1. API Route 範例** (`app/api/create-journal-entry/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    
    // 驗證傳票
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_journal_entry', {
        p_subsidiary_name: body.subsidiary_name,
        p_currency_symbol: body.currency_symbol,
        p_period_name: body.period_name,
        p_tran_date: body.tran_date,
        p_lines: body.lines
      })
    
    if (validationError || !validation.is_valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }
    
    // 呼叫 NetSuite API（這裡簡化，實際需要透過你的 NetSuite Client）
    // ... 實際實作 ...
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

**2. 前臺表單組件需要的資料結構**

```typescript
// types/journal-entry.ts
export interface JournalEntryLine {
  account_name: string        // 會計科目名稱
  debit: number               // 借方金額
  credit: number              // 貸方金額
  department_name?: string    // 部門（選填）
  class_name?: string         // 類別（選填）
  location_name?: string      // 地點（選填）
  entity_name?: string        // 客戶/供應商/員工（選填，某些科目必填）
  memo?: string               // 備註
}

export interface JournalEntryForm {
  subsidiary_name: string     // 公司別
  currency_symbol: string      // 幣別（如 'TWD'）
  period_name: string         // 會計期間（如 'Jan 2025'）
  tran_date: string           // 傳票日期 (YYYY-MM-DD)
  memo?: string              // 傳票備註
  lines: JournalEntryLine[]   // 傳票明細（至少兩筆）
}
```

**3. 前臺需要的查詢函數**

```typescript
// hooks/use-journal-entry.ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export function useAccountingPeriods() {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['accounting-periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ns_accountingperiod')
        .select('netsuite_internal_id, period_name, start_date, end_date, is_closed')
        .eq('is_closed', false)
        .order('start_date', { ascending: false })
      
      if (error) throw error
      return data
    }
  })
}

export function useAccounts(subsidiaryId?: number) {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['accounts', subsidiaryId],
    queryFn: async () => {
      let query = supabase
        .from('ns_account')
        .select('netsuite_internal_id, acct_number, acct_name, full_name, acct_type')
        .eq('is_inactive', false)
      
      if (subsidiaryId) {
        query = query.or(`subsidiary_id.is.null,subsidiary_id.eq.${subsidiaryId}`)
      }
      
      const { data, error } = await query.order('acct_number')
      
      if (error) throw error
      return data
    }
  })
}

export function useDepartments(subsidiaryId?: number) {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['departments', subsidiaryId],
    queryFn: async () => {
      let query = supabase
        .from('ns_department')
        .select('netsuite_internal_id, name')
        .eq('is_inactive', false)
      
      if (subsidiaryId) {
        query = query.or(`subsidiary_id.is.null,subsidiary_id.eq.${subsidiaryId}`)
      }
      
      const { data, error } = await query.order('name')
      
      if (error) throw error
      return data
    }
  })
}
```

**4. 前臺表單範例（React Component）**

```typescript
// components/journal-entry-form.tsx
'use client'

import { useState } from 'react'
import { useAccountingPeriods, useAccounts, useDepartments } from '@/hooks/use-journal-entry'
import { JournalEntryForm, JournalEntryLine } from '@/types/journal-entry'

export function JournalEntryForm() {
  const [form, setForm] = useState<JournalEntryForm>({
    subsidiary_name: '台灣分公司',
    currency_symbol: 'TWD',
    period_name: '',
    tran_date: new Date().toISOString().split('T')[0],
    memo: '',
    lines: [
      { account_name: '', debit: 0, credit: 0 },
      { account_name: '', debit: 0, credit: 0 }
    ]
  })
  
  const { data: periods } = useAccountingPeriods()
  const { data: accounts } = useAccounts()
  const { data: departments } = useDepartments()
  
  const handleAddLine = () => {
    setForm(prev => ({
      ...prev,
      lines: [...prev.lines, { account_name: '', debit: 0, credit: 0 }]
    }))
  }
  
  const handleLineChange = (index: number, field: keyof JournalEntryLine, value: any) => {
    setForm(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }))
  }
  
  const calculateTotals = () => {
    const totalDebit = form.lines.reduce((sum, line) => sum + (line.debit || 0), 0)
    const totalCredit = form.lines.reduce((sum, line) => sum + (line.credit || 0), 0)
    return { totalDebit, totalCredit, difference: Math.abs(totalDebit - totalCredit) }
  }
  
  const { totalDebit, totalCredit, difference } = calculateTotals()
  const isBalanced = difference < 0.01
  
  const handleSubmit = async () => {
    // 呼叫 API
    const response = await fetch('/api/create-journal-entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    
    const result = await response.json()
    
    if (result.success) {
      alert(`傳票建立成功！單號：${result.netsuite_tran_id}`)
    } else {
      alert(`錯誤：${result.error}`)
    }
  }
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">手切傳票</h2>
      
      {/* 基本資訊 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label>會計期間</label>
          <select 
            value={form.period_name}
            onChange={(e) => setForm(prev => ({ ...prev, period_name: e.target.value }))}
          >
            <option value="">請選擇</option>
            {periods?.map(p => (
              <option key={p.netsuite_internal_id} value={p.period_name}>
                {p.period_name} {p.is_closed ? '(已關閉)' : ''}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label>傳票日期</label>
          <input
            type="date"
            value={form.tran_date}
            onChange={(e) => setForm(prev => ({ ...prev, tran_date: e.target.value }))}
          />
        </div>
      </div>
      
      {/* 傳票明細 */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">傳票明細</h3>
        <table className="w-full border">
          <thead>
            <tr>
              <th>會計科目</th>
              <th>借方</th>
              <th>貸方</th>
              <th>部門</th>
              <th>備註</th>
            </tr>
          </thead>
          <tbody>
            {form.lines.map((line, index) => (
              <tr key={index}>
                <td>
                  <select
                    value={line.account_name}
                    onChange={(e) => handleLineChange(index, 'account_name', e.target.value)}
                  >
                    <option value="">請選擇</option>
                    {accounts?.map(acc => (
                      <option key={acc.netsuite_internal_id} value={acc.acct_name}>
                        {acc.full_name || `${acc.acct_number} - ${acc.acct_name}`}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={line.debit || ''}
                    onChange={(e) => handleLineChange(index, 'debit', parseFloat(e.target.value) || 0)}
                    onBlur={(e) => {
                      // 如果輸入了借方，清空貸方
                      if (parseFloat(e.target.value) > 0) {
                        handleLineChange(index, 'credit', 0)
                      }
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={line.credit || ''}
                    onChange={(e) => handleLineChange(index, 'credit', parseFloat(e.target.value) || 0)}
                    onBlur={(e) => {
                      // 如果輸入了貸方，清空借方
                      if (parseFloat(e.target.value) > 0) {
                        handleLineChange(index, 'debit', 0)
                      }
                    }}
                  />
                </td>
                <td>
                  <select
                    value={line.department_name || ''}
                    onChange={(e) => handleLineChange(index, 'department_name', e.target.value)}
                  >
                    <option value="">無</option>
                    {departments?.map(dept => (
                      <option key={dept.netsuite_internal_id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={line.memo || ''}
                    onChange={(e) => handleLineChange(index, 'memo', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={handleAddLine} className="mt-2">新增明細</button>
      </div>
      
      {/* 借貸平衡檢查 */}
      <div className="mb-4 p-4 bg-gray-100">
        <div className="flex justify-between">
          <span>借方總額：{totalDebit.toFixed(2)}</span>
          <span>貸方總額：{totalCredit.toFixed(2)}</span>
          <span className={isBalanced ? 'text-green-600' : 'text-red-600'}>
            差異：{difference.toFixed(2)}
            {isBalanced ? ' ✅ 平衡' : ' ❌ 不平衡'}
          </span>
        </div>
      </div>
      
      {/* 提交按鈕 */}
      <button
        onClick={handleSubmit}
        disabled={!isBalanced || form.period_name === ''}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
      >
        建立傳票
      </button>
    </div>
  )
}
```

---

## 手切傳票功能檢查清單

### Supabase 中臺需要：
- ✅ 確認 `validate_journal_entry()` 函數已建立
- ✅ 確認所有主檔表已同步（特別是 Accounts 和 Accounting Periods）
- ✅ 建立 API endpoint `/api/create-journal-entry`

### Next.js 前臺需要：
- ✅ 建立 Journal Entry 表單頁面
- ✅ 建立 `useAccountingPeriods` Hook
- ✅ 建立 `useAccounts` Hook
- ✅ 建立 `useDepartments/Classes/Locations` Hooks
- ✅ 實作借貸平衡檢查
- ✅ 實作會計期間驗證

### 測試項目：
- ✅ 測試借貸平衡驗證
- ✅ 測試會計期間關閉檢查
- ✅ 測試科目有效性驗證
- ✅ 測試需要 Entity 的科目（應收/應付帳款）
- ✅ 測試多筆明細傳票

---

## 7. Phase 4: 製造業專屬（MES/WMS）

### 7.1 Work Order（工單）

#### 前置條件
1. 成品必須是 Assembly Item（`is_assembly = TRUE`）
2. 必須有有效的 BOM

#### API Payload

```json
{
  "recordType": "workOrder",
  "subsidiary": { "id": "1" },
  "assemblyItem": { "id": "201" },
  "quantity": 100,
  "location": { "id": "10" },
  "startDate": "2025-11-05",
  "endDate": "2025-11-10",
  "status": "Released",
  "billOfMaterials": { "id": "1001" },
  "memo": "生產 100 箱可口可樂"
}
```

#### 中台查詢 BOM 範例

```typescript
// 查詢 BOM 組成
const { data: bomComponents } = await supabase
  .rpc('get_bom_components', {
    p_assembly_item_id: 201,
    p_quantity: 100
  })

// 結果：
// [
//   { component_item_id: 200, component_name: '單罐可樂', required_quantity: 2400 },
//   { component_item_id: 300, component_name: '紙箱', required_quantity: 100 },
//   { component_item_id: 301, component_name: '塑膠膜', required_quantity: 100 }
// ]
```

### 7.2 Component Issue（領料單）

#### API Payload

```json
{
  "recordType": "workOrderIssue",
  "workOrder": { "id": "88888" },
  "tranDate": "2025-11-05",
  "location": { "id": "10" },
  "memo": "包裝線 A 領料",
  
  "component": {
    "items": [
      {
        "item": { "id": "200" },
        "quantity": 2400,
        "location": { "id": "10" }
      },
      {
        "item": { "id": "300" },
        "quantity": 100
      },
      {
        "item": { "id": "301" },
        "quantity": 100
      }
    ]
  }
}
```

### 7.3 Work Order Completion（完工入庫）

```json
{
  "recordType": "workOrderCompletion",
  "workOrder": { "id": "88888" },
  "tranDate": "2025-11-10",
  "location": { "id": "10" },
  "completedQuantity": 98,
  "scrapQuantity": 2,
  "buildable": { "id": "201" },
  "memo": "包裝線 A 完工，良率 98%"
}
```

### 7.4 完整 MES 流程範例

```typescript
// ========================================
// MES 生產流程完整範例
// ========================================

async function createProductionOrder(
  assemblyItemName: string,
  quantity: number,
  locationName: string
) {
  // 1. 查詢成品 ID
  const { data: assemblyItem } = await supabase
    .from('ns_item')
    .select('netsuite_internal_id, is_assembly')
    .eq('name', assemblyItemName)
    .single()
  
  if (!assemblyItem.is_assembly) {
    throw new Error('此產品不是組合品，無法建立工單')
  }
  
  // 2. 查詢 BOM
  const { data: bomComponents } = await supabase
    .rpc('get_bom_components', {
      p_assembly_item_id: assemblyItem.netsuite_internal_id,
      p_quantity: quantity
    })
  
  // 3. 查詢地點 ID
  const locationId = await supabase
    .rpc('lookup_netsuite_id', {
      p_table_name: 'ns_location',
      p_name: locationName
    })
  
  // 4. 建立工單
  const woPayload = {
    recordType: "workOrder",
    subsidiary: { id: "1" },
    assemblyItem: { id: assemblyItem.netsuite_internal_id },
    quantity: quantity,
    location: { id: locationId },
    startDate: new Date().toISOString().split('T')[0],
    status: "Released"
  }
  
  const woResult = await callNetSuiteAPI(woPayload)
  
  // 5. 記錄到追蹤表
  await supabase
    .from('work_order_tracking')
    .insert({
      source_system: 'MES',
      source_wo_number: 'MES-WO-' + Date.now(),
      netsuite_wo_id: woResult.id,
      netsuite_wo_number: woResult.tranId,
      assembly_item_id: assemblyItem.netsuite_internal_id,
      quantity_ordered: quantity,
      status: 'Released',
      location_id: locationId
    })
  
  return {
    workOrderId: woResult.id,
    workOrderNumber: woResult.tranId,
    requiredComponents: bomComponents
  }
}
```

---

## 8. 實作時間表

### 8.1 完整時程規劃（5 天）

#### Day 1：基礎建設（6 小時）
```
09:00-10:00  建立 Supabase Project
10:00-12:00  執行所有 CREATE TABLE（基礎 15 張表）
13:00-14:00  執行 Helper Functions
14:00-15:00  建立測試資料
15:00-16:00  測試 lookup_netsuite_id() 和 validate_transaction_components()
```

#### Day 2：主檔同步機制建立（8 小時）
```
09:00-10:00  設計主檔同步架構
10:00-12:00  建立同步 API（Supabase Function 或自行實作）
13:00-15:00  實作前 3 個主檔同步（Subsidiaries, Currencies, Periods）
15:00-17:00  實作後 4 個主檔同步（Departments, Classes, Locations, Accounts）
```

#### Day 3：完整主檔同步（8 小時）
```
09:00-12:00  實作剩餘主檔同步（Terms → Employees）
13:00-15:00  執行第一次完整同步
15:00-17:00  驗證資料正確性，檢查 sync_logs
```

#### Day 4：交易測試（8 小時）
```
09:00-10:00  建立 transaction_references 表
10:00-12:00  測試第一張 Sales Order
13:00-15:00  測試 Purchase Order + Transfer Order
15:00-17:00  測試 Expense Report
```

#### Day 5：製造業測試與優化（8 小時）
```
09:00-11:00  建立製造業表結構（BOM Headers + Lines, Work Centers）
11:00-12:00  建立 Work Order Tracking
13:00-15:00  測試 Work Order、Component Issue、Completion
15:00-17:00  建立監控 Dashboard、錯誤處理優化
```

### 8.2 最小可行版本（MVP）時程（3 天）

如果時間緊迫，可以先做 MVP：

#### Day 1：核心表與基礎功能（6 小時）
```
✅ 建立 8 張核心表：
   - Subsidiaries, Currencies, Departments, Locations
   - Accounts, Items, Customers, Tax Codes
✅ 建立 lookup_netsuite_id() 函數
✅ 建立主檔同步機制（至少 3 個主檔）
```

#### Day 2：第一張交易（6 小時）
```
✅ 建立 transaction_references
✅ 建立 validate_transaction_components() 函數
✅ 測試第一張 Sales Order
```

#### Day 3：POS 整合（6 小時）
```
✅ 建立 Supabase Edge Function
✅ POS 系統串接測試
✅ 錯誤處理與監控
```

---

## 9. 實際欄位對照總結

> **重要**：本章節總結了實際 NetSuite SuiteQL 和 REST API 查詢結果與指南的差異，以及實際 Supabase 資料庫結構與指南的差異，請務必參考。

### 9.1 實際資料庫結構與指南的差異（2025-11-09 更新）

> **⚠️ 重要**：以下是在實際同步過程中發現的資料庫結構差異，實際建立的表結構與指南中的定義有所不同。重建資料庫時請參考此章節。

#### 9.1.1 表命名差異

**實際表名使用複數形式，但指南中使用單數形式**：

| 指南中的表名 | 實際 Supabase 表名 | 說明 |
|------------|------------------|------|
| `ns_currency` | `ns_currencies` | 幣別表 |
| `ns_department` | `ns_departments` | 部門表 |
| `ns_classification` | `ns_classes` | 類別表 |
| `ns_location` | `ns_locations` | 地點表 |
| `ns_account` | `ns_accounts` | 會計科目表 |
| `ns_term` | `ns_terms` | 付款條件表 |
| `ns_taxitem` | `ns_tax_codes` | 稅碼表 |
| `ns_expensecategory` | `ns_expense_categories` | 費用類別表 |
| `ns_item` | `ns_items` | 產品主檔表 |
| `ns_customer` | `ns_entities_customers` | 客戶表 |
| `ns_vendor` | `ns_entities_vendors` | 供應商表 |
| `ns_employee` | `ns_entities_employees` | 員工表 |
| `ns_shipitem` | `ns_ship_methods` | 運送方式表 |

**建議**：重建資料庫時，請使用實際的表名（複數形式），或統一使用單數形式。目前程式碼使用複數形式的表名。

#### 9.1.2 部門表（ns_departments）實際結構

**實際欄位與指南的差異**：

```sql
-- 實際建立的表結構
CREATE TABLE ns_departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  
  -- ⚠️ 修正：使用 subsidiary_id (INTEGER)，不是 subsidiary_ids (TEXT)
  subsidiary_id INTEGER,                              -- 所屬公司 ID（取第一個值）
  
  parent_id INTEGER,                                  -- 上層部門
  full_name VARCHAR(500),                            -- 完整階層名稱
  is_inactive BOOLEAN DEFAULT FALSE,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ❌ 指南中有但實際沒有：include_children
```

**同步邏輯**：
- NetSuite 的 `subsidiary` 欄位是字串列表（如 "1, 3, 4"）
- 同步時取第一個值轉換為 INTEGER 存入 `subsidiary_id`
- 如果有多個公司，只儲存第一個

#### 9.1.3 類別表（ns_classes）實際結構

**實際欄位與指南的差異**：

```sql
-- 實際建立的表結構
CREATE TABLE ns_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  
  -- ⚠️ 修正：使用 subsidiary_id (INTEGER)，不是 subsidiary_ids (TEXT)
  subsidiary_id INTEGER,                              -- 所屬公司 ID（取第一個值）
  
  parent_id INTEGER,                                  -- 上層類別
  full_name VARCHAR(500),                            -- 完整階層名稱
  is_inactive BOOLEAN DEFAULT FALSE,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**同步邏輯**：與部門表相同，`subsidiary` 字串列表取第一個值。

#### 9.1.4 地點表（ns_locations）實際結構

**實際欄位與指南的差異**：

```sql
-- 實際建立的表結構
CREATE TABLE ns_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  
  -- ⚠️ 修正：使用 subsidiary_id (INTEGER)，不是 subsidiary_ids (TEXT)
  subsidiary_id INTEGER,                              -- 所屬公司 ID（取第一個值）
  
  -- ✅ 實際有但指南中沒有
  address_text TEXT,                                  -- 地址文字
  use_bins BOOLEAN,                                   -- 是否使用儲位
  
  is_inactive BOOLEAN DEFAULT FALSE,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ❌ 指南中有但實際沒有：
-- parent_id, full_name, main_address_id, location_type,
-- make_inventory_available, make_inventory_available_store,
-- latitude, longitude, tran_prefix
```

**同步邏輯**：
- 只同步基本資訊（名稱、公司別、地址、儲位設定）
- 不包含階層結構和地理資訊

#### 9.1.5 會計科目表（ns_accounts）實際結構

**實際欄位與指南的差異**：

```sql
-- 實際建立的表結構
CREATE TABLE ns_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  
  -- ⚠️ 修正：使用 acct_number 和 acct_name，不是 account_search_display_name
  acct_number VARCHAR(255),                          -- 科目編號（可能為 NULL）
  acct_name VARCHAR(255) NOT NULL,                   -- 科目名稱（使用 displaynamewithhierarchy 或 accountsearchdisplayname）
  full_name VARCHAR(500),                            -- 完整階層名稱（使用 displaynamewithhierarchy）
  
  acct_type VARCHAR(100),                            -- 科目類型
  subsidiary_id INTEGER,                              -- 所屬公司 ID（取第一個值）
  is_inactive BOOLEAN DEFAULT FALSE,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ❌ 指南中有但實際沒有：parent_id, is_summary
-- ❌ 指南中使用但實際沒有：account_search_display_name, display_name_with_hierarchy, subsidiary_ids
```

**同步邏輯**：
- 使用 `displaynamewithhierarchy` 作為 `acct_name`（如果沒有則使用 `accountsearchdisplayname`）
- `full_name` 使用 `displaynamewithhierarchy`
- `subsidiary` 字串列表取第一個值轉換為 INTEGER

#### 9.1.6 付款條件表（ns_terms）實際結構

**實際欄位與指南的差異**：

```sql
-- 實際建立的表結構
CREATE TABLE ns_terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  days_until_net_due INTEGER,
  discount_percent DECIMAL(5,2),
  days_until_expiry INTEGER,
  is_inactive BOOLEAN DEFAULT FALSE,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ❌ 指南中有但實際沒有：
-- is_date_driven, due_next_month_if_within_days, day_of_month_net_due, updated_at
```

**同步邏輯**：
- 只同步基本付款條件資訊
- 不包含日期驅動相關欄位

#### 9.1.7 稅碼表（ns_tax_codes）實際結構

**實際欄位與指南的差異**：

```sql
-- 實際建立的表結構
CREATE TABLE ns_tax_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,                       -- 稅碼名稱（使用 itemid）
  rate DECIMAL(5,2),                                 -- 稅率
  description TEXT,                                  -- 描述
  country VARCHAR(100),                              -- 國家代碼（country，例如：TW, US, CN）
  is_inactive BOOLEAN DEFAULT FALSE,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ 已新增（2025-01-XX）：
-- country - 國家代碼，用於根據 Employee → Subsidiary → Country → Tax Code 的流程篩選稅碼

-- ❌ 指南中有但實際沒有：
-- full_name, parent_id, tax_account_id, sale_account_id, updated_at, subsidiary_id
```

**同步邏輯**：
- 同步基本稅碼資訊（名稱、稅率、描述）
- 同步國家代碼（country）：
  - ✅ 使用 `salestaxitem` 和 `taxtype` 兩張表 JOIN 查詢
  - ✅ 從 `taxtype.country` 欄位取得國家代碼（例如：`US`, `AU`, `TW`）
  - ⚠️ 如果 JOIN 沒有取得 country，則從稅碼名稱中提取作為 fallback
  - 支援的命名模式：`VAT_TW`, `WET-AU`, `PST_BC_0` 等
- 根據 NetSuite 邏輯：Employee → Subsidiary → Country → Tax Code
- 前端會根據選定的 subsidiary 的 country 來篩選對應的稅碼
- 不包含階層結構和會計科目

**SuiteQL 查詢**：
```sql
SELECT 
  st.id,
  st.itemid,
  st.fullname,
  st.rate,
  st.description,
  st.taxtype,
  st.isinactive,
  tt.id as taxtype_id,
  tt.name as taxtype_name,
  tt.country,
  tt.description as taxtype_description
FROM salestaxitem st
LEFT JOIN taxtype tt ON st.taxtype = tt.id
ORDER BY st.id
```

#### 9.1.8 費用類別表（ns_expense_categories）實際結構

**實際欄位與指南的差異**：

```sql
-- 實際建立的表結構
CREATE TABLE ns_expense_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  expense_account_id INTEGER,                        -- 對應的會計科目 ID
  is_inactive BOOLEAN DEFAULT FALSE,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ❌ 指南中有但實際沒有：
-- subsidiary_ids, default_rate, rate_required, updated_at
```

**同步邏輯**：
- 只同步基本費用類別資訊（名稱、對應會計科目）
- 不包含費率設定和公司別

#### 9.1.9 產品主檔表（ns_items）實際結構

**實際欄位與指南的差異**：

```sql
-- 實際建立的表結構
CREATE TABLE ns_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  item_id VARCHAR(255) NOT NULL,                    -- 料號
  name VARCHAR(255) NOT NULL,                       -- 顯示名稱
  display_name VARCHAR(255),                        -- 顯示名稱
  item_type VARCHAR(100),                           -- 產品類型（來自 SuiteQL itemtype）
  description TEXT,
  sales_description TEXT,
  purchase_description TEXT,
  base_price DECIMAL(15,2),                         -- 基本售價（從 REST API 取得）
  cost_estimate DECIMAL(15,2),                      -- 估計成本
  income_account_id INTEGER,                         -- 銷貨收入科目
  expense_account_id INTEGER,                        -- 銷貨成本科目
  asset_account_id INTEGER,                          -- 存貨科目
  tax_schedule_id INTEGER,                           -- 稅務排程 ID
  is_assembly BOOLEAN DEFAULT FALSE,                -- 是否為組合品
  build_time DECIMAL(10,2),                          -- 生產時間
  default_build_location_id INTEGER,                 -- 預設生產地點
  is_inactive BOOLEAN DEFAULT FALSE,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ❌ 指南中有但實際沒有：
-- full_name, costing_method, subsidiary_ids, parent_id,
-- default_class_id, default_department_id, default_location_id
```

**同步邏輯**：
- 使用混合方式：先用 SuiteQL 查詢所有 items（確保取得所有 95 筆），再用 REST API 查詢每個 item 的詳細資訊（含價格）
- `item_type` 優先使用 SuiteQL 的 `itemtype`，因為它更準確
- 不包含階層結構和預設 Segment

#### 9.1.10 同步實作的重要修正

**Subsidiary 欄位處理**：

雖然 NetSuite SuiteQL 中 `subsidiary` 是字串列表（如 "1, 3, 4"），但實際資料庫使用 `subsidiary_id` (INTEGER) 儲存第一個值：

```typescript
// 同步時的處理邏輯
let subsidiaryValue = null;
if (item.subsidiary) {
  const subsidiaryStr = String(item.subsidiary).trim();
  if (subsidiaryStr.includes(',')) {
    const firstId = subsidiaryStr.split(',')[0].trim();
    subsidiaryValue = firstId ? parseInt(firstId) : null;
  } else {
    subsidiaryValue = parseInt(subsidiaryStr);
  }
}
```

**Account 欄位名稱修正**：

實際資料庫使用 `acct_number` 和 `acct_name`，而不是指南中的 `account_search_display_name` 和 `display_name_with_hierarchy`：

```typescript
// 同步時的處理邏輯
acct_name: item.displaynamewithhierarchy || item.accountsearchdisplayname || null,
full_name: item.displaynamewithhierarchy || null,
```

**Item 同步方式修正**：

由於 REST API 的 record type 映射不完整，無法查詢到所有 items，改用混合方式：

1. 先用 SuiteQL 查詢所有 items（確保取得所有 95 筆）
2. 再用 REST API 查詢每個 item 的詳細資訊（含價格）
3. 批次處理（每批 10 個）並行查詢，避免 API 限制
4. 如果 REST API 查詢失敗，使用 SuiteQL 的資料作為備用

#### 9.1.11 客戶表（ns_entities_customers）實際結構

**實際欄位與指南的差異**：

```sql
-- 實際建立的表結構
CREATE TABLE ns_entities_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  entity_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(100),
  subsidiary_id INTEGER,                          -- 所屬公司 ID（可能為 null）
  currency_id INTEGER,
  terms_id INTEGER,
  is_inactive BOOLEAN DEFAULT FALSE,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ❌ 指南中有但實際沒有：
-- alt_name, is_person, first_name, last_name
```

**同步邏輯**：
- 使用 `companyname` 或 `fullname` 作為 `name`
- NetSuite SuiteQL 的 `customer` 表可能沒有 `subsidiary` 欄位，所以 `subsidiary_id` 可能為 null
- 不包含個人資訊欄位（`is_person`, `first_name`, `last_name`）

#### 9.1.12 供應商表（ns_entities_vendors）實際結構

**實際欄位與指南的差異**：

```sql
-- 實際建立的表結構
CREATE TABLE ns_entities_vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  entity_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(100),
  subsidiary_id INTEGER,                          -- 所屬公司 ID（可能為 null）
  currency_id INTEGER,
  terms_id INTEGER,
  is_inactive BOOLEAN DEFAULT FALSE,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ❌ 指南中有但實際沒有：
-- alt_name, is_person
```

**同步邏輯**：
- 使用 `companyname` 或 `fullname` 作為 `name`
- NetSuite SuiteQL 的 `vendor` 表可能沒有 `subsidiary` 欄位，所以 `subsidiary_id` 可能為 null
- 不包含個人資訊欄位（`is_person`）

#### 9.1.13 員工表（ns_entities_employees）實際結構

**實際欄位與指南的差異**：

```sql
-- 實際建立的表結構
CREATE TABLE ns_entities_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  entity_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,                     -- 由 firstname + lastname 組合
  email VARCHAR(255),
  department_id INTEGER,
  subsidiary_id INTEGER,
  is_inactive BOOLEAN DEFAULT FALSE,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ❌ 指南中有但實際沒有：
-- first_name, last_name, title, hire_date, employee_status, employee_type
```

**同步邏輯**：
- ⚠️ **重要**：NetSuite SuiteQL 的 `employee` 表**沒有 `fullname` 欄位**
- 需要自己組合：`name = firstname + ' ' + lastname`
- 如果沒有 firstname 和 lastname，則使用 `entityid` 作為備用
- 不包含職稱、雇用日期等詳細資訊

#### 9.1.14 運送方式表（ns_ship_methods）實際結構

**實際欄位與指南的差異**：

```sql
-- 實際建立的表結構
CREATE TABLE ns_ship_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,                     -- 使用 itemid
  is_inactive BOOLEAN DEFAULT FALSE,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ❌ 指南中有但實際沒有：
-- description, display_name, service_code, subsidiary_ids, updated_at
```

**同步邏輯**：
- 只同步基本資訊（名稱、是否停用）
- 使用 `itemid` 作為 `name`
- 不包含描述、顯示名稱、服務代碼等詳細資訊

### 9.2 主要差異與注意事項（原內容保留）

#### 1. Subsidiary 欄位格式差異

**⚠️ 關鍵發現**：
- `subsidiary` 在 Department、Class、Location、Account、Item、Expense Category、Ship Method 中是**字串列表**（如 "1, 3, 4"），不是單一 INTEGER
- 只有 Employee 的 `subsidiary` 是單一 INTEGER
- Customer 和 Vendor 的 `subsidiary` 欄位**不存在**

**實際處理方式（2025-11-09 更新）**：
- ⚠️ **實際資料庫使用 `subsidiary_id` (INTEGER)**，不是 `subsidiary_ids` (TEXT)
- 同步時從字串列表中取第一個值轉換為 INTEGER
- 如果有多個公司，只儲存第一個公司 ID
- 可以建立外鍵索引（因為是 INTEGER）

#### 2. Account 欄位名稱差異

**⚠️ 關鍵發現**：
- `acctnumber` 和 `acctname` 在 NetSuite SuiteQL 中**不存在**
- 實際欄位是：
  - `accountsearchdisplayname` - 帳戶搜尋顯示名稱
  - `displaynamewithhierarchy` - 階層顯示名稱（如 "Salaries & Wages : Bonus"）

**實際處理方式（2025-11-09 更新）**：
- ⚠️ **實際資料庫使用 `acct_number` 和 `acct_name`**，不是 `account_search_display_name` 和 `display_name_with_hierarchy`
- `acct_name` 使用 `displaynamewithhierarchy`（如果沒有則使用 `accountsearchdisplayname`）
- `full_name` 使用 `displaynamewithhierarchy`
- `acct_number` 可能為 NULL（NetSuite SuiteQL 中不存在此欄位）

#### 3. Customer/Vendor/Employee 的 Subsidiary 欄位

**⚠️ 關鍵發現**：
- Customer 和 Vendor 的 `subsidiary` 欄位在 NetSuite SuiteQL 中**可能不存在**（視 NetSuite 設定而定）
- Employee 的 `subsidiary` 是單一 INTEGER（與 Department/Class 不同）

**實際處理方式（2025-11-09 更新）**：
- ⚠️ **實際資料庫使用 `subsidiary_id` (INTEGER)**，可能為 null（如果 NetSuite SuiteQL 沒有 subsidiary 欄位）
- 如果 NetSuite SuiteQL 有 subsidiary 欄位，同步時取第一個值轉換為 INTEGER
- 如需關聯，可透過交易記錄或使用 REST API 查詢

#### 4. Tax Code 和 Ship Method 使用 itemid

**⚠️ 關鍵發現**：
- Tax Code 和 Ship Method 使用 `itemid` 而不是 `name`
- 但為了查詢方便，我們仍使用 `name` 欄位儲存 `itemid` 的值

**處理方式**：
- SuiteQL 查詢時使用 `itemid` 欄位
- 儲存時將 `itemid` 的值存入 `name` 欄位

#### 5. Expense Category 使用 expenseacct

**⚠️ 關鍵發現**：
- Expense Category 使用 `expenseacct` 而不是 `account`

**處理方式**：
- SuiteQL 查詢時使用 `expenseacct` 欄位
- 儲存時對應到 `expense_account_id` 欄位

#### 6. SuiteQL 不支援的表

**必須使用 REST API 的表**：
- ✅ `accountingperiod` - 會計期間
  - REST API 欄位名：`closed`（不是 `isClosed`）
  - `isAdjustment` 不存在
  - `id` 是字串，需轉換為 INTEGER
- ✅ `bom` - BOM 配方（製造模組啟用後可用）
  - `assembly` 是物件，需取得 `assembly.id`
  - `subsidiary` 是物件，需取得 `subsidiary.id`
  - BOM Components 需要從其他端點取得

**REST API 不可用的表**：
- ❌ `workcenter` - 工作中心
  - Work Center 是透過 Employee Group 實現的
  - 可以透過 Manufacturing Routing 的 Routing Steps 取得 Work Center 資訊
- ✅ `manufacturingrouting` - 製程路由（權限開啟後可用）
  - 可以透過 REST API 查詢
  - 可以透過子資源 `/routingstep` 查詢 Routing Steps
  - 可以從 Routing Steps 中取得 Work Center 資訊

### 9.2 欄位類型轉換注意事項

#### Boolean 欄位轉換
- NetSuite SuiteQL 使用字串 `'T'` 或 `'F'` 表示 boolean
- 轉換規則：
  - `isinactive = 'F'` → `is_active = TRUE`
  - `isinactive = 'T'` → `is_active = FALSE`
  - `isbasecurrency = 'T'` → `is_base_currency = TRUE`

#### ID 欄位格式
- SuiteQL 返回的 `id` 是 INTEGER
- REST API 返回的 `id` 是字串，需要 `parseInt(item.id)`

#### 物件欄位處理
- REST API 中某些欄位是物件（如 `assembly`, `subsidiary`, `fiscalCalendar`）
- 需要從物件中取得 `id` 或透過 `links` 取得

### 9.3 欄位類型轉換注意事項

1. **優先使用 SuiteQL**：對於支援 SuiteQL 的表，優先使用 SuiteQL 查詢（效能較好）
2. **REST API 備用**：對於不支援 SuiteQL 的表，使用 REST API
3. **字串列表解析**：對於 `subsidiary` 字串列表，需要實作解析邏輯
4. **物件欄位處理**：對於 REST API 的物件欄位，需要實作提取邏輯
5. **錯誤處理**：所有 API 呼叫都要有錯誤處理和重試機制

### 9.4 同步實作建議

> **適用場景**：當系統成長需要新增或移除同步表時（例如：新增 BOM 表、移除舊表）

#### 9.4.1 新增同步表

當需要新增一張新的同步表到「資料同步狀態」頁面時，需要修改以下檔案：

**1. 前端頁面：`app/dashboard/ocr-expense/sync-status/page.tsx`**

在 `TABLE_CONFIG` 陣列中新增表配置：

```typescript
const TABLE_CONFIG = [
  // ... 現有的表 ...
  { name: 'ns_ship_methods', label: '運送方式', api: '/api/sync-ship-methods', priority: '🟢 低' },
  // 新增 BOM 表頭範例
  { 
    name: 'ns_bom_headers',           // Supabase 表名（必須與實際表名一致）
    label: 'BOM 表頭',                 // 顯示名稱
    api: '/api/sync-bom-headers',      // 同步 API 路由（必須已實作）
    priority: '🔴 最高'                 // 優先級：🔴 最高 / 🔴 高 / 🟡 中 / 🟢 低
  },
];
```

**配置說明**：
- `name`：必須與 Supabase 實際表名完全一致（例如：`ns_bom_headers`）
- `label`：在頁面上顯示的中文名稱
- `api`：同步 API 的路徑，必須已經實作並可正常運作
- `priority`：建議根據業務重要性設定
- `disabled`（可選）：如果表暫時不支援同步，可設為 `true`
- `disabledReason`（可選）：停用原因說明

**2. API 路由：`app/api/sync-status/route.ts`**

在 `tables` 陣列中新增表資訊：

```typescript
const tables = [
  // ... 現有的表 ...
  { name: 'ns_ship_methods', label: '運送方式' },
  // 新增 BOM 表頭
  { name: 'ns_bom_headers', label: 'BOM 表頭' },
];
```

這個 API 用於查詢表的同步狀態（記錄數、最後同步時間等），表名必須與 Supabase 實際表名一致。

**3. 確認事項（必須完成）**

在新增同步表之前，請確認：

- ✅ **Supabase 表已建立**：確認表結構已建立並符合命名規範（`ns_` 前綴 + NetSuite record name）
- ✅ **同步 API 已實作**：確認 `/api/sync-xxx` 路由已實作並可正常運作
- ✅ **表映射配置**（可選）：如果使用 `table_mapping_config` 表，需要在資料庫中新增記錄

**4. 表映射配置（可選，如果使用動態配置）**

如果系統使用 `table_mapping_config` 表來動態管理表映射，需要在資料庫中新增記錄：

```sql
-- 範例：新增 BOM 表頭配置
INSERT INTO table_mapping_config (
  mapping_key,           -- 映射鍵（例如：bomHeaders）
  netsuite_table,        -- NetSuite SuiteQL 表名（例如：bom）
  supabase_table_name,   -- Supabase 表名（例如：ns_bom_headers）
  label,                 -- 中文標籤（例如：BOM 表頭）
  priority,              -- 優先級（例如：🔴 最高）
  api_route,             -- API 路由（例如：/api/sync-bom-headers）
  conflict_column,       -- 衝突處理欄位（例如：netsuite_internal_id）
  sync_order,            -- 同步順序（數字，越小越優先）
  is_enabled             -- 是否啟用（TRUE/FALSE）
) VALUES (
  'bomHeaders',
  'bom',
  'ns_bom_headers',
  'BOM 表頭',
  '🔴 最高',
  '/api/sync-bom-headers',
  'netsuite_internal_id',
  14,
  TRUE
);
```

#### 9.4.2 移除同步表

當需要移除舊的同步表時，只需從上述兩個檔案中刪除對應的配置項目：

1. **前端頁面**：從 `TABLE_CONFIG` 陣列中移除該表的配置
2. **API 路由**：從 `tables` 陣列中移除該表的資訊
3. **資料庫配置**（如果使用）：從 `table_mapping_config` 表中刪除或停用該記錄

**注意**：移除同步表配置**不會**刪除 Supabase 中的實際表，只是不再在同步狀態頁面顯示。如果需要刪除 Supabase 表，需要手動執行 DROP TABLE。

#### 9.4.3 修改同步表配置

如果需要修改表的顯示名稱、優先級或 API 路由：

1. **修改前端配置**：更新 `TABLE_CONFIG` 中對應項目的屬性
2. **修改 API 配置**：更新 `tables` 陣列中對應項目的 `label`
3. **修改資料庫配置**（如果使用）：更新 `table_mapping_config` 表中對應記錄

#### 9.4.4 特殊情況處理

**使用 REST API 的表**：

如果表使用 REST API 而非 SuiteQL（例如：BOM、Accounting Period），可能需要特殊處理：

```typescript
{
  name: 'ns_bom_headers',
  label: 'BOM 表頭',
  api: '/api/sync-bom-headers',
  priority: '🔴 最高',
  // 可選：如果暫時不支援，可以標記為停用
  // disabled: true,
  // disabledReason: 'REST API 權限未開啟'
}
```

**依賴關係**：

某些表可能依賴其他表（例如：BOM Lines 依賴 BOM Headers），建議：
- 在 `priority` 中反映依賴關係
- 在同步順序中確保依賴表先同步
- 在 `table_mapping_config` 的 `depends_on` 欄位中記錄依賴關係

#### 9.4.5 檢查清單

新增同步表後的檢查項目：

- [ ] 前端頁面已更新 `TABLE_CONFIG`
- [ ] API 路由已更新 `tables` 陣列
- [ ] Supabase 表已建立並符合命名規範
- [ ] 同步 API 已實作並測試通過
- [ ] 表映射配置已更新（如果使用）
- [ ] 同步狀態頁面可正常顯示新表
- [ ] 點擊「同步」按鈕可正常執行同步
- [ ] 同步後可正常顯示記錄數和同步時間

---

## 10. 常見問題與陷阱

### 10.1 資料類型陷阱

#### ❌ 錯誤：使用 STRING 存 NetSuite ID
```sql
-- 錯誤
CREATE TABLE ns_subsidiary (
  netsuite_internal_id VARCHAR(50)  -- ❌ NetSuite ID 是 INTEGER
);
```

#### ✅ 正確
```sql
CREATE TABLE ns_subsidiary (
  netsuite_internal_id INTEGER  -- ✅ 正確
);
```

### 10.2 SuiteQL 欄位名稱陷阱

#### ❌ 錯誤：使用駝峰命名
```sql
-- 錯誤
SELECT internalId, companyName FROM subsidiary  -- ❌ SuiteQL 用小寫
```

#### ✅ 正確
```sql
-- 正確
SELECT id, name FROM subsidiary  -- ✅ SuiteQL 欄位是小寫
```

### 10.3 isInactive 判斷陷阱

#### ❌ 錯誤：當成 Boolean
```sql
-- 錯誤
WHERE isInactive = FALSE  -- ❌ SuiteQL 中是字串
```

#### ✅ 正確
```sql
-- 正確
WHERE isInactive = 'F'  -- ✅ 使用字串 'F' 或 'T'
```

### 10.4 Items 表數量陷阱

**問題**：Items 表可能有數萬筆，全量同步會 timeout

**解決方案**：使用增量同步

```sql
-- 只抓最近 7 天修改的
SELECT * FROM item 
WHERE lastmodifieddate >= SYSDATE - 7
AND isinactive = 'F'
```

### 10.5 匯率陷阱

**問題**：不同 Subsidiary 可能有不同匯率

**解決方案**：建立 Exchange Rates 表

```sql
CREATE TABLE <accountid>_exchange_rates (
  id UUID PRIMARY KEY,
  from_currency_id INTEGER,
  to_currency_id INTEGER,
  effective_date DATE,
  rate DECIMAL(15,6),
  source VARCHAR(50)
);
```

### 10.6 BOM 版本控制陷阱

**問題**：BOM 可能有多個版本同時存在

**解決方案**：使用有效日期過濾

```sql
SELECT * FROM ns_bom 
WHERE assembly_item_id = 201 
  AND is_active = TRUE
  AND (effective_date IS NULL OR effective_date <= CURRENT_DATE)
  AND (obsolete_date IS NULL OR obsolete_date > CURRENT_DATE)
ORDER BY effective_date DESC
LIMIT 1;
```

### 10.7 必填欄位動態判斷

**問題**：不同 Subsidiary 的必填欄位不同

**解決方案**：建立規則表

```sql
CREATE TABLE netsuite_field_requirements (
  id UUID PRIMARY KEY,
  subsidiary_id INTEGER,
  transaction_type VARCHAR(100),
  field_name VARCHAR(100),
  is_required BOOLEAN
);

-- 範例：台灣子公司的銷售訂單必須填 Department
INSERT INTO netsuite_field_requirements 
VALUES (gen_random_uuid(), 1, 'SalesOrder', 'department', TRUE);
```

---

## 11. 附錄

### 11.1 完整 SQL 腳本（一鍵執行）

```sql
-- ============================================
-- NetSuite 中台完整建置腳本
-- 執行時間：約 30 秒
-- 執行方式：複製全部內容到 Supabase SQL Editor
-- ============================================

-- 第一批：基礎主檔
\i create_table_subsidiaries.sql
\i create_table_currencies.sql
\i create_table_departments.sql
\i create_table_classes.sql
\i create_table_locations.sql
\i create_table_accounts.sql
\i create_table_items.sql
\i create_table_customers.sql
\i create_table_vendors.sql
\i create_table_employees.sql
\i create_table_tax_codes.sql
\i create_table_expense_categories.sql
\i create_table_terms.sql
\i create_table_periods.sql
\i create_table_ship_methods.sql

-- 第二批：製造業主檔
\i create_table_bom_headers.sql
\i create_table_bom_lines.sql
\i create_table_work_centers.sql
\i create_table_routings.sql

-- 第三批：系統表
\i create_table_transaction_references.sql
\i create_table_work_order_tracking.sql
\i create_table_sync_logs.sql

-- 第四批：Helper Functions
\i create_function_lookup_id.sql
\i create_function_validate_components.sql
\i create_function_get_bom_components.sql

-- 第五批：Views
\i create_view_sync_status.sql

-- 完成！
SELECT 'NetSuite 中台建置完成！' as message;
```

### 11.2 測試資料腳本

```sql
-- ============================================
-- 測試資料（用於開發測試）
-- ============================================

-- 1. Subsidiaries
INSERT INTO ns_subsidiary (netsuite_internal_id, name, legal_name, country, is_active)
VALUES 
  (1, '台灣分公司', '台灣某某股份有限公司', 'Taiwan', TRUE),
  (2, '香港分公司', 'HK Branch Ltd.', 'Hong Kong', TRUE);

-- 2. Currencies
INSERT INTO ns_currencies (netsuite_internal_id, name, symbol, exchange_rate, is_base_currency, is_active)
VALUES 
  (1, 'Taiwan Dollar', 'TWD', 1.000000, TRUE, TRUE),
  (2, 'US Dollar', 'USD', 30.500000, FALSE, TRUE),
  (3, 'Hong Kong Dollar', 'HKD', 3.900000, FALSE, TRUE);

-- 3. Departments
INSERT INTO ns_department (netsuite_internal_id, name, subsidiary_id, is_inactive)
VALUES 
  (1, '研發一部', 1, FALSE),
  (2, '業務部', 1, FALSE),
  (3, '財務部', 1, FALSE);

-- 4. Locations
INSERT INTO ns_location (netsuite_internal_id, name, subsidiary_id, is_inactive)
VALUES 
  (10, '台北倉', 1, FALSE),
  (11, '台中倉', 1, FALSE),
  (12, '高雄倉', 1, FALSE);

-- 5. Accounts
INSERT INTO ns_account (netsuite_internal_id, acct_number, acct_name, full_name, acct_type, is_inactive)
VALUES 
  (100, '4110', '銷貨收入', '4110 - 銷貨收入', 'Income', FALSE),
  (101, '5110', '銷貨成本', '5110 - 銷貨成本', 'Expense', FALSE),
  (102, '6225', '交通費', '6225 - 交通費', 'Expense', FALSE);

-- 6. Items
INSERT INTO ns_item (netsuite_internal_id, item_id, name, item_type, base_price, is_inactive)
VALUES 
  (200, 'ITEM-001', '可口可樂 330ml', 'Inventory', 25.00, FALSE),
  (201, 'ITEM-002', '可口可樂 24 罐箱裝', 'Assembly', 600.00, FALSE);

-- 7. Customers
INSERT INTO ns_customer (netsuite_internal_id, entity_id, name, subsidiary_id, currency_id, is_inactive)
VALUES 
  (100, 'C-00001', '測試客戶', 1, 1, FALSE);

-- 8. Tax Codes
INSERT INTO ns_taxitem (netsuite_internal_id, name, rate)
VALUES 
  (1, '應稅 5%', 5.00),
  (2, '零稅率', 0.00),
  (3, '免稅', 0.00);

-- 9. BOM Header
INSERT INTO ns_bom (netsuite_internal_id, assembly_item_id, name, revision, is_active)
VALUES 
  (1001, 201, 'BOM - 可口可樂 24 罐箱裝', 'Rev 1.0', TRUE);

-- 10. BOM Lines
INSERT INTO ns_bom_line (bom_header_id, netsuite_bom_id, line_number, component_item_id, quantity)
VALUES 
  ((SELECT id FROM ns_bom WHERE netsuite_internal_id = 1001), 1001, 1, 200, 24.0000);

-- 測試查詢
SELECT 'Test Data Inserted!' as message;
SELECT * FROM vw_sync_status;
```

### 11.3 檢查清單

建置完成後請執行這些檢查：

```sql
-- ============================================
-- 建置完成檢查清單
-- ============================================

-- 檢查 1：確認所有表都已建立
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '<accountid>_%'
ORDER BY table_name;
-- 預期：至少 15 張表

-- 檢查 2：確認所有表都有資料
SELECT 
  'ns_subsidiary' as table_name, COUNT(*) as row_count FROM ns_subsidiary
UNION ALL
SELECT 'ns_currencies', COUNT(*) FROM ns_currencies
UNION ALL
SELECT 'ns_department', COUNT(*) FROM ns_department
UNION ALL
SELECT 'ns_item', COUNT(*) FROM ns_item;
-- 預期：每張表都 > 0

-- 檢查 3：測試 lookup 函數
SELECT lookup_netsuite_id('ns_subsidiary', '台灣分公司');
-- 預期：返回 1

-- 檢查 4：測試驗證函數
SELECT validate_transaction_components(
  '台灣分公司',
  'TWD',
  '測試客戶'
);
-- 預期：is_valid = true

-- 檢查 5：查看同步狀態
SELECT * FROM vw_sync_status;
-- 預期：所有表都是 ✅ 正常 或 ⚠️ 延遲

-- 檢查 6：測試 BOM 查詢
SELECT * FROM get_bom_components(201, 1);
-- 預期：返回單罐可樂 x 24

-- 全部通過！
SELECT '✅ 所有檢查通過，系統可以開始使用！' as status;
```

### 11.4 快速參考

#### NetSuite Record Types
```
salesOrder          - 銷售訂單
purchaseOrder       - 採購單
transferOrder       - 調撥單
itemFulfillment     - 出貨單
itemReceipt         - 入庫單
invoice             - 發票
vendorBill          - 廠商帳單
expenseReport       - 費用報銷
workOrder           - 工單
workOrderIssue      - 領料單
workOrderCompletion - 完工入庫
journalEntry        - 日記帳
```

#### 常用查詢
```sql
-- 查 ID
SELECT lookup_netsuite_id('ns_item', '可口可樂 330ml');

-- 驗證交易
SELECT validate_transaction_components('台灣分公司', 'TWD', '客戶名稱');

-- 驗證傳票
SELECT validate_journal_entry(
  '台灣分公司',
  'TWD',
  'Jan 2025',
  '2025-01-15'::DATE,
  '[
    {"account_name": "現金", "debit": 1000, "credit": 0},
    {"account_name": "銷貨收入", "debit": 0, "credit": 1000}
  ]'::JSONB
);

-- 查 BOM
SELECT * FROM get_bom_components(201, 100);

-- 查同步狀態
SELECT * FROM vw_sync_status;

-- 查交易記錄
SELECT * FROM transaction_references 
WHERE source_system = 'POS' 
ORDER BY created_at DESC LIMIT 10;
```

---

## 12. 報支審核流程完整實作

> **本章節記錄報支審核系統的完整研發過程，重點說明「資料雙向寫回機制」的實作細節。**  
> **最後更新**: 2025-11-09

### 12.1 系統架構與資料流

報支審核系統採用「中介表 + 審核層」的設計模式，確保資料在寫入 NetSuite 前經過財務人員的審核。

#### 12.1.1 整體架構

```
┌─────────────────────────────────────────────────────────────┐
│                    報支審核系統架構                            │
└─────────────────────────────────────────────────────────────┘

使用者填寫報支表單
    ↓
[建立報支項目 API]
    ↓
expense_reviews 表（狀態：pending）
    ↓
財務人員審核頁面
    ├─ 查看待審核報支
    ├─ 編輯報支資料（可選）
    └─ 審核決策（通過/拒絕/取消）
    ↓
[審核通過]
    ↓
[自動同步到 NetSuite API]
    ↓
NetSuite Expense Report（建立成功）
    ↓
[寫回 expense_reviews 表]
    ├─ netsuite_internal_id
    ├─ netsuite_tran_id
    ├─ netsuite_url
    └─ netsuite_sync_status = 'success'
```

#### 12.1.2 資料流圖

**階段 1：提交報支**
```
使用者 → 前端表單 → /api/create-expense-report → expense_reviews 表
                                                      ↓
                                                 狀態：pending
                                                 附件：Supabase Storage
```

**階段 2：財務審核**
```
財務人員 → 報支審核頁面 → 查看/編輯 → 審核決策
                                              ↓
                                    [更新 expense_reviews]
                                    review_status = 'approved'
```

**階段 3：NetSuite 同步（關鍵：資料雙向寫回）**
```
expense_reviews 表（已審核通過）
    ↓
[查詢主檔 NetSuite ID]
    ├─ ns_subsidiaries → subsidiary.netsuite_internal_id
    ├─ ns_entities_employees → employee.netsuite_internal_id
    ├─ ns_currencies → currency.netsuite_internal_id
    └─ ns_expense_categories → category.netsuite_internal_id
    ↓
[組裝 NetSuite Payload]
    ↓
[呼叫 NetSuite REST API]
    POST /record/v1/expenseReport
    ↓
NetSuite 建立 Expense Report
    ↓
[NetSuite 返回]
    ├─ id (Internal ID)
    ├─ tranId (交易編號)
    └─ Location header (包含 ID)
    ↓
[寫回 expense_reviews 表] ⭐ 關鍵：資料雙向寫回
    ├─ netsuite_internal_id ← NetSuite 返回的 id
    ├─ netsuite_tran_id ← NetSuite 返回的 tranId
    ├─ netsuite_url ← 生成的 NetSuite UI 連結
    ├─ netsuite_sync_status = 'success'
    ├─ netsuite_synced_at ← 同步時間
    ├─ netsuite_request_payload ← 發送的 JSON（除錯用）
    └─ netsuite_response_payload ← NetSuite 返回的 JSON（除錯用）
    ↓
[同時寫入 transaction_references 表]
    記錄交易對應關係，用於追蹤
```

### 12.2 資料雙向寫回機制 ⭐ 核心設計

**⚠️ 重要**：這是報支審核系統的核心設計，確保 Supabase 和 NetSuite 之間的資料一致性。

#### 12.2.1 寫回流程詳解

**方向 1：Supabase → NetSuite（寫出）**

```typescript
// 1. 從 expense_reviews 表讀取資料
const review = await supabase
  .from('expense_reviews')
  .select('*')
  .eq('id', review_id)
  .single();

// 2. 查詢主檔的 NetSuite Internal ID（並行查詢以提升效能）
const [subsidiary, employee, currency, category] = await Promise.all([
  supabase.from('ns_subsidiaries').select('netsuite_internal_id').eq('id', review.subsidiary_id),
  supabase.from('ns_entities_employees').select('netsuite_internal_id').eq('id', review.employee_id),
  supabase.from('ns_currencies').select('netsuite_internal_id').eq('id', review.currency_id),
  supabase.from('ns_expense_categories').select('netsuite_internal_id').eq('id', review.expense_category_id),
]);

// 3. 組裝 NetSuite Payload
const expenseReportPayload = {
  recordType: 'expenseReport',
  subsidiary: { id: subsidiary.netsuite_internal_id.toString() },
  entity: { id: employee.netsuite_internal_id.toString() },
  currency: { id: currency.netsuite_internal_id.toString() },
  trandate: review.expense_date,
  expense: {
    items: [{
      expensedate: review.expense_date,
      category: { id: category.netsuite_internal_id.toString() },
      amount: review.receipt_amount,
      currency: { id: currency.netsuite_internal_id.toString() },
      memo: review.description || '',
    }]
  }
};

// 4. 呼叫 NetSuite API
const netsuiteResponse = await netsuite.createRecord('expenseReport', expenseReportPayload);
```

**方向 2：NetSuite → Supabase（寫回）⭐ 關鍵**

```typescript
// 1. 從 NetSuite 回應中提取資料
const netsuiteInternalId = parseInt(netsuiteResponse.id); // 或從 Location header 提取
const netsuiteTranId = netsuiteResponse.tranId;

// 2. 生成 NetSuite UI 連結
const netsuiteUrl = `https://${accountId}.app.netsuite.com/app/accounting/transactions/exprept.nl?id=${netsuiteInternalId}&whence=`;

// 3. 寫回 expense_reviews 表 ⭐ 關鍵：確保資料雙向同步
await supabase
  .from('expense_reviews')
  .update({
    netsuite_sync_status: 'success',
    netsuite_internal_id: netsuiteInternalId,        // ← NetSuite 返回的 ID
    netsuite_tran_id: netsuiteTranId,                // ← NetSuite 返回的交易編號
    netsuite_url: netsuiteUrl,                       // ← 生成的 NetSuite UI 連結
    netsuite_synced_at: new Date().toISOString(),
    netsuite_sync_error: null,
    netsuite_request_payload: expenseReportPayload,  // ← 發送的 JSON（除錯用）
    netsuite_response_payload: netsuiteResponse,     // ← NetSuite 返回的 JSON（除錯用）
  })
  .eq('id', review_id);

// 4. 同時寫入 transaction_references 表（追蹤用）
await supabase
  .from('transaction_references')
  .insert({
    source_system: 'EXPENSE_REVIEW',
    source_transaction_id: review_id,
    source_transaction_type: 'ExpenseReport',
    netsuite_record_type: 'expenseReport',
    netsuite_internal_id: netsuiteInternalId,        // ← NetSuite 返回的 ID
    netsuite_tran_id: netsuiteTranId,                // ← NetSuite 返回的交易編號
    status: 'success',
    request_payload: expenseReportPayload,
    response_payload: netsuiteResponse,
    synced_at: new Date().toISOString(),
  });
```

#### 12.2.2 寫回欄位對照表

| Supabase 欄位 | NetSuite 來源 | 說明 |
|--------------|--------------|------|
| `netsuite_internal_id` | `netsuiteResponse.id` 或 `Location` header | NetSuite 的 Internal ID（用於後續查詢） |
| `netsuite_tran_id` | `netsuiteResponse.tranId` | NetSuite 的交易編號（如 ER-12345） |
| `netsuite_url` | 生成（基於 `netsuite_internal_id`） | NetSuite UI 連結（直接開啟該 Expense Report） |
| `netsuite_sync_status` | 設定為 `'success'` | 同步狀態標記 |
| `netsuite_synced_at` | `new Date().toISOString()` | 同步時間戳記 |
| `netsuite_request_payload` | `expenseReportPayload` | 發送給 NetSuite 的完整 JSON（除錯用） |
| `netsuite_response_payload` | `netsuiteResponse` | NetSuite 返回的完整 JSON（除錯用） |

#### 12.2.3 為什麼需要寫回？

1. **追蹤對應關係**：可以從 `expense_reviews` 表直接查詢到對應的 NetSuite 記錄
2. **錯誤排查**：`netsuite_request_payload` 和 `netsuite_response_payload` 可以幫助除錯
3. **UI 連結**：`netsuite_url` 讓使用者可以直接點擊連結開啟 NetSuite 中的 Expense Report
4. **狀態管理**：`netsuite_sync_status` 讓前端可以顯示同步狀態（待同步、同步中、成功、失敗）
5. **避免重複同步**：檢查 `netsuite_sync_status === 'success'` 可以避免重複同步

### 12.3 API 端點實作

#### 12.3.1 建立報支項目 API

**端點**：`POST /api/create-expense-report`

**功能**：將使用者填寫的報支資料寫入 `expense_reviews` 表（狀態為 `pending`）

**資料流**：
```
前端表單資料
    ↓
驗證必填欄位（employee_id, expense_category_id, subsidiary_id, currency_id）
    ↓
上傳附件到 Supabase Storage（如果有的話）
    ↓
寫入 expense_reviews 表
    ├─ review_status = 'pending'
    ├─ attachment_url = Supabase Storage URL
    └─ OCR 資料（如果有的話）
    ↓
返回成功
```

**關鍵實作**：
- 驗證必填欄位是否存在於主檔表中
- 支援 Supabase Storage 上傳（優先）和 Base64 備用
- OCR 資料為選填（允許沒有 OCR 的報支）

#### 12.3.2 更新報支審核資料 API

**端點**：`PUT /api/update-expense-review`

**功能**：讓財務人員可以修改報支資料

**關鍵邏輯**：
- 如果修改了關鍵欄位（`expense_date`, `expense_category_id`, `employee_id`, `subsidiary_id`, `receipt_amount`, `currency_id`）且已審核通過，會重置 NetSuite 同步狀態：
  ```typescript
  if (hasCriticalChanges && review_status === 'approved') {
    updateData.netsuite_sync_status = 'pending';
    updateData.netsuite_internal_id = null;
    updateData.netsuite_tran_id = null;
    updateData.netsuite_url = null;
    // 需要重新同步到 NetSuite
  }
  ```
- 自動更新名稱欄位（當 ID 改變時，自動查詢對應的名稱）

#### 12.3.3 同步到 NetSuite API ⭐ 核心

**端點**：`POST /api/sync-expense-to-netsuite`

**功能**：將審核通過的報支同步到 NetSuite，並寫回同步結果

**完整流程**：

```typescript
// 1. 驗證審核狀態
if (review.review_status !== 'approved') {
  return error('報支尚未審核通過');
}

// 2. 檢查是否已經同步過
if (review.netsuite_sync_status === 'success' && review.netsuite_internal_id) {
  return error('此報支已經同步到 NetSuite');
}

// 3. 更新同步狀態為「同步中」
await supabase
  .from('expense_reviews')
  .update({ netsuite_sync_status: 'syncing' })
  .eq('id', review_id);

// 4. 查詢主檔的 NetSuite Internal ID（並行查詢）
const [subsidiary, employee, currency, category, department, class, location] = await Promise.all([
  supabase.from('ns_subsidiaries').select('netsuite_internal_id, base_currency_id').eq('id', review.subsidiary_id),
  supabase.from('ns_entities_employees').select('netsuite_internal_id').eq('id', review.employee_id),
  supabase.from('ns_currencies').select('netsuite_internal_id').eq('id', review.currency_id),
  supabase.from('ns_expense_categories').select('netsuite_internal_id').eq('id', review.expense_category_id),
  // ... 其他主檔
]);

// 5. 組裝 NetSuite Payload
const expenseReportPayload = {
  recordType: 'expenseReport',
  subsidiary: { id: subsidiary.netsuite_internal_id.toString() },
  entity: { id: employee.netsuite_internal_id.toString() },
  currency: { id: headerCurrencyId.toString() }, // 使用公司的基準幣別
  trandate: review.expense_date,
  accountingapproval: false,
  supervisorapproval: false,
  expense: {
    items: [{
      expensedate: review.expense_date,
      category: { id: category.netsuite_internal_id.toString() },
      amount: parseFloat(review.receipt_amount),
      currency: { id: expenseItemCurrencyId.toString() }, // ⚠️ 重要：expense item 也需要 currency
      memo: (review.description || '').substring(0, 4000), // NetSuite 限制 4000 字元
      // 可選欄位
      department: departmentId ? { id: departmentId.toString() } : undefined,
      class: classId ? { id: classId.toString() } : undefined,
      location: locationId ? { id: locationId.toString() } : undefined,
    }]
  }
};

// 6. 呼叫 NetSuite API
const netsuiteResponse = await netsuite.createRecord('expenseReport', expenseReportPayload);

// 7. 提取 NetSuite 返回的資料
let netsuiteInternalId: number | null = null;
if (netsuiteResponse.id) {
  netsuiteInternalId = parseInt(netsuiteResponse.id);
} else if (netsuiteResponse.location) {
  // 從 Location header 提取 ID（204 No Content 回應時）
  const locationMatch = netsuiteResponse.location.match(/\/(\d+)$/);
  if (locationMatch) {
    netsuiteInternalId = parseInt(locationMatch[1]);
  }
}

// 8. 生成 NetSuite UI 連結
const netsuiteUrl = `https://${accountId}.app.netsuite.com/app/accounting/transactions/exprept.nl?id=${netsuiteInternalId}&whence=`;

// 9. 寫回 expense_reviews 表 ⭐ 關鍵：資料雙向寫回
await supabase
  .from('expense_reviews')
  .update({
    netsuite_sync_status: 'success',
    netsuite_internal_id: netsuiteInternalId,
    netsuite_tran_id: netsuiteResponse.tranId || null,
    netsuite_url: netsuiteUrl,
    netsuite_synced_at: new Date().toISOString(),
    netsuite_sync_error: null,
    netsuite_request_payload: expenseReportPayload,
    netsuite_response_payload: netsuiteResponse,
  })
  .eq('id', review_id);

// 10. 同時寫入 transaction_references 表
await supabase
  .from('transaction_references')
  .insert({
    source_system: 'EXPENSE_REVIEW',
    source_transaction_id: review_id,
    netsuite_record_type: 'expenseReport',
    netsuite_internal_id: netsuiteInternalId,
    netsuite_tran_id: netsuiteResponse.tranId || null,
    status: 'success',
    request_payload: expenseReportPayload,
    response_payload: netsuiteResponse,
    synced_at: new Date().toISOString(),
  });
```

**關鍵實作細節**：

1. **並行查詢主檔**：使用 `Promise.all` 同時查詢多個主檔，提升效能
2. **幣別處理**：
   - Header 使用公司的基準幣別（`subsidiary.base_currency_id`）
   - Expense Item 使用報支的幣別（`review.currency_id`）
   - 如果公司的基準幣別不存在，使用報支的幣別作為備用
3. **Location 驗證**：確保 location 屬於指定的 subsidiary，否則跳過（避免 NetSuite API 錯誤）
4. **NetSuite ID 提取**：支援從 `id` 欄位或 `Location` header 提取 Internal ID（處理 204 No Content 回應）
5. **錯誤處理**：同步失敗時，更新 `netsuite_sync_status = 'failed'` 和 `netsuite_sync_error`

### 12.4 前端頁面實作

#### 12.4.1 報支審核頁面

**路徑**：`/dashboard/ocr-expense/reviews`

**功能**：
- 顯示待審核/已通過/已拒絕/已取消的報支列表
- 財務人員可以查看、編輯、審核報支
- 顯示 NetSuite 同步狀態
- 手動重試 NetSuite 同步

**關鍵實作**：

1. **效能優化**：
   - 列表查詢時只選擇必要的欄位，排除大型欄位（`attachment_base64`）
   - 使用 `useCallback` 和 `useMemo` 避免不必要的重新渲染
   - 使用 `useRef` 防止重複載入

2. **審批完成後的列表更新**：
   ```typescript
   // 立即更新列表中的該項目狀態，而不是重新載入整個列表
   setReviews(prevReviews => {
     const updatedReviews = prevReviews.map(review => 
       review.id === selectedReview.id 
         ? { ...review, review_status: newStatus, ... }
         : review
     );
     
     // 如果當前有狀態篩選，且該項目不再符合篩選條件，從列表中移除
     if (statusFilter !== 'all' && statusFilter !== newStatus) {
       return updatedReviews.filter(review => review.id !== selectedReview.id);
     }
     
     return updatedReviews;
   });
   ```

3. **NetSuite 背景同步**：
   - 審批通過後，自動在背景同步到 NetSuite
   - 不顯示同步成功的通知（避免打擾使用者）
   - 同步狀態會自動更新在列表的「NetSuite 同步」欄位

#### 12.4.2 我的報支頁面

**路徑**：`/dashboard/ocr-expense/my-expenses`

**功能**：
- 讓使用者查看自己提交的報支
- 不顯示 NetSuite 同步資訊（end-user 不需要知道）
- 不提供審批功能（只有財務人員可以審批）

### 12.5 效能優化策略

#### 12.5.1 資料庫查詢優化

1. **列表查詢優化**：
   ```typescript
   // ❌ 不建議：查詢所有欄位（包含大型 Base64 資料）
   const { data } = await supabase.from('expense_reviews').select('*');
   
   // ✅ 建議：只選擇列表顯示需要的欄位
   const { data } = await supabase
     .from('expense_reviews')
     .select(`
       id,
       expense_date,
       employee_name,
       expense_category_name,
       receipt_amount,
       review_status,
       netsuite_sync_status,
       created_at
     `);
   ```

2. **並行查詢主檔**：
   ```typescript
   // ✅ 使用 Promise.all 並行查詢，而不是順序查詢
   const [subsidiary, employee, currency, category] = await Promise.all([
     supabase.from('ns_subsidiaries').select('...').eq('id', ...),
     supabase.from('ns_entities_employees').select('...').eq('id', ...),
     supabase.from('ns_currencies').select('...').eq('id', ...),
     supabase.from('ns_expense_categories').select('...').eq('id', ...),
   ]);
   ```

#### 12.5.2 前端效能優化

1. **使用 useCallback 和 useMemo**：
   ```typescript
   const loadReviews = useCallback(async () => {
     // ... 載入邏輯
   }, [statusFilter, supabase]);
   
   const supabase = useMemo(() => createClient(), []);
   ```

2. **防止重複載入**：
   ```typescript
   const isLoadingReviewsRef = useRef(false);
   
   if (isLoadingReviewsRef.current) {
     return; // 正在載入中，跳過重複請求
   }
   ```

3. **減少 console.log**：
   ```typescript
   // 只在開發環境或查詢時間過長時記錄
   if (process.env.NODE_ENV === 'development' || duration > 1000) {
     console.log(`查詢完成，耗時: ${duration}ms`);
   }
   ```

### 12.6 錯誤處理與重試機制

#### 12.6.1 NetSuite API 錯誤處理

**常見錯誤與處理方式**：

1. **Invalid Field Value for location**：
   - **原因**：Location 不屬於指定的 Subsidiary
   - **處理**：驗證 location 的 `subsidiary_id`，如果不匹配則跳過 location 欄位（因為它是可選的）

2. **Please enter value(s) for: Currency**：
   - **原因**：Expense Item 缺少 `currency` 欄位
   - **處理**：確保 expense item 包含 `currency` 欄位，即使 header 已經有 currency

3. **No one in your chain of command has a sufficient spending limit**：
   - **原因**：NetSuite 的審批流程限制
   - **處理**：設定 `accountingapproval: false` 和 `supervisorapproval: false`

4. **204 No Content 回應**：
   - **原因**：NetSuite API 成功建立記錄但返回空回應
   - **處理**：從 `Location` header 提取 Internal ID

#### 12.6.2 同步狀態管理

**狀態流程**：
```
pending → syncing → success
                ↓
             failed (可重試)
```

**重試機制**：
- 同步失敗時，更新 `netsuite_sync_status = 'failed'` 和 `netsuite_sync_retry_count`
- 財務人員可以手動點擊「同步到 NetSuite」按鈕重試
- 前端會檢查 `netsuite_sync_status`，避免重複同步

### 12.7 Supabase Storage 整合

#### 12.7.1 Storage Bucket 設定

**Bucket 名稱**：`expense-receipts`

**設定**：
- 類型：Private（需要認證才能存取）
- RLS 政策：允許已認證使用者上傳和讀取自己的檔案

**檔案命名規則**：`{user_id}/{timestamp}_{filename}.{ext}`

#### 12.7.2 上傳流程

```typescript
// 1. 上傳到 Supabase Storage
const filePath = `${userId}/${Date.now()}_${file.name}`;
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('expense-receipts')
  .upload(filePath, file);

if (uploadError) {
  // 如果上傳失敗，使用 Base64 備用
  const base64 = await fileToBase64(file);
  // 存入 attachment_base64
} else {
  // 上傳成功，取得 URL
  const { data: { publicUrl } } = supabase.storage
    .from('expense-receipts')
    .getPublicUrl(filePath);
  // 存入 attachment_url
}
```

#### 12.7.3 讀取流程

```typescript
// 優先使用 Supabase Storage URL
if (review.attachment_url) {
  // 如果是 Private bucket，需要生成 Signed URL
  const { data: { signedUrl } } = await supabase.storage
    .from('expense-receipts')
    .createSignedUrl(filePath, 3600); // 1 小時有效
  // 使用 signedUrl 顯示圖片
} else if (review.attachment_base64) {
  // 備用：使用 Base64
  // 使用 base64 顯示圖片
}
```

### 12.8 資料驗證與完整性檢查

#### 12.8.1 建立報支時的驗證

```typescript
// 驗證必填欄位是否存在於主檔表中
const validations = await Promise.all([
  supabase.from('ns_entities_employees').select('id').eq('id', employeeId).maybeSingle(),
  supabase.from('ns_expense_categories').select('id').eq('id', expenseCategoryId).maybeSingle(),
  supabase.from('ns_subsidiaries').select('id').eq('id', subsidiaryId).maybeSingle(),
  supabase.from('ns_currencies').select('id').eq('id', currencyId).maybeSingle(),
]);

// 如果任何驗證失敗，返回錯誤
if (validations.some(v => !v.data)) {
  return error('無效的欄位值');
}
```

#### 12.8.2 同步到 NetSuite 前的驗證

```typescript
// 1. 檢查審核狀態
if (review.review_status !== 'approved') {
  return error('報支尚未審核通過');
}

// 2. 檢查是否已經同步過
if (review.netsuite_sync_status === 'success' && review.netsuite_internal_id) {
  return error('此報支已經同步到 NetSuite');
}

// 3. 檢查是否正在同步中
if (review.netsuite_sync_status === 'syncing') {
  return error('此報支正在同步中，請稍候');
}

// 4. 驗證主檔 ID 是否存在
if (!subsidiaryId || !employeeId || !currencyId || !expenseCategoryId) {
  return error('缺少必要的主檔資料');
}
```

### 12.9 開發過程中的關鍵決策

#### 12.9.1 為什麼使用中介表（expense_reviews）？

1. **審核流程**：需要財務人員審核後才能寫入 NetSuite
2. **資料修正**：審核前可以修改報支資料
3. **錯誤處理**：同步失敗時，資料仍在 Supabase，可以重試
4. **追蹤對應**：可以追蹤每筆報支的審核狀態和 NetSuite 同步狀態

#### 12.9.2 為什麼需要寫回 NetSuite 資料？

1. **追蹤對應關係**：可以從 `expense_reviews` 表直接查詢到對應的 NetSuite 記錄
2. **UI 連結**：`netsuite_url` 讓使用者可以直接點擊連結開啟 NetSuite 中的 Expense Report
3. **狀態管理**：`netsuite_sync_status` 讓前端可以顯示同步狀態
4. **避免重複同步**：檢查 `netsuite_sync_status === 'success'` 可以避免重複同步
5. **錯誤排查**：`netsuite_request_payload` 和 `netsuite_response_payload` 可以幫助除錯

#### 12.9.3 為什麼使用 Supabase Storage 而不是 Base64？

1. **效能**：Base64 會增加資料庫大小和查詢時間
2. **成本**：Supabase Storage 的成本比資料庫儲存更便宜
3. **擴展性**：可以輕鬆擴展到大量附件
4. **安全性**：Private bucket 可以控制存取權限

### 12.10 檢查清單

**建置完成後請確認**：

- [ ] `expense_reviews` 表已建立並包含所有必要欄位
- [ ] `netsuite_url` 欄位已新增到 `expense_reviews` 表
- [ ] Supabase Storage bucket `expense-receipts` 已建立並設定 RLS
- [ ] `/api/create-expense-report` API 已實作並測試通過
- [ ] `/api/update-expense-review` API 已實作並測試通過
- [ ] `/api/sync-expense-to-netsuite` API 已實作並測試通過
- [ ] 報支審核頁面可以正常顯示和審核報支
- [ ] NetSuite 同步成功後，`expense_reviews` 表的 `netsuite_internal_id` 和 `netsuite_url` 已正確寫回
- [ ] `transaction_references` 表已正確記錄交易對應關係
- [ ] 前端可以正確顯示 NetSuite 同步狀態
- [ ] 附件可以正常上傳到 Supabase Storage 並顯示

### 12.11 報支系統資料庫結構重構（表頭-表身架構）⭐ 重大變更

> **更新日期**: 2025-01-XX  
> **變更性質**: 架構重構（Breaking Change）  
> **影響範圍**: 資料庫結構、API、前端頁面

#### 12.11.1 變更背景與動機

**問題**：
原本的 `expense_reviews` 表是一個單一表結構，將所有報支資料（表頭 + 單一明細）都放在同一張表中。這種設計有以下問題：

1. **無法支援多筆明細**：NetSuite 的 Expense Report 支援多個 expense items，但原本的設計只能儲存一筆
2. **OCR 資料混雜**：OCR 識別結果、發票資料、附件資訊都混在表頭，無法區分是哪一筆明細的
3. **編輯困難**：無法針對單一明細進行編輯，必須整筆報支重新提交
4. **不符合 NetSuite 結構**：NetSuite 的 Expense Report 本身就是 Header-Line 結構

**解決方案**：
將資料庫結構重構為 **表頭（Header）+ 表身（Lines）** 的架構，完全對應 NetSuite 的 Expense Report 結構。

#### 12.11.2 資料庫結構變更

##### 12.11.2.1 表頭表（expense_reviews）簡化

**變更前**：`expense_reviews` 包含所有欄位（表頭 + 單一明細 + OCR + 附件）

**變更後**：`expense_reviews` 只包含表頭資訊

```sql
-- ============================================
-- 報支審核表（Expense Review）- 表頭
-- 說明：只儲存表頭資訊，明細資料移至 expense_lines 表
-- ============================================
CREATE TABLE expense_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- ============================================
  -- 基本報支資訊（表頭）
  -- ============================================
  expense_date DATE NOT NULL,                      -- 報支日期
  employee_id UUID,                                -- 員工 ID（對應 ns_entities_employees.id）
  employee_name VARCHAR(255),                      -- 員工名稱（快取）
  subsidiary_id UUID,                              -- 公司別 ID（對應 ns_subsidiaries.id）
  subsidiary_name VARCHAR(255),                   -- 公司別名稱（快取）
  description TEXT,                                -- 報支描述
  use_multi_currency BOOLEAN DEFAULT FALSE,        -- 是否使用多幣別（表頭設定，影響表身是否顯示外幣金額和匯率欄位）
  
  -- ============================================
  -- 審核狀態
  -- ============================================
  review_status VARCHAR(50) DEFAULT 'pending',     -- 審核狀態
  reviewed_by UUID,                                 -- 審核人員 ID
  reviewed_by_name VARCHAR(255),                   -- 審核人員名稱
  reviewed_at TIMESTAMPTZ,                         -- 審核時間
  review_notes TEXT,                                -- 審核備註
  rejection_reason TEXT,                           -- 拒絕原因
  
  -- ============================================
  -- NetSuite 同步狀態
  -- ============================================
  netsuite_sync_status VARCHAR(50) DEFAULT 'pending',
  netsuite_internal_id INTEGER,
  netsuite_tran_id VARCHAR(100),
  netsuite_sync_error TEXT,
  netsuite_synced_at TIMESTAMPTZ,
  netsuite_sync_retry_count INTEGER DEFAULT 0,
  netsuite_url TEXT,                                -- NetSuite UI 連結
  netsuite_request_payload JSONB,
  netsuite_response_payload JSONB,
  
  -- ============================================
  -- 審計欄位
  -- ============================================
  created_by UUID,
  created_by_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 移除的欄位（移至 expense_lines）：
-- ❌ expense_category_id, expense_category_name
-- ❌ receipt_amount, receipt_currency, currency_id
-- ❌ location_id, location_name, department_id, department_name, class_id, class_name
-- ❌ 所有 OCR 相關欄位（invoice_title, invoice_number, ...）
-- ❌ 所有附件欄位（attachment_url, attachment_base64）
```

**關鍵變更**：
- ✅ 表頭只保留：報支日期、員工、公司別、描述
- ❌ 移除所有明細相關欄位（金額、費用類別、部門、地點、類別）
- ❌ 移除所有 OCR 相關欄位
- ❌ 移除所有附件欄位

##### 12.11.2.2 新增表身表（expense_lines）

**新增表**：`expense_lines` 儲存所有明細資料

```sql
-- ============================================
-- 報支明細表（Expense Lines）- 表身
-- 說明：每個報支可以有多筆明細，每筆明細包含完整的 OCR 資料、發票資料、文件檔案資訊
-- ============================================
CREATE TABLE expense_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_review_id UUID NOT NULL REFERENCES expense_reviews(id) ON DELETE CASCADE,
  
  -- ============================================
  -- 基本欄位
  -- ============================================
  line_number INTEGER NOT NULL,                    -- 行號（對應 refNo，從 1 開始）
  
  -- ============================================
  -- 手動輸入欄位（表身資料）
  -- ============================================
  date DATE NOT NULL,                              -- 報支日期（line 層級）
  category_id UUID,                                -- 費用類別 ID
  category_name VARCHAR(255),                      -- 費用類別名稱（快取）
  currency_id UUID,                                -- 幣別 ID
  currency VARCHAR(10),                            -- 幣別符號（TWD, USD 等）
  foreign_amount DECIMAL(15,2),                    -- 外幣金額
  exchange_rate DECIMAL(15,6) DEFAULT 1.0,         -- 匯率
  amount DECIMAL(15,2) NOT NULL,                   -- 金額（必填）
  tax_code VARCHAR(50),                            -- 稅碼
  tax_rate DECIMAL(5,2),                           -- 稅率（%）
  tax_amt DECIMAL(15,2),                           -- 稅額
  gross_amt DECIMAL(15,2) NOT NULL,                -- 總金額（必填）
  memo TEXT,                                       -- 備註
  department_id UUID,                              -- 部門 ID（line 層級）
  department_name VARCHAR(255),                    -- 部門名稱（快取）
  class_id UUID,                                   -- 類別 ID（line 層級）
  class_name VARCHAR(255),                        -- 類別名稱（快取）
  location_id UUID,                                -- 地點 ID（line 層級）
  location_name VARCHAR(255),                      -- 地點名稱（快取）
  customer_id UUID,                                -- 客戶 ID（可選）
  customer_name VARCHAR(255),                     -- 客戶名稱（快取）
  project_task_id UUID,                            -- 專案任務 ID（可選）
  project_task_name VARCHAR(255),                  -- 專案任務名稱（快取）
  billable BOOLEAN DEFAULT FALSE,                  -- 可計費
  
  -- ============================================
  -- OCR 識別結果（發票資訊）
  -- ============================================
  invoice_title VARCHAR(255),
  invoice_period VARCHAR(50),
  invoice_number VARCHAR(100),
  invoice_date DATE,
  random_code VARCHAR(50),
  format_code VARCHAR(50),
  seller_name VARCHAR(255),
  seller_tax_id VARCHAR(50),
  seller_address TEXT,
  buyer_name VARCHAR(255),
  buyer_tax_id VARCHAR(50),
  buyer_address TEXT,
  untaxed_amount DECIMAL(15,2),
  tax_amount DECIMAL(15,2),
  total_amount DECIMAL(15,2),
  
  -- ============================================
  -- OCR 元數據
  -- ============================================
  ocr_success BOOLEAN DEFAULT FALSE,
  ocr_confidence DECIMAL(5,2),
  ocr_document_type VARCHAR(100),
  ocr_errors TEXT,
  ocr_warnings TEXT,
  ocr_error_count INTEGER DEFAULT 0,
  ocr_warning_count INTEGER DEFAULT 0,
  ocr_quality_grade VARCHAR(50),
  ocr_file_name VARCHAR(255),
  ocr_file_id VARCHAR(255),
  ocr_web_view_link TEXT,
  ocr_processed_at TIMESTAMPTZ,
  
  -- ============================================
  -- 文件檔案資訊
  -- ============================================
  document_file_name VARCHAR(255),                 -- 文件檔案名稱
  document_file_path TEXT,                         -- 文件檔案路徑（Supabase Storage 路徑）
  attachment_url TEXT,                              -- 附件 URL（Supabase Storage URL）
  attachment_base64 TEXT,                          -- 附件 Base64（備用）
  
  -- ============================================
  -- 審計欄位
  -- ============================================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- ============================================
  -- 唯一約束
  -- ============================================
  CONSTRAINT unique_expense_review_line_number UNIQUE (expense_review_id, line_number)
);

-- 索引
CREATE INDEX idx_expense_lines_review_id ON expense_lines(expense_review_id);
CREATE INDEX idx_expense_lines_line_number ON expense_lines(expense_review_id, line_number);
```

**關鍵設計**：
- ✅ 每個 line 都有獨立的 OCR 資料和附件
- ✅ 支援多幣別（每個 line 可以有不同幣別）
- ✅ 支援多部門、多地點、多類別（每個 line 可以不同）
- ✅ 外鍵約束：`ON DELETE CASCADE`（刪除表頭時自動刪除所有 lines）

#### 12.11.3 API 變更

##### 12.11.3.1 建立報支 API 變更

**端點**：`POST /api/create-expense-report`

**變更前**：接收單一物件，包含所有欄位

```typescript
// ❌ 舊格式
{
  expenseDate: '2025-01-15',
  employee: 'employee-uuid',
  subsidiary: 'subsidiary-uuid',
  expenseCategory: 'category-uuid',
  receiptAmount: '1000',
  receiptCurrency: 'TWD',
  // ... 所有欄位混在一起
}
```

**變更後**：接收表頭 + 多個 lines 的結構

```typescript
// ✅ 新格式
{
  header: {
    expenseDate: '2025-01-15',
    employee: 'employee-uuid',
    subsidiary: 'subsidiary-uuid',
    description: '報支說明'
  },
  lines: [
    {
      refNo: 1,
      date: '2025-01-15',
      category: 'category-uuid',
      currency: 'currency-uuid',
      amount: '1000',
      grossAmt: '1000',
      memo: '第一筆明細',
      department: 'dept-uuid',
      class: 'class-uuid',
      location: 'location-uuid',
      ocrData: {
        invoiceTitle: '...',
        invoiceNumber: '...',
        // ... OCR 資料
      },
      attachment_url: 'https://...',
      attachment_base64: '...',
      document_file_name: 'receipt.jpg',
      document_file_path: 'user-id/timestamp_receipt.jpg'
    },
    {
      refNo: 2,
      // ... 第二筆明細
    }
  ]
}
```

**實作邏輯**：
1. 驗證表頭必填欄位（`expenseDate`, `employee`, `subsidiary`）
2. 驗證每個 line 的必填欄位（`date`, `category`, `currency`, `amount`, `grossAmt`）
3. 查詢主檔 ID（employee, subsidiary, category, currency, department, class, location）
4. 插入表頭到 `expense_reviews`
5. 批次插入所有 lines 到 `expense_lines`
6. 如果 line 插入失敗，刪除已建立的表頭（Rollback）

##### 12.11.3.2 新增取得報支 API

**端點**：`GET /api/expense-reports/[id]`

**功能**：取得完整的報支資料（表頭 + 所有 lines）

```typescript
// 回應格式
{
  success: true,
  data: {
    header: {
      id: 'uuid',
      expense_date: '2025-01-15',
      employee_id: 'uuid',
      employee_name: '張三',
      // ... 表頭資料
    },
    lines: [
      {
        id: 'uuid',
        line_number: 1,
        date: '2025-01-15',
        category_id: 'uuid',
        category_name: '交通費',
        // ... line 資料（包含 OCR 和附件）
      },
      // ... 更多 lines
    ]
  }
}
```

**權限檢查**：
- 只有建立者可以取得報支資料（用於編輯）
- 檢查 `created_by === user.id`

##### 12.11.3.3 新增更新報支 API

**端點**：`PUT /api/expense-reports/[id]`

**功能**：更新報支資料（表頭 + 所有 lines）

**請求格式**：與 `POST /api/create-expense-report` 相同

**實作邏輯**：
1. 檢查報支是否存在且使用者有權限
2. 檢查審核狀態（只能編輯 `review_status === 'pending'` 的報支）
3. 更新表頭
4. 刪除所有現有的 lines
5. 插入新的 lines（與建立邏輯相同）

**關鍵設計**：
- 採用「刪除舊 lines + 插入新 lines」的策略（簡化實作，避免複雜的 diff 邏輯）
- 確保資料一致性（如果 line 插入失敗，不更新表頭）

#### 12.11.4 前端變更

##### 12.11.4.1 OCR Expense 頁面變更

**路徑**：`/dashboard/ocr-expense`

**變更內容**：

1. **表單結構變更**：
   - 表頭只保留：報支日期、員工、公司別、描述
   - 移除：費用類別、金額、幣別、部門、地點、類別（移至表身）

2. **新增 Expense Lines 管理**：
   - 使用 `expenseLines` state 管理多筆明細
   - 每筆明細包含：日期、費用類別、幣別、金額、總金額、備註、部門、地點、類別、OCR 資料、附件
   - 支援新增、刪除、排序、編輯明細

3. **編輯模式支援**：
   - 從 URL 參數讀取 `expense_review_id`（`?id=xxx`）
   - 自動載入報支資料（表頭 + 所有 lines）
   - 顯示載入狀態
   - 頁面標題動態顯示（「編輯報支項目」或「建立報支項目」）

4. **附件處理**：
   - 每個 line 可以有獨立的附件
   - 編輯模式時，優先使用現有的 `attachment_url`（避免重複上傳）
   - 新建或更新附件時，上傳到 Supabase Storage

**關鍵程式碼**：

```typescript
// 編輯模式：從 URL 參數讀取 expense_review_id
const expenseReviewId = searchParams.get('id');
const [isEditMode, setIsEditMode] = useState(false);

// 載入報支資料
useEffect(() => {
  if (!expenseReviewId) return;
  
  const loadExpenseReport = async () => {
    const response = await fetch(`/api/expense-reports/${expenseReviewId}`);
    const { header, lines } = await response.json();
    
    // 載入表頭
    setFormData({
      expenseDate: header.expense_date,
      employee: header.employee_id,
      subsidiary: header.subsidiary_id,
      description: header.description || '',
    });
    
    // 載入 lines
    setExpenseLines(lines.map(line => ({
      refNo: line.line_number,
      date: line.date,
      category: line.category_id,
      // ... 其他欄位
      ocrData: {
        invoiceTitle: line.invoice_title,
        // ... OCR 資料
        attachmentUrl: line.attachment_url, // 保存現有 URL
      }
    })));
  };
  
  loadExpenseReport();
}, [expenseReviewId]);

// 提交時判斷使用 POST 或 PUT
const apiUrl = isEditMode && expenseReviewId
  ? `/api/expense-reports/${expenseReviewId}`
  : '/api/create-expense-report';
const method = isEditMode && expenseReviewId ? 'PUT' : 'POST';
```

##### 12.11.4.2 我的報支頁面變更

**路徑**：`/dashboard/ocr-expense/my-expenses`

**變更內容**：

1. **列表顯示變更**：
   - 移除「費用類別」欄位（表頭不再有）
   - 新增「員工」欄位（顯示 `employee_name`）
   - 總金額從 `expense_lines` 計算（`SUM(gross_amt)`）

2. **新增編輯功能**：
   - 在「操作」欄位新增「編輯」按鈕
   - 只有 `review_status === 'pending'` 的報支可以編輯
   - 點擊「編輯」跳轉到 `/dashboard/ocr-expense?id={expense_review_id}`

**關鍵程式碼**：

```typescript
// 查詢時計算總金額
const { data } = await supabase
  .from('expense_reviews')
  .select(`
    *,
    expense_lines (
      gross_amt,
      currency
    )
  `)
  .eq('created_by', user.id);

// 處理資料：計算總金額
const processedData = data.map(review => ({
  ...review,
  receipt_amount: review.expense_lines?.reduce(
    (sum, line) => sum + (parseFloat(line.gross_amt) || 0),
    0
  ) || 0,
  receipt_currency: review.expense_lines?.[0]?.currency || 'TWD',
}));

// 編輯按鈕
{review.review_status === 'pending' && (
  <Button
    onClick={() => router.push(`/dashboard/ocr-expense?id=${review.id}`)}
  >
    編輯
  </Button>
)}
```

#### 12.11.5 資料遷移

**重要**：本次重構**不清除舊資料**，但**不進行資料遷移**。

**原因**：
1. 舊資料結構與新結構差異太大，遷移複雜度高
2. 舊資料可能不符合新的業務邏輯（例如：只有一筆明細）
3. 建議重新建立報支，確保資料完整性

**執行步驟**：

```sql
-- 1. 建立新的 expense_lines 表
-- （執行 create_expense_lines_table.sql）

-- 2. 簡化 expense_reviews 表
-- （執行 simplify_expense_reviews_table.sql）
-- 注意：此 SQL 會 TRUNCATE 表，清除所有舊資料

-- 3. 確認外鍵約束
ALTER TABLE expense_lines 
  ADD CONSTRAINT fk_expense_lines_review 
  FOREIGN KEY (expense_review_id) 
  REFERENCES expense_reviews(id) 
  ON DELETE CASCADE;
```

#### 12.11.6 影響範圍與注意事項

##### 12.11.6.1 影響範圍

1. **資料庫**：
   - ✅ `expense_reviews` 表結構大幅簡化
   - ✅ 新增 `expense_lines` 表
   - ⚠️ 舊資料會被清除（`TRUNCATE`）

2. **API**：
   - ✅ `POST /api/create-expense-report` 請求格式變更
   - ✅ 新增 `GET /api/expense-reports/[id]`
   - ✅ 新增 `PUT /api/expense-reports/[id]`

3. **前端**：
   - ✅ OCR Expense 頁面結構變更
   - ✅ 我的報支頁面顯示邏輯變更
   - ✅ 新增編輯功能

4. **NetSuite 同步**：
   - ⚠️ 需要更新同步邏輯，從 `expense_lines` 讀取明細資料
   - ⚠️ 需要組裝多個 expense items

##### 12.11.6.2 注意事項

1. **資料一致性**：
   - 確保表頭和 lines 的資料一致性（例如：表頭的 `expense_date` 應該與 lines 的 `date` 一致）
   - 使用資料庫約束（外鍵、唯一約束）確保資料完整性

2. **效能考量**：
   - 查詢報支列表時，使用 JOIN 或子查詢計算總金額
   - 避免在列表查詢時載入所有 lines（只載入必要的欄位）

3. **編輯權限**：
   - 只有建立者可以編輯
   - 只能編輯待審核的報支（`review_status === 'pending'`）

4. **附件處理**：
   - 編輯模式時，如果已有 `attachment_url`，不會重新上傳
   - 新建或更新附件時，上傳到 Supabase Storage

5. **NetSuite 同步**：
   - 需要從 `expense_lines` 讀取所有明細
   - 組裝 NetSuite 的 `expense.items` 陣列

#### 12.11.7 檢查清單

**資料庫**：
- [ ] `expense_reviews` 表已簡化（移除明細、OCR、附件欄位）
- [ ] `expense_lines` 表已建立並包含所有必要欄位
- [ ] 外鍵約束已設定（`ON DELETE CASCADE`）
- [ ] 唯一約束已設定（`unique_expense_review_line_number`）
- [ ] 索引已建立（`expense_review_id`, `line_number`）

**API**：
- [ ] `POST /api/create-expense-report` 已更新為新格式
- [ ] `GET /api/expense-reports/[id]` 已實作
- [ ] `PUT /api/expense-reports/[id]` 已實作
- [ ] 權限檢查已實作（只有建立者可以編輯）
- [ ] 狀態檢查已實作（只能編輯待審核的報支）

**前端**：
- [ ] OCR Expense 頁面已更新為表頭+表身結構
- [ ] Expense Lines 管理功能已實作（新增、刪除、排序、編輯）
- [ ] 編輯模式已實作（從 URL 載入資料）
- [ ] 我的報支頁面已更新（顯示員工、計算總金額）
- [ ] 編輯按鈕已新增（只有待審核的報支可以編輯）

**測試**：
- [ ] 可以建立新的報支（表頭 + 多筆明細）
- [ ] 可以編輯待審核的報支
- [ ] 編輯後可以正確更新資料
- [ ] 附件可以正常上傳和顯示
- [ ] 列表可以正確顯示總金額

---

## 13. 🎉 結語

恭喜你！如果你跟著這份指南一步步做完，你現在已經有：

✅ 一個完整的 NetSuite 主檔快取層（Supabase）  
✅ 主檔同步機制（需自行實作）  
✅ 強大的 Name-to-ID Mapping 系統  
✅ 完整的交易單據建立能力  
✅ 製造業 MES/WMS 支援  
✅ 監控與錯誤處理機制  

**你現在可以：**
- 從 POS 打銷售訂單到 NetSuite
- 從 WMS 打調撥單、入庫單
- 從 MES 打工單、領料單
- 從報支系統打費用報銷單
- 從財務系統打手切傳票（日記帳）

**下一步建議：**
1. 先從簡單的 Sales Order 開始測試
2. 逐步增加複雜度（加入 Department、Class 等）
3. 完善錯誤處理和重試機制
4. 建立監控 Dashboard
5. 撰寫團隊操作手冊

祝你建置順利！🚀

---

## 13. NetSuite 風格 Visual ETL & SQL Generator

> **本章節記錄 NetSuite Import Assistant 風格的視覺化 ETL 工具完整實作。**  
> **建立日期**: 2025-01-17  
> **版本**: 1.0.0

### 13.1 專案概述

這是一個完全按照 **Oracle NetSuite Import Assistant** 風格打造的 Web 版視覺化 ETL 映射工具。透過直觀的拖拉界面，讓使用者輕鬆完成「CSV 資料」到「資料庫表」的映射，並自動產生 SQL 語句執行匯入。

#### 核心特色

✅ **NetSuite 風格 UI**：嚴格復刻 Oracle NetSuite Import Assistant 的介面設計  
✅ **三欄式拖拉界面**：左欄（CSV 欄位）、中欄（映射關係）、右欄（目標欄位）  
✅ **智慧箭頭轉換**：點擊箭頭設定資料轉換規則（Direct Map, Default Value, VLOOKUP, Aggregate, SQL Expression）  
✅ **狀態鎖定機制**：已映射的欄位自動變灰，防止重複映射  
✅ **自動 SQL 生成**：根據映射配置自動產生 CREATE TABLE 或 UPSERT 語句  
✅ **型別推斷**：自動從 CSV 範例資料推斷欄位型別

### 13.2 系統架構

#### 技術堆疊

| 層級 | 技術 |
|------|------|
| 前端框架 | Next.js 14 (App Router) + TypeScript |
| UI 元件庫 | Radix UI + shadcn/ui + Tailwind CSS |
| 拖拉套件 | HTML5 Drag & Drop API（原生） |
| 後端 API | Next.js API Routes |
| 資料庫 | Supabase (PostgreSQL) |

#### 檔案結構

```
/app/api
  /csv-upload          # CSV 上傳和解析 API
  /generate-sql        # SQL 生成引擎 API
  /execute-etl         # ETL 執行 API

/app/dashboard
  /etl-import          # ETL 主頁面

/components/etl
  netsuite-style.css        # NetSuite 風格樣式表
  SourceFieldList.tsx       # 左欄：CSV 欄位列表
  TargetFieldList.tsx       # 右欄：目標欄位列表
  MappingCanvas.tsx         # 中欄：映射畫布
  TransformModal.tsx        # 智慧箭頭：轉換規則 Modal
```

### 13.3 核心功能

#### 13.3.1 CSV 上傳和解析

**API 路徑**: `POST /app/api/csv-upload/route.ts`

**功能**:
- 接收 CSV 檔案（支援引號包覆的欄位）
- 解析 Header 和範例資料（最多取 5 筆）
- 自動推斷資料型別（text, integer, numeric, boolean, date）
- 回傳欄位結構給前端

**型別推斷邏輯**:

```typescript
function inferDataType(fieldName: string, sampleData: Record<string, any>[]): string {
  // 檢查是否為數字 → integer / numeric
  // 檢查是否為日期 → date
  // 檢查是否為 Boolean → boolean
  // 預設 → text
}
```

#### 13.3.2 欄位映射（拖拉邏輯）

**元件**: `<MappingCanvas />`, `<SourceFieldList />`, `<TargetFieldList />`

**拖拉流程**:

1. 使用者從**左欄**拖曳 CSV 欄位（設定 `sourceField` 和 `sourceType`）
2. 使用者從**右欄**拖曳目標欄位（設定 `targetField` 和 `targetType`）
3. 在**中欄**的 Drop Zone 放下，自動建立映射規則
4. 左欄的來源欄位變灰（`isMapped: true`），不可再次拖曳

**狀態鎖定實作**:

```typescript
// 當映射建立後，更新來源欄位狀態
setSourceFields(
  sourceFields.map((f) =>
    f.name === sourceField ? { ...f, isMapped: true } : f
  )
);
```

#### 13.3.3 智慧箭頭：轉換規則設定

**元件**: `<TransformModal />`

**功能**: 點擊中欄映射行的箭頭圖示（<=>），開啟 Modal 設定轉換規則

**支援的轉換類型**:

1. **Direct Map（直接映射）**: 來源欄位的值直接複製到目標欄位
2. **Default Value（預設值）**: 當來源欄位為空時，填入預設值
3. **VLOOKUP（查表）**: 使用來源值到另一個表查詢，返回指定欄位
4. **Aggregate（聚合函數）**: 支援 SUM, AVG, COUNT, MAX, MIN
5. **SQL Expression（自訂表達式）**: 使用 SQL 表達式進行複雜轉換

**VLOOKUP 範例**:
```typescript
{
  type: 'vlookup',
  config: {
    lookupTable: 'ns_subsidiary',
    lookupKey: 'id',
    returnField: 'full_name'
  }
}
```

**SQL Expression 範例**:
```typescript
{
  type: 'expression',
  config: {
    expression: "CONCAT(${value}, '_suffix')"
  }
}
```

#### 13.3.4 SQL 自動生成

**API 路徑**: `POST /app/api/generate-sql/route.ts`

**功能**:
- 檢查目標表是否存在
- **Scenario A**: 表不存在 → 生成 `CREATE TABLE` + 索引 + 觸發器
- **Scenario B**: 表已存在 → 生成 `ALTER TABLE`（新增欄位）+ `UPSERT` 語句

**生成的 SQL 範例（CREATE TABLE）**:
```sql
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  customer_name TEXT,
  amount NUMERIC(18, 2)
);

CREATE INDEX IF NOT EXISTS idx_sales_orders_sync_timestamp 
ON sales_orders(sync_timestamp DESC);
```

**生成的 SQL 範例（UPSERT）**:
```sql
INSERT INTO sales_orders (
  customer_name,
  amount,
  sync_timestamp
)
VALUES ($1, $2, NOW())
ON CONFLICT (external_id) 
DO UPDATE SET
    customer_name = EXCLUDED.customer_name,
    amount = EXCLUDED.amount,
    updated_at = NOW(),
    sync_timestamp = NOW();
```

#### 13.3.5 ETL 執行

**API 路徑**: `POST /app/api/execute-etl/route.ts`

**功能**:
- 根據映射規則轉換 CSV 資料
- 執行型別轉換（text → numeric, boolean 等）
- 套用轉換規則（Default Value, SQL Expression 等）
- 使用 Supabase Client 執行 INSERT 或 UPSERT

**型別轉換邏輯**:

| 來源值 | 目標型別 | 轉換結果 |
|--------|---------|---------|
| `"123"` | integer | `123` |
| `"45.67"` | numeric | `45.67` |
| `"T"` / `"true"` | boolean | `true` |
| `"F"` / `"false"` | boolean | `false` |
| `"2025-01-17"` | timestamp | `"2025-01-17T00:00:00.000Z"` |

### 13.4 UI 設計規範

#### NetSuite 風格配色

```css
--ns-blue-dark: #2D4466;      /* 深藍色標題背景 */
--ns-blue-light: #E0E6F0;     /* 淡藍色漸層 */
--ns-text-dark: #333333;      /* 深灰文字 */
--ns-arrow-blue: #4A90E2;     /* 箭頭藍色 */
```

#### 三欄式佈局

```css
.ns-three-column {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 16px;
  height: calc(100vh - 200px);
}
```

### 13.5 使用流程

#### 步驟 1: 上傳 CSV 檔案
1. 點擊「選擇檔案」按鈕
2. 選擇 CSV 檔案（支援逗號分隔，引號包覆）
3. 系統自動解析欄位和型別

#### 步驟 2: 欄位映射
1. 輸入目標表名稱（例如：`sales_orders`）
2. 輸入主鍵欄位（可選，例如：`external_id`）
3. 從左欄拖曳 CSV 欄位 + 從右欄拖曳目標欄位到中欄
4. 點擊箭頭（<=>）設定轉換規則（可選）
5. 點擊「下一步：生成 SQL」

#### 步驟 3: 檢視 SQL
1. 系統顯示自動生成的 SQL 語句
2. 檢查 SQL 模式（CREATE TABLE 或 UPSERT）
3. 可選：下載 SQL 檔案
4. 點擊「執行匯入」或「返回修改」

#### 步驟 4: 執行匯入
1. 系統執行資料轉換
2. 執行 SQL（建表或更新）
3. 匯入資料到 Supabase
4. 顯示成功訊息和匯入筆數

### 13.6 最佳實踐

#### CSV 檔案準備

✅ **建議做法**:
- 第一行必須是 Header（欄位名稱）
- 欄位名稱使用英文和底線（例如：`customer_name`）
- 日期格式使用 ISO 8601（`YYYY-MM-DD`）
- Boolean 使用 `T`/`F` 或 `true`/`false`
- 數字不要包含貨幣符號（`$1000` → `1000`）

❌ **避免做法**:
- 空白的 Header
- 混用不同的日期格式
- 數字欄位包含文字（例如：`"1,000"` 應該改為 `1000`）

#### 映射策略

- **必填欄位優先**: 先映射目標表的必填欄位（標記 *）
- **主鍵設定**: 若目標表已存在，務必設定主鍵以啟用 UPSERT 模式
- **型別匹配**: 盡量讓來源型別與目標型別一致
- **轉換規則**: 只在必要時使用複雜轉換（VLOOKUP, Aggregate）

### 13.7 進階功能（未來規劃）

以下功能目前尚未實作，列為未來開發方向：

1. **映射範本儲存**: 將常用的映射配置儲存為範本
2. **資料驗證規則**: 在匯入前驗證資料（例如：Email 格式、數值範圍）
3. **批次處理**: 支援上傳多個 CSV 檔案，自動依序處理
4. **即時預覽**: 在映射階段顯示轉換後的資料預覽
5. **錯誤復原**: 若匯入失敗，自動建立復原點

### 13.8 相關文件

- [ETL_VISUAL_MAPPER_GUIDE.md](./docs/ETL_VISUAL_MAPPER_GUIDE.md) - 完整使用指南
- [NS_CSV_ETL工具克隆版.md](./NS_CSV_ETL工具克隆版.md) - 原始需求文件

### 13.9 核心檔案清單

#### 後端 API
- `app/api/csv-upload/route.ts` - CSV 上傳和解析
- `app/api/generate-sql/route.ts` - SQL 生成引擎
- `app/api/execute-etl/route.ts` - ETL 執行

#### 前端元件
- `app/dashboard/etl-import/page.tsx` - ETL 主頁面
- `components/etl/SourceFieldList.tsx` - 來源欄位列表
- `components/etl/TargetFieldList.tsx` - 目標欄位列表
- `components/etl/MappingCanvas.tsx` - 映射畫布
- `components/etl/TransformModal.tsx` - 轉換規則 Modal
- `components/etl/netsuite-style.css` - NetSuite 風格樣式

#### 導航
- `components/sidebar.tsx` - 已新增「ETL 視覺化匯入」選項

### 13.10 小結

NetSuite 風格 Visual ETL & SQL Generator 為資料匯入提供了專業且直觀的解決方案。透過嚴格復刻 NetSuite Import Assistant 的介面設計，讓使用者能夠快速上手，無需撰寫程式碼即可完成複雜的資料映射和匯入任務。

**關鍵優勢**:
- 🎨 專業的 UI/UX 設計（NetSuite 風格）
- 🔄 靈活的資料轉換規則（5 種轉換類型）
- 🤖 自動 SQL 生成（CREATE TABLE / UPSERT）
- 🚀 即時執行，無需手動撰寫 SQL
- 📊 視覺化進度追蹤

---

## 14. LINE Pay 金流對接設計

> **本章節記錄 LINE Pay 金流對接的完整設計和實作細節。**  
> **最後更新**: 2025-01-XX

### 13.1 概述

LINE Pay 金流對接系統提供完整的付款流程，包含：

- **QR Code 付款條碼產生**：POS 系統產生 LINE Pay 付款條碼
- **付款狀態輪詢**：自動檢查付款狀態
- **付款確認機制**：確認付款後建立對賬記錄
- **金流管理整合**：自動將付款記錄寫入金流管理系統

### 13.2 完整設計文件

詳細的設計文件請參考：[LINE Pay 金流對接設計文件](./docs/LINE_PAY_INTEGRATION_DESIGN.md)

該文件包含：

1. **系統架構**：完整的架構圖和元件說明
2. **流程設計**：付款流程的完整序列圖和狀態轉換圖
3. **API 設計**：所有 API 端點的詳細規格
4. **資料結構**：所有相關資料結構的定義
5. **前端實作**：前端元件的實作細節
6. **後端實作**：後端 API 的實作邏輯
7. **狀態管理**：狀態管理的完整流程
8. **錯誤處理**：錯誤處理機制
9. **測試流程**：測試步驟和場景
10. **未來改進方向**：V1、V2、V3 的改進計劃

### 13.3 快速參考

#### 核心檔案

- `lib/linepay-manager.ts` - LINE Pay 管理工具類別
- `app/api/mock/linepay/request/route.ts` - 付款請求 API
- `app/api/mock/linepay/confirm/route.ts` - 付款確認 API
- `app/api/mock/linepay/status/route.ts` - 付款狀態查詢 API
- `app/dashboard/my-mobile-pos/page.tsx` - POS 結帳流程整合
- `app/dashboard/my-mobile-pos/payment-flow/page.tsx` - 金流管理頁面

#### 關鍵流程

1. **付款請求**：`LinePayManager.requestPayment()` → 產生 QR Code
2. **狀態輪詢**：每 2 秒查詢一次付款狀態
3. **付款確認**：付款成功後自動確認並建立對賬記錄
4. **金流管理**：記錄自動寫入金流管理系統

#### 環境變數

```env
NEXT_PUBLIC_USE_MOCK_PAYMENT=true  # 開發時用 true，正式上線改 false
```

---

**文檔維護**：
- 如有更新，請修改文檔頂部的版本號和日期
- 建議定期（每季）檢視並更新內容
- 遇到新問題請補充到「常見問題與陷阱」章節
