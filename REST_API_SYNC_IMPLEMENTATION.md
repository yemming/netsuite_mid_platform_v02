# REST API 同步實作說明

## 概述

根據 `NetSuite_實際欄位對照表.md`，有三個表無法使用 SuiteQL 查詢：

1. **Accounting Period（會計期間）** - `accountingperiod`
2. **BOM（配方表頭）** - `bom`
3. **Work Center（工作中心）** - `workcenter`

這些表已改用 NetSuite REST API 進行同步。

---

## 實作內容

### 1. NetSuite Client 擴充

在 `lib/netsuite-client.ts` 中新增了兩個通用方法：

- `getRecordList(recordType, params)` - 查詢記錄列表（支援分頁）
- `getRecord(recordType, recordId)` - 取得單一記錄詳細資訊

### 2. 同步 API 端點

#### 2.1 Accounting Periods
- **端點**: `POST /api/sync-accounting-periods`
- **檔案**: `app/api/sync-accounting-periods/route.ts`
- **功能**: 同步會計期間資料到 `ns_accounting_periods` 表

#### 2.2 Work Centers
- **端點**: `POST /api/sync-work-centers`
- **檔案**: `app/api/sync-work-centers/route.ts`
- **功能**: 同步工作中心資料到 `ns_work_centers` 表

#### 2.3 BOM Headers
- **端點**: `POST /api/sync-bom-headers`
- **檔案**: `app/api/sync-bom-headers/route.ts`
- **功能**: 同步配方表頭資料到 `ns_bom_headers` 表

#### 2.4 BOM Lines
- **端點**: `POST /api/sync-bom-lines`
- **檔案**: `app/api/sync-bom-lines/route.ts`
- **功能**: 同步配方明細資料到 `ns_bom_lines` 表
- **注意**: 此 API 會先獲取所有 BOM Headers，然後對每個 Header 獲取詳細資訊以提取 components

---

## 測試步驟

### 步驟 1: 測試 REST API 連線

首先測試 REST API 是否能正常取得資料：

```bash
# 測試 REST API 連線
curl -X POST http://localhost:3000/api/test-rest-api-sync \
  -H "Content-Type: application/json"
```

或在瀏覽器中訪問：
```
POST http://localhost:3000/api/test-rest-api-sync
```

這個測試會：
- 嘗試取得 Accounting Period 的樣本資料
- 嘗試取得 BOM 的樣本資料和詳細資訊
- 嘗試取得 Work Center 的樣本資料

### 步驟 2: 執行同步

#### 2.1 同步 Accounting Periods

```bash
curl -X POST http://localhost:3000/api/sync-accounting-periods \
  -H "Content-Type: application/json"
```

#### 2.2 同步 Work Centers

```bash
curl -X POST http://localhost:3000/api/sync-work-centers \
  -H "Content-Type: application/json"
```

#### 2.3 同步 BOM Headers

```bash
curl -X POST http://localhost:3000/api/sync-bom-headers \
  -H "Content-Type: application/json"
```

#### 2.4 同步 BOM Lines

**注意**: BOM Lines 需要先同步 BOM Headers，因為需要從 Header 中獲取詳細資訊。

```bash
curl -X POST http://localhost:3000/api/sync-bom-lines \
  -H "Content-Type: application/json"
```

---

## 資料結構對照

### Accounting Period

REST API 返回的欄位可能包括：
- `id` → `netsuite_internal_id`
- `periodName` 或 `name` → `period_name`
- `startDate` 或 `startdate` → `start_date`
- `endDate` 或 `enddate` → `end_date`
- `isQuarter` 或 `isquarter` → `is_quarter`
- `isYear` 或 `isyear` → `is_year`
- `isAdjustment` 或 `isadjust` → `is_adjustment`
- `isClosed` 或 `isclosed` → `is_closed`

### Work Center

REST API 返回的欄位可能包括：
- `id` → `netsuite_internal_id`
- `name` → `name`
- `location.id` 或 `location` → `location_id`
- `capacityPerHour` 或 `capacityperhour` → `capacity_per_hour`
- `costPerHour` 或 `costperhour` → `cost_per_hour`
- `isInactive` 或 `isinactive` → `is_active` (反轉)

### BOM Header

REST API 返回的欄位可能包括：
- `id` → `netsuite_internal_id`
- `name` → `name`
- `assemblyItem.id` 或 `assemblyitem` → `assembly_item_id`
- `revision` 或 `revisionnumber` → `revision`
- `isInactive` 或 `isinactive` → `is_active` (反轉)
- `effectiveDate` 或 `effectivedate` → `effective_date`
- `obsoleteDate` 或 `obsoletedate` → `obsolete_date`
- `memo` → `memo`

### BOM Lines

BOM Lines 需要從 BOM Header 的詳細資訊中提取。可能的欄位結構：
- `item.id` 或 `itemid` → `component_item_id`
- `quantity` 或 `quantityrequired` → `quantity`
- `unitOfMeasure` 或 `unitofmeasure` → `unit_of_measure`
- `componentYield` 或 `componentyield` → `component_yield`
- `isPhantom` 或 `isphantom` → `is_phantom`
- `supplyType` 或 `supplytype` → `supply_type`

---

## 注意事項

1. **欄位名稱差異**: NetSuite REST API 可能使用駝峰命名（如 `periodName`）或全小寫（如 `periodname`），代碼已處理兩種情況。

2. **布林值轉換**: NetSuite 可能返回 `true/false` 或 `'T'/'F'` 字串，代碼已處理兩種情況。

3. **BOM Lines 同步**: 
   - 需要先同步 BOM Headers
   - 會先刪除所有現有的 BOM Lines，然後重新插入
   - 如果 BOM Header 的詳細資訊無法取得，該 BOM 的 Lines 會被跳過

4. **分頁處理**: `getRecordList` 方法會自動處理分頁，取得所有記錄。

5. **錯誤處理**: 如果某個記錄無法取得詳細資訊，會記錄警告但繼續處理其他記錄。

---

## 下一步

1. **執行測試**: 先執行 `/api/test-rest-api-sync` 查看實際的資料結構
2. **調整映射**: 根據實際返回的資料結構調整欄位映射
3. **執行同步**: 依序執行各個同步 API
4. **驗證資料**: 檢查 Supabase 中的資料是否正確

---

## 疑難排解

### 問題：API 返回 401 或認證錯誤
- 檢查 NetSuite 環境變數是否正確設定
- 確認 Token 和 Consumer Key/Secret 是否有效

### 問題：找不到記錄
- 確認 NetSuite 中確實有該類型的記錄
- 檢查 record type 名稱是否正確（區分大小寫）

### 問題：欄位映射錯誤
- 先執行測試 API 查看實際的資料結構
- 根據實際結構調整 `transformFunction` 中的欄位映射

### 問題：BOM Lines 為空
- 確認 BOM Headers 已同步
- 檢查 BOM 詳細資訊中是否包含 `item`、`items`、`component` 或 `components` 欄位
- 查看實際的 BOM 詳細資訊結構

