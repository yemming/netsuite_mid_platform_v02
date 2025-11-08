# MES 系統寫入 Work Center、Routing 和工時記錄 - 完整可行性分析

## 問題
從外部的 MES 系統要打資料進去 NetSuite：
1. **Work Center** - 記錄工作中心資訊
2. **Routing** - 記錄製程路由
3. **工時記錄** - 記錄生產工時

## 根據對照表的分析結果

### 1. Work Center（工作中心）

**現況**：
- ❌ **無法直接寫入 Work Center**
  - Work Center 是透過 Employee Group 實現的
  - `employeegroup` record type 不存在於 REST API 中
  - 無法透過 REST API 建立或更新 Work Center

**可以做什麼**：
- ✅ **可以讀取 Work Center 資訊**（透過 Routing Steps）
- ✅ **可以在中台建立 Work Center 表**（只讀，從 Routing Steps 同步）
- ✅ **Work Center ID 可以從 Routing Steps 中取得**（例如：ID 2266, "Packing Machine Group"）

**建議**：
- **Work Center 需要在 NetSuite UI 中手動建立**
- MES 系統不需要寫入 Work Center，只需要從中台查詢 Work Center ID
- 中台可以透過同步 Routing Steps 來取得所有 Work Center 資訊

### 2. Routing（製程路由）

**現況**：
- ✅ **可以查詢 Routing**（權限已開啟）
- ❌ **無法建立/更新 Routing**（測試失敗）
  - 建立失敗：`Invalid value for the resource or sub-resource field 'location'`
  - 更新失敗：JSON 錯誤

**可以做什麼**：
- ✅ **可以讀取 Routing 和 Routing Steps**
- ✅ **可以查詢 Routing 列表**
- ❌ **無法透過 REST API 建立/更新 Routing**

**建議**：
- **Routing 需要在 NetSuite UI 中手動建立**
- MES 系統只需要從中台查詢 Routing ID，不需要寫入
- 中台可以同步 Routing 和 Routing Steps 到本地表

### 3. 工時記錄（Time Tracking）

**實際測試結果**：

#### 方式 A: Work Order Completion（工單完工）
- ✅ **Record Type 存在**：`workOrderCompletion`
- ⚠️ **需要測試是否支援工時欄位**

**Payload 範例**（根據指南）：
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

#### 方式 B: Time Bill（時間記錄）
- ✅ **Record Type 存在**：`timebill`
- ✅ **可以查詢**（找到 3 筆資料）
- ❌ **不支援 Work Order 關聯**（欄位中沒有 workOrder 相關欄位）

**實際欄位結構**（根據測試結果）：
```typescript
{
  employee: { id: "6", refName: "Dale Muscat" },
  hours: "8:00",  // 格式是 "時:分"
  tranDate: "2024-10-17",
  customer: { id: "23", refName: "Bay Media Research : Floor Sanding" },
  item: { id: "4", refName: "HOME/OFFICE DESIGN : Living Room Design Service" },
  department: { id: "1", refName: "Installation/Fitout" },
  memo: "Software Design",
  // ❌ 沒有 workOrder 欄位
  // ❌ 沒有 workCenter 欄位
}
```

**限制**：
- ❌ **不支援 Work Order 關聯**（無法直接關聯到工單）
- ❌ **不支援 Work Center 關聯**
- ⚠️ 可能可以透過 `memo` 欄位間接記錄 Work Order 編號，但不是標準做法

## 實作建議

### 推薦方案：透過 Work Order Completion 記錄工時

**流程**：
1. **MES 系統建立 Work Order**（已支援，根據指南）
2. **MES 系統透過 Work Order Completion 記錄**：
   - 完成數量（`completedQuantity`）
   - 報廢數量（`scrapQuantity`）
   - **工時（如果 Work Order Completion 支援工時欄位）**
   - **Work Center 資訊（記錄在 memo 中，或透過其他欄位）**

**優點**：
- ✅ 與工單流程整合
- ✅ 已在指南中確認支援
- ✅ 一次 API 呼叫完成所有記錄

**缺點**：
- ⚠️ 需要確認 Work Order Completion 是否支援工時欄位
- ⚠️ 如果不行，Work Center 資訊可能需要記錄在 memo 中

### 替代方案：透過 Time Bill 記錄工時（不推薦）

**流程**：
1. MES 系統建立 Work Order
2. MES 系統透過 Time Bill 記錄工時：
   - 記錄員工、時間、工時
   - **無法直接關聯到 Work Order**（需要透過 memo 間接關聯）

**優點**：
- ✅ 專門用於工時記錄
- ✅ 可以記錄詳細的工時資訊

**缺點**：
- ❌ **不支援 Work Order 關聯**（無法直接關聯到工單）
- ❌ **不支援 Work Center 關聯**
- 無法自動關聯到生產流程
- 需要額外的邏輯來關聯 Work Order

## 中台需要實作的 API

### 1. Work Order Completion API（記錄工時）

```typescript
POST /api/work-order-completion
{
  workOrderId: "88888",
  completedQuantity: 98,
  scrapQuantity: 2,
  laborHours: 8,  // 需要確認是否支援
  machineHours: 2,  // 需要確認是否支援
  workCenterId: "2266",  // 從 Routing Steps 取得
  routingStepId: "1",  // 從 Routing Steps 取得
  memo: "包裝線 A 完工，Work Center: Packing Machine Group"
}
```

### 2. 查詢 Work Center API（從 Routing Steps 取得）

```typescript
GET /api/work-centers
// 從 Routing Steps 中取得所有唯一的 Work Centers
// 返回：
// [
//   { id: "2266", name: "Packing Machine Group" },
//   ...
// ]
```

### 3. 查詢 Routing API（已支援）

```typescript
GET /api/routings
// 返回所有 Routing 和 Routing Steps
```

## 總結：可以做到的事情

### ✅ 可以做到

1. **讀取 Work Center 資訊**
   - 透過 Routing Steps 取得 Work Center ID 和名稱
   - 可以建立 Work Center 表（只讀）

2. **讀取 Routing 資訊**
   - 可以查詢所有 Routing
   - 可以查詢 Routing Steps
   - 可以建立 Routing 表（只讀）

3. **記錄工時**（需要確認欄位）
   - 透過 Work Order Completion 記錄完成數量
   - **需要確認是否支援工時欄位**

### ❌ 無法做到

1. **寫入 Work Center**
   - Work Center 需要在 NetSuite UI 中手動建立

2. **寫入 Routing**
   - Routing 需要在 NetSuite UI 中手動建立

3. **透過 Time Bill 關聯 Work Order**
   - Time Bill 不支援 Work Order 關聯

## 建議的工作流程

### 前置作業（在 NetSuite UI 中手動建立）
1. **建立 Work Centers**（Employee Groups）
2. **建立 Routing**（包含 Routing Steps 和 Work Center 關聯）

### MES 系統流程
1. **查詢 Work Center ID**（從中台取得）
2. **查詢 Routing ID**（從中台取得）
3. **建立 Work Order**（已支援）
4. **記錄工時**（透過 Work Order Completion，需要確認是否支援工時欄位）

## 下一步行動

1. **測試 Work Order Completion 的完整欄位結構**
   - 檢查是否支援工時欄位（laborHours, machineHours 等）
   - 檢查是否支援 Work Center 關聯欄位

2. **如果 Work Order Completion 不支援工時欄位**
   - 考慮透過 memo 欄位記錄工時資訊
   - 或尋找其他方式記錄工時

3. **實作中台 API**
   - Work Order Completion API
   - Work Center 查詢 API（從 Routing Steps）
   - Routing 查詢 API

