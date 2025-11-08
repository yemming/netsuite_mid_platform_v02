# Accounting Period 同步指南

## 📋 概述

由於需要手動開傳票（Journal Entry）功能，**Accounting Period（會計期間）是必要的**。在建立 Journal Entry 時，必須指定 `postingPeriod` 欄位。

---

## 🔍 檢查清單

### 1. NetSuite 權限檢查

請確認您的 NetSuite 角色具有以下權限：

#### 基本權限
- ✅ **Lists > Accounting Periods** - 查看會計期間列表
- ✅ **Transactions > Make Journal Entry** - 建立傳票
- ✅ **Transactions > Approve Journal Entry** - 批准傳票（如果需要的話）

#### API 權限
- ✅ **REST Web 服務** - 允許透過 REST API 存取
- ✅ **使用存取令牌登入** - OAuth 認證
- ✅ **SuiteAnalytics 工作簿** - 某些查詢可能需要

#### 檢查步驟
1. 登入 NetSuite
2. 前往 **設定** > **使用者/角色** > **管理角色**
3. 選擇您使用的角色
4. 檢查 **Lists** 標籤下的 **Accounting Periods** 權限
5. 檢查 **Setup** 標籤下的 **REST Web 服務** 權限

---

## 🛠️ 查詢方法

### 方法 1: REST API - Record List（目前使用的方法）

```typescript
// 目前的實作方式
const result = await netsuite.getRecordList('accountingperiod', {
  fetchAll: true,
  limit: 1000,
});
```

**可能的問題**：
- 如果返回 404 或 400 錯誤，可能是：
  1. 權限不足
  2. Record type 名稱不正確
  3. 需要使用 Search API 而不是 List API

### 方法 2: REST API - Search（替代方案）

某些 Record Type 可能不支援直接 List，需要改用 Search API：

```typescript
// 使用 Search API
const searchBody = {
  basic: []  // 空查詢 = 查詢所有記錄
};

const result = await netsuite.request(
  '/services/rest/record/v1/accountingperiod/search',
  'POST',
  searchBody
);
```

### 方法 3: REST API - Saved Search

如果直接查詢有問題，可以：
1. 在 NetSuite UI 中建立一個 Saved Search
2. 透過 API 查詢該 Saved Search 的結果

```typescript
// 查詢 Saved Search
const result = await netsuite.request(
  '/services/rest/record/v1/accountingperiod/search',
  'POST',
  {
    savedSearchId: 'YOUR_SAVED_SEARCH_ID'
  }
);
```

### 方法 4: SuiteTalk SOAP API

如果 REST API 不支援，可以使用 SuiteTalk SOAP API：

```xml
<soap:Envelope>
  <soap:Body>
    <search>
      <searchRecord xsi:type="q1:AccountingPeriodSearch">
        <!-- 搜尋條件 -->
      </searchRecord>
    </search>
  </soap:Body>
</soap:Envelope>
```

---

## 🔧 除錯步驟

### Step 1: 檢查權限

```bash
# 在 NetSuite UI 中測試
# 1. 前往 Lists > Accounting > Accounting Periods
# 2. 確認可以看到會計期間列表
# 3. 如果看不到，需要請管理員開權限
```

### Step 2: 測試 API 連線

```bash
# 使用測試 API 端點
curl -X POST http://localhost:3000/api/test-rest-api-sync \
  -H "Content-Type: application/json"
```

### Step 3: 檢查實際錯誤訊息

查看錯誤訊息的詳細內容：
- `404 Not Found` - Record type 不存在或權限不足
- `400 Bad Request` - 查詢語法錯誤
- `401 Unauthorized` - 認證問題
- `403 Forbidden` - 權限不足

### Step 4: 驗證 Record Type 是否存在

```bash
# 檢查 metadata catalog
curl -X GET http://localhost:3000/api/check-record-types \
  -H "Content-Type: application/json"
```

確認 `accountingperiod` 是否在列表中。

---

## 📝 實際欄位對照

根據 NetSuite REST API 文檔，Accounting Period 的欄位可能包括：

| 欄位名稱 | 類型 | 說明 |
|---------|------|------|
| `id` | INTEGER | Internal ID |
| `periodName` 或 `name` | VARCHAR | 期間名稱 |
| `startDate` | DATE | 開始日期 |
| `endDate` | DATE | 結束日期 |
| `isQuarter` | BOOLEAN | 是否為季度 |
| `isYear` | BOOLEAN | 是否為年度 |
| `isAdjustment` | BOOLEAN | 是否為調整期間 |
| `isClosed` | BOOLEAN | 是否已關閉 |
| `isLocked` | BOOLEAN | 是否已鎖定 |
| `parent` | INTEGER | 父期間 ID（如果是子期間） |

---

## 🎯 建議的解決方案

### 方案 A: 如果權限問題

1. 請 NetSuite 管理員開啟權限：
   - Lists > Accounting Periods
   - REST Web 服務
2. 重新測試 API

### 方案 B: 如果 API 方法問題

1. 嘗試使用 Search API 而不是 List API
2. 或建立 Saved Search 後透過 API 查詢
3. 或使用 SuiteTalk SOAP API

### 方案 C: 如果 Record Type 不存在

1. 檢查 NetSuite 版本是否支援 Accounting Period REST API
2. 某些 NetSuite 版本可能不支援此 Record Type
3. 考慮使用 SuiteQL（如果支援）或其他查詢方式

---

## 📚 參考資源

- [NetSuite REST API 文檔](https://docs.oracle.com/cloud/latest/netsuitecs_gs/NSTRF/NSTRF.pdf)
- [NetSuite 權限設定指南](https://docs.oracle.com/cloud/latest/netsuitecs_gs/NSTUG/NSTUG.pdf)
- NetSuite 支援團隊（如果以上方法都無法解決）

---

## ✅ 完成檢查後

一旦成功取得 Accounting Period 資料，請：

1. 確認資料結構正確
2. 更新同步 API 的欄位映射
3. 測試 Journal Entry 建立功能，確認 `postingPeriod` 欄位可以正確填入

