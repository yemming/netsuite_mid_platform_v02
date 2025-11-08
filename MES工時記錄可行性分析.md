# MES 系統寫入 Work Center、Routing 和工時記錄可行性分析

## 問題
從外部的 MES 系統要打資料進去 NetSuite：
1. **Work Center** - 記錄工作中心資訊
2. **Routing** - 記錄製程路由
3. **工時記錄** - 記錄生產工時

## 根據對照表的分析

### 1. Work Center（工作中心）

**現況**：
- ❌ **無法直接寫入 Work Center**
  - Work Center 是透過 Employee Group 實現的
  - `employeegroup` record type 不存在於 REST API 中
  - 無法透過 REST API 建立或更新 Work Center

**可以做什麼**：
- ✅ **可以讀取 Work Center 資訊**（透過 Routing Steps）
- ✅ **可以在中台建立 Work Center 表**（只讀，從 Routing Steps 同步）
- ⚠️ **Work Center 需要在 NetSuite UI 中手動建立**

**建議**：
- Work Center 作為「主檔資料」，應該在 NetSuite UI 中手動建立
- MES 系統不需要寫入 Work Center，只需要從中台查詢 Work Center ID

### 2. Routing（製程路由）

**現況**：
- ✅ **可以查詢 Routing**（權限已開啟）
- ⚠️ **需要測試是否可以建立/更新 Routing**

**可以做什麼**：
- ✅ **可以讀取 Routing 和 Routing Steps**
- ⚠️ **需要測試是否可以透過 REST API 建立/更新 `manufacturingrouting`**

**建議**：
- 如果 Routing 可以建立/更新，MES 系統可以建立/更新 Routing
- 如果不行，Routing 需要在 NetSuite UI 中手動建立

### 3. 工時記錄（Time Tracking）

**現況**：
根據 NetSuite 指南，有兩種方式記錄工時：

#### 方式 A: Work Order Completion（工單完工）
- **Record Type**: `workOrderCompletion`
- **用途**: 記錄工單完成數量
- **支援狀況**: ✅ 已在指南中確認

**Payload 範例**：
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
- ⚠️ 是否支援工時欄位（laborHours, machineHours）
- ⚠️ 是否支援 Work Center 關聯

#### 方式 B: Time Bill（時間記錄）
- **Record Type**: `timebill`
- **用途**: 記錄員工在特定任務上的工時
- **支援狀況**: ⚠️ 需要測試

**Payload 範例**：
```json
{
  "recordType": "timebill",
  "employee": { "id": "123" },
  "hours": 8,
  "date": "2025-11-05",
  "workOrder": { "id": "88888" },  // 需要確認是否支援
  "workCenter": { "id": "2266" },  // 需要確認是否支援
  "memo": "生產任務"
}
```

**需要確認**：
- ⚠️ 是否支援 Work Order 關聯
- ⚠️ 是否支援 Work Center 關聯
- ⚠️ 是否支援 Routing Step 關聯

## 實作建議

### 方案 1: 透過 Work Order Completion 記錄工時（推薦）

**流程**：
1. MES 系統建立 Work Order（已支援）
2. MES 系統透過 Work Order Completion 記錄：
   - 完成數量
   - 報廢數量
   - **工時（如果支援）**
   - **Work Center（從 Routing Steps 取得）**

**優點**：
- 與工單流程整合
- 已在指南中確認支援

**缺點**：
- 需要確認是否支援工時欄位

### 方案 2: 透過 Time Bill 記錄工時（不推薦）

**流程**：
1. MES 系統建立 Work Order
2. MES 系統透過 Time Bill 記錄工時：
   - 記錄員工、時間、工時
   - **無法直接關聯到 Work Order**（需要透過 memo 或其他方式間接關聯）

**優點**：
- 專門用於工時記錄
- 可以記錄詳細的工時資訊

**缺點**：
- ❌ **不支援 Work Order 關聯**（無法直接關聯到工單）
- ❌ **不支援 Work Center 關聯**
- 無法自動關聯到生產流程

### 方案 3: 透過 Work Order Completion 記錄工時（推薦）

**流程**：
1. MES 系統建立 Work Order
2. MES 系統透過 Work Order Completion 記錄：
   - 完成數量
   - 報廢數量
   - **工時（如果 Work Order Completion 支援）**
   - **Work Center（從 Routing Steps 取得，記錄在 memo 或其他欄位）**

**優點**：
- 與工單流程整合
- 一次 API 呼叫完成所有記錄

**缺點**：
- 需要確認 Work Order Completion 是否支援工時欄位
- 如果不行，可能需要透過其他方式記錄工時

## 中台需要實作的 API

### 1. 建立/更新 Routing API（如果支援）
```typescript
POST /api/create-manufacturing-routing
{
  name: "AAA Routing",
  billOfMaterials: { id: "1" },
  location: { id: "10" },
  routingSteps: [
    {
      operationSequence: 1,
      operationName: "包裝",
      manufacturingWorkCenter: { id: "2266" },
      setupTime: 10,
      runRate: 2
    }
  ]
}
```

### 2. Work Order Completion API（記錄工時）
```typescript
POST /api/work-order-completion
{
  workOrderId: "88888",
  completedQuantity: 98,
  scrapQuantity: 2,
  laborHours: 8,  // 需要確認是否支援
  machineHours: 2,  // 需要確認是否支援
  workCenterId: "2266",  // 從 Routing Steps 取得
  routingStepId: "1"  // 從 Routing Steps 取得
}
```

### 3. Time Bill API（記錄詳細工時）
```typescript
POST /api/time-bill
{
  workOrderId: "88888",
  workCenterId: "2266",
  employeeId: "123",
  hours: 8,
  date: "2025-11-05",
  memo: "生產任務"
}
```

## 下一步行動

1. **測試 Work Order Completion 的欄位結構**
   - 檢查是否支援工時欄位
   - 檢查是否支援 Work Center 關聯

2. **測試 Time Bill 的欄位結構**
   - 檢查是否支援 Work Order 關聯
   - 檢查是否支援 Work Center 關聯

3. **測試是否可以建立/更新 Manufacturing Routing**
   - 如果可以，實作建立/更新 API
   - 如果不行，說明需要在 NetSuite UI 中手動建立

4. **確認工時記錄的完整流程**
   - 從 MES 系統接收工時資料
   - 轉換為 NetSuite API 格式
   - 寫入 NetSuite

