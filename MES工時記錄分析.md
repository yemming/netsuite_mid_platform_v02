# MES 系統寫入 Work Center、Routing 和工時記錄分析

## 問題

從外部的 MES 系統要打資料進去 NetSuite：
1. **Work Center** - 記錄工作中心資訊
2. **Routing** - 記錄製程路由
3. **工時記錄** - 記錄生產工時

## 現況分析

### 1. Work Center（工作中心）

**根據對照表的發現**：
- ❌ **無法直接寫入 Work Center**
  - Work Center 是透過 Employee Group 實現的
  - `employeegroup` record type 不存在於 REST API 中
  - 無法透過 REST API 建立或更新 Work Center

**建議方案**：
- ⚠️ **Work Center 需要在 NetSuite UI 中手動建立**
- ✅ **可以透過 Routing Steps 讀取 Work Center 資訊**
- ✅ **Work Center 資訊可以儲存在中台的 Work Center 表中（只讀，不寫入）**

### 2. Routing（製程路由）

**根據對照表的發現**：
- ✅ **可以查詢 Routing**（需要權限）
- ⚠️ **需要確認是否可以建立/更新 Routing**

**建議方案**：
- 需要測試是否可以透過 REST API 建立或更新 `manufacturingrouting` 記錄
- 如果可以，MES 系統可以建立/更新 Routing

### 3. 工時記錄（Time Tracking）

**根據 NetSuite 指南和搜尋結果**：

#### 方案 1: Work Order Completion（工單完工）
- **Record Type**: `workOrderCompletion`
- **用途**: 記錄工單完成數量，同時可以記錄工時
- **已在指南中確認支援**

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

#### 方案 2: Time Bill（時間記錄）
- **Record Type**: `timebill`
- **用途**: 記錄員工在特定任務上的工時
- **需要確認是否支援 Work Order 關聯**

```json
{
  "recordType": "timebill",
  "employee": { "id": "123" },
  "hours": 8,
  "date": "2025-11-05",
  "workOrder": { "id": "88888" },  // 需要確認是否支援
  "memo": "生產任務"
}
```

#### 方案 3: Manufacturing Time Tracking（製造工時追蹤）
- 可能需要特定的 record type
- 需要查詢 NetSuite API 文件

## 建議的實作方案

### 方案 A: 透過 Work Order Completion 記錄工時

**流程**：
1. MES 系統建立 Work Order（已支援）
2. MES 系統記錄生產進度，透過 Work Order Completion 記錄：
   - 完成數量
   - 報廢數量
   - **工時（如果 Work Order Completion 支援）**

**優點**：
- 已在指南中確認支援
- 與工單流程整合

**缺點**：
- 需要確認 Work Order Completion 是否支援工時欄位

### 方案 B: 透過 Time Bill 記錄工時

**流程**：
1. MES 系統建立 Work Order
2. MES 系統透過 Time Bill 記錄工時：
   - 關聯到 Work Order
   - 記錄員工、時間、工時

**優點**：
- 專門用於工時記錄
- 可以記錄詳細的工時資訊

**缺點**：
- 需要確認 Time Bill 是否支援 Work Order 關聯
- 需要確認是否支援 Work Center 關聯

### 方案 C: 透過 Routing Steps 記錄工時

**流程**：
1. 從 Routing Steps 中取得 Work Center 資訊
2. 在 Work Order Completion 或 Time Bill 中記錄：
   - Work Center ID（從 Routing Steps 取得）
   - 工時
   - 完成數量

**優點**：
- 可以關聯到 Routing 和 Work Center

**缺點**：
- 需要確認 API 是否支援這些關聯欄位

## 下一步行動

1. **測試 Work Order Completion 是否支援工時欄位**
2. **測試 Time Bill 是否支援 Work Order 和 Work Center 關聯**
3. **測試是否可以建立/更新 Manufacturing Routing**
4. **確認工時記錄的完整欄位結構**

## 中台需要支援的 API

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

### 2. 記錄工時 API
```typescript
POST /api/record-manufacturing-time
{
  workOrderId: "88888",
  workCenterId: "2266",  // 從 Routing Steps 取得
  employeeId: "123",
  hours: 8,
  date: "2025-11-05",
  completedQuantity: 98
}
```

### 3. Work Order Completion API（包含工時）
```typescript
POST /api/work-order-completion
{
  workOrderId: "88888",
  completedQuantity: 98,
  scrapQuantity: 2,
  laborHours: 8,  // 需要確認是否支援
  machineHours: 2,  // 需要確認是否支援
  workCenterId: "2266"
}
```

