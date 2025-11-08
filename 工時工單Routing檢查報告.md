# 工時、工單、Routing 中台資料拉取檢查報告

## 檢查範圍

檢查以下項目是否可以從中台拉出資料（只讀）：
1. **Work Center（工作中心）**
2. **Routing（製程路由）**
3. **Work Order（工單）**
4. **工時記錄**

---

## 1. Work Center（工作中心）

### ✅ 表結構設計（指南中）

**位置**：`NetSuite中臺建置完全指南.md` 第 935-958 行

```sql
CREATE TABLE <accountid>_work_centers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  location_id INTEGER,
  capacity_per_hour DECIMAL(10,2),
  cost_per_hour DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### ⚠️ 同步 API 實作

**位置**：`app/api/sync-work-centers/route.ts`

**問題**：
- ❌ 目前 API 使用 `getRecordList('workcenter')`，但對照表顯示 `workcenter` record type 不存在
- ✅ 對照表建議：透過 Routing Steps 取得 Work Center 資訊

**建議修正**：
- 需要修改同步 API，從 Routing Steps 中提取 Work Center 資訊
- 或確認實際的 record type 名稱

### ✅ 對照表記錄

**位置**：`NetSuite_實際欄位對照表.md` 第 874-963 行

**記錄內容**：
- ✅ 說明 Work Center 是透過 Employee Group 實現的
- ✅ 說明可以從 Routing Steps 取得 Work Center 資訊
- ✅ 記錄了實際的資料結構

### 📋 檢查結果

| 項目 | 狀態 | 說明 |
|------|------|------|
| 表結構 | ✅ 完整 | 指南中有完整的表結構設計 |
| 同步 API | ⚠️ 需要修正 | 目前使用錯誤的 record type，需要從 Routing Steps 取得 |
| 對照表 | ✅ 完整 | 有詳細的欄位對照和實作方式 |
| 查詢 API | ❌ 缺少 | 沒有提供查詢 API 給 MES 系統使用 |

---

## 2. Routing（製程路由）

### ✅ 表結構設計（指南中）

**位置**：`NetSuite中臺建置完全指南.md` 第 960-1014 行

#### 主表：`<accountid>_routings`
```sql
CREATE TABLE <accountid>_routings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  netsuite_internal_id INTEGER UNIQUE NOT NULL,
  assembly_item_id INTEGER NOT NULL,
  name VARCHAR(255),
  revision VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 明細表：`<accountid>_routing_steps`
```sql
CREATE TABLE <accountid>_routing_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routing_id UUID REFERENCES <accountid>_routings(id),
  netsuite_routing_id INTEGER,
  sequence_number INTEGER,
  operation_name VARCHAR(255),
  work_center_id INTEGER,
  setup_time DECIMAL(10,2),
  run_time DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### ❌ 同步 API 實作

**問題**：
- ❌ **缺少同步 API**：沒有 `app/api/sync-routings/route.ts`
- ❌ **缺少同步 API**：沒有 `app/api/sync-routing-steps/route.ts`

**建議**：
- 需要建立同步 API，從 NetSuite 取得 Routing 和 Routing Steps

### ✅ 對照表記錄

**位置**：`NetSuite_實際欄位對照表.md` 第 965-1104 行

**記錄內容**：
- ✅ 說明可以透過 REST API 查詢 `manufacturingrouting`
- ✅ 記錄了實際的欄位結構（主記錄和 Routing Steps）
- ✅ 記錄了查詢方式（List API 和子資源查詢）

### ⚠️ 表結構欄位對照

**指南中的欄位** vs **實際欄位**（根據對照表）：

| 指南欄位 | 實際欄位 | 狀態 | 說明 |
|---------|---------|------|------|
| `assembly_item_id` | `billOfMaterials.id` | ⚠️ 需要調整 | Routing 透過 `billOfMaterials` 關聯到 BOM，BOM 再關聯到 Assembly Item |
| `revision` | 不存在 | ❌ 實際沒有此欄位 | 需要從表結構中移除 |
| `name` | `name` | ✅ 對應正確 | "AAA Routing" |
| `is_active` | `isInactive` | ⚠️ 邏輯相反 | 需要轉換：`isInactive = false` → `is_active = true` |
| `sequence_number` | `operationSequence` | ✅ 對應正確 | 工序順序 |
| `operation_name` | `operationName` | ✅ 對應正確 | 工序名稱 |
| `work_center_id` | `manufacturingWorkCenter.id` | ✅ 對應正確 | 從 `manufacturingWorkCenter.id` 取得 |
| `setup_time` | `setupTime` | ✅ 對應正確 | 準備時間 |
| `run_time` | `runRate` | ⚠️ 需要確認 | 可能是 `runRate`（單位需要確認） |
| ❌ 缺少 | `autoCalculateLag` | ❌ 未記錄 | Routing 主表有此欄位 |
| ❌ 缺少 | `subsidiary` | ❌ 未記錄 | Routing 主表有此欄位 |
| ❌ 缺少 | `location` | ❌ 未記錄 | Routing 主表有此欄位 |
| ❌ 缺少 | `machineResources` | ❌ 未記錄 | Routing Steps 有此欄位 |
| ❌ 缺少 | `laborResources` | ❌ 未記錄 | Routing Steps 有此欄位 |
| ❌ 缺少 | `operationYield` | ❌ 未記錄 | Routing Steps 有此欄位 |

### 📋 檢查結果

| 項目 | 狀態 | 說明 |
|------|------|------|
| 表結構 | ⚠️ 部分對照 | 欄位名稱需要與實際欄位對照 |
| 同步 API | ❌ 缺少 | 需要建立同步 API |
| 對照表 | ✅ 完整 | 有詳細的欄位對照和實作方式 |
| 查詢 API | ❌ 缺少 | 沒有提供查詢 API 給 MES 系統使用 |

---

## 3. Work Order（工單）

### ✅ 追蹤表設計（指南中）

**位置**：`NetSuite中臺建置完全指南.md` 第 1062-1108 行

```sql
CREATE TABLE work_order_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_system VARCHAR(100),
  source_wo_number VARCHAR(255),
  netsuite_wo_id INTEGER,
  netsuite_wo_number VARCHAR(100),
  assembly_item_id INTEGER,
  quantity_ordered DECIMAL(15,4),
  quantity_completed DECIMAL(15,4) DEFAULT 0,
  quantity_scrapped DECIMAL(15,4) DEFAULT 0,
  status VARCHAR(50),
  location_id INTEGER,
  start_date DATE,
  end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### ❌ 主檔表設計

**問題**：
- ❌ **缺少 Work Order 主檔表**：只有追蹤表，沒有主檔表
- ⚠️ **Work Order 是否需要主檔表？**：如果 MES 系統只需要查詢已建立的工單，可能需要主檔表

### ❌ 同步 API 實作

**問題**：
- ❌ **缺少同步 API**：沒有 `app/api/sync-work-orders/route.ts`
- ⚠️ **Work Order 是否需要同步？**：如果 MES 系統只負責建立工單，可能不需要同步

### ✅ 指南中的實作範例

**位置**：`NetSuite中臺建置完全指南.md` 第 2680-2838 行

**內容**：
- ✅ 有 Work Order 建立的 API Payload 範例
- ✅ 有 Component Issue（領料單）的 API Payload 範例
- ✅ 有 Work Order Completion（完工入庫）的 API Payload 範例

### 📋 檢查結果

| 項目 | 狀態 | 說明 |
|------|------|------|
| 追蹤表 | ✅ 完整 | 有完整的追蹤表設計 |
| 主檔表 | ❌ 缺少 | 沒有 Work Order 主檔表（可能需要？） |
| 同步 API | ❌ 缺少 | 沒有同步 API（可能需要？） |
| 建立 API | ✅ 有範例 | 指南中有建立工單的範例 |

---

## 4. 工時記錄

### ❌ 主檔表設計

**問題**：
- ❌ **沒有工時記錄的主檔表**
- ⚠️ **工時記錄是否需要主檔表？**：工時是透過 Work Order Completion 記錄的，可能不需要獨立的主檔表

### ✅ 指南中的實作範例

**位置**：`NetSuite中臺建置完全指南.md` 第 2753-2766 行

**內容**：
- ✅ 有 Work Order Completion 的 API Payload 範例
- ⚠️ 但沒有明確說明工時欄位

### ✅ 對照表記錄

**位置**：`NetSuite_實際欄位對照表.md` 第 1167-1180 行

**記錄內容**：
- ✅ 說明可以透過 Work Order Completion 記錄工時
- ⚠️ 需要確認是否支援工時欄位

### 📋 檢查結果

| 項目 | 狀態 | 說明 |
|------|------|------|
| 主檔表 | ❌ 不需要 | 工時是透過 Work Order Completion 記錄的 |
| 同步 API | ❌ 不需要 | 工時是寫入的，不是同步的 |
| 對照表 | ⚠️ 部分 | 有說明，但需要確認工時欄位 |

---

## 總結與建議

### ✅ 已完成的項目

1. **Work Center 表結構**：指南中有完整的設計
2. **Routing 表結構**：指南中有主表和明細表的設計
3. **Work Order 追蹤表**：指南中有完整的設計
4. **對照表記錄**：兩份文件都有詳細的欄位對照

### ❌ 缺少的項目

1. **Work Center 同步 API**：需要修正，從 Routing Steps 取得 Work Center 資訊
2. **Routing 同步 API**：需要建立 `app/api/sync-routings/route.ts` 和 `app/api/sync-routing-steps/route.ts`
3. **Routing 表結構欄位對照**：需要更新表結構，對照實際欄位
4. **查詢 API**：需要建立查詢 API 給 MES 系統使用

### ⚠️ 需要確認的項目

1. **Work Order 主檔表**：是否需要建立 Work Order 主檔表？
2. **Work Order 同步 API**：是否需要同步 Work Order？
3. **工時欄位**：Work Order Completion 是否支援工時欄位？

### 📋 建議的下一步行動

#### 優先級 1：必須完成（才能從中台拉取資料）

1. **修正 Work Center 同步 API**：
   - 修改 `app/api/sync-work-centers/route.ts`
   - 從 Routing Steps 取得 Work Center 資訊（根據對照表的實作方式）
   - 去重複取得所有唯一的 Work Centers

2. **建立 Routing 同步 API**：
   - 建立 `app/api/sync-routings/route.ts`：同步 Routing 主表
   - 建立 `app/api/sync-routing-steps/route.ts`：同步 Routing Steps
   - 實作方式：先取得所有 Routing，再對每個 Routing 取得 Routing Steps

3. **更新 Routing 表結構**：
   - 根據對照表的實際欄位，更新指南中的表結構
   - 移除 `revision` 欄位（實際不存在）
   - 新增 `subsidiary_id`、`location_id`、`auto_calculate_lag` 等欄位
   - 更新 Routing Steps 表，新增 `machine_resources`、`labor_resources`、`operation_yield` 等欄位

4. **建立查詢 API**（給 MES 系統使用）：
   - `GET /api/work-centers` - 查詢所有 Work Centers
   - `GET /api/work-centers/:id` - 查詢單一 Work Center
   - `GET /api/routings` - 查詢所有 Routings
   - `GET /api/routings/:id` - 查詢單一 Routing
   - `GET /api/routings/:id/steps` - 查詢 Routing Steps
   - `GET /api/routings/:id/work-centers` - 查詢 Routing 關聯的 Work Centers

#### 優先級 2：可以後續實作

5. **確認 Work Order 需求**：
   - 是否需要 Work Order 主檔表？（如果 MES 系統需要查詢已建立的工單）
   - 是否需要 Work Order 同步 API？（如果 MES 系統需要查詢 NetSuite 中已建立的工單）

6. **確認工時欄位**：
   - 測試 Work Order Completion 是否支援工時欄位
   - 如果不支援，記錄在對照表中

#### 優先級 3：文件更新

7. **更新指南**：
   - 更新 Routing 表結構，對照實際欄位
   - 更新同步 API 的實作說明
   - 新增查詢 API 的使用說明

8. **更新對照表**：
   - 如果測試發現新的欄位，更新對照表
   - 記錄 Work Order Completion 的工時欄位（如果有的話）

