# MES 系統寫入 Work Center、Routing 和工時記錄 - 可行性總結

## 問題

從外部的 MES 系統要打資料進去 NetSuite：
1. **Work Center** - 記錄工作中心資訊
2. **Routing** - 記錄製程路由  
3. **工時記錄** - 記錄生產工時

## 根據對照表的分析結果

### ❌ 無法做到：寫入 Work Center

**原因**：
- Work Center 是透過 Employee Group 實現的
- `employeegroup` record type 不存在於 REST API 中
- 無法透過 REST API 建立或更新 Work Center

**解決方案**：
- ✅ Work Center 需要在 **NetSuite UI 中手動建立**
- ✅ MES 系統可以**從中台查詢 Work Center ID**（透過 Routing Steps 取得）
- ✅ 中台可以建立 Work Center 表（只讀，從 Routing Steps 同步）

### ❌ 無法做到：寫入 Routing

**原因**：
- 測試建立 Routing 失敗：`Invalid value for the resource or sub-resource field 'location'`
- 測試更新 Routing 失敗：JSON 錯誤

**解決方案**：
- ✅ Routing 需要在 **NetSuite UI 中手動建立**
- ✅ MES 系統可以**從中台查詢 Routing ID**
- ✅ 中台可以建立 Routing 表（只讀，同步 NetSuite 資料）

### ✅ 可以做到：記錄工時

**方式**：透過 **Work Order Completion**（推薦）

**根據指南中的範例**：
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

**需要確認**：
- ⚠️ 是否支援工時欄位（laborHours, machineHours, laborTime, machineTime）
- ⚠️ 是否支援 Work Center 關聯欄位

**建議**：
- 如果 Work Order Completion 支援工時欄位，可以直接記錄
- 如果不支援，可以透過 `memo` 欄位記錄工時資訊
- Work Center 資訊可以從 Routing Steps 取得，記錄在 memo 中

## 實際可以做到的事情

### ✅ 可以做到

1. **讀取 Work Center 資訊**
   - 透過 Routing Steps 取得 Work Center ID 和名稱
   - 可以建立 Work Center 表（只讀）

2. **讀取 Routing 資訊**
   - 可以查詢所有 Routing
   - 可以查詢 Routing Steps
   - 可以建立 Routing 表（只讀）

3. **記錄工時**
   - 透過 Work Order Completion 記錄完成數量
   - ⚠️ 需要確認是否支援工時欄位（laborHours, machineHours）

### ❌ 無法做到

1. **寫入 Work Center**
   - 需要在 NetSuite UI 中手動建立

2. **寫入 Routing**
   - 需要在 NetSuite UI 中手動建立

3. **透過 Time Bill 關聯 Work Order**
   - Time Bill 不支援 Work Order 關聯

## 建議的工作流程

### 前置作業（在 NetSuite UI 中手動建立）
1. **建立 Work Centers**（Employee Groups，標記為 Manufacturing Work Center）
2. **建立 Routing**（包含 Routing Steps 和 Work Center 關聯）

### MES 系統流程
1. **查詢 Work Center ID**（從中台取得，來源是 Routing Steps）
2. **查詢 Routing ID**（從中台取得）
3. **建立 Work Order**（已支援，根據指南）
4. **記錄工時**（透過 Work Order Completion）
   - 記錄完成數量
   - 記錄報廢數量
   - **記錄工時**（如果 Work Order Completion 支援工時欄位）
   - **記錄 Work Center 資訊**（在 memo 中，或透過其他欄位）

## 中台需要實作的 API

### 1. Work Order Completion API

```typescript
POST /api/work-order-completion
{
  workOrderId: "88888",
  completedQuantity: 98,
  scrapQuantity: 2,
  laborHours: 8,  // 需要確認是否支援
  machineHours: 2,  // 需要確認是否支援
  workCenterId: "2266",  // 從 Routing Steps 取得
  memo: "包裝線 A 完工，Work Center: Packing Machine Group, 工時: 8小時"
}
```

### 2. 查詢 Work Center API

```typescript
GET /api/work-centers
// 從 Routing Steps 中取得所有唯一的 Work Centers
```

### 3. 查詢 Routing API

```typescript
GET /api/routings
// 返回所有 Routing 和 Routing Steps
```

## 結論

**對照表中可以做到的事情**：
- ✅ **可以讀取 Work Center 和 Routing**（透過 API 查詢）
- ✅ **可以記錄工時**（透過 Work Order Completion）
- ❌ **無法寫入 Work Center 和 Routing**（需要在 NetSuite UI 中手動建立）

**建議**：
- Work Center 和 Routing 作為「主檔資料」，在 NetSuite UI 中手動建立一次
- MES 系統只需要從中台查詢這些主檔的 ID
- 工時記錄透過 Work Order Completion 完成

**下一步**：
- 測試 Work Order Completion 是否支援工時欄位
- 如果支援，實作完整的工時記錄 API
- 如果不支援，實作透過 memo 欄位記錄工時的方案

