# NetSuite 風格 Visual ETL & SQL Generator - 完整指南

> **建立日期**: 2025-01-17  
> **版本**: 1.0.0  
> **作者**: AI 助手 + 開發團隊

---

## 📖 專案概述

這是一個完全按照 **NetSuite Import Assistant** 風格打造的 Web 版視覺化 ETL 映射工具。透過直觀的拖拉界面，讓使用者輕鬆完成「CSV 資料」到「資料庫表」的映射，並自動產生 SQL 語句執行匯入。

### 核心特色

✅ **NetSuite 風格 UI**：嚴格復刻 Oracle NetSuite Import Assistant 的介面設計  
✅ **三欄式拖拉界面**：左欄（CSV 欄位）、中欄（映射關係）、右欄（目標欄位）  
✅ **智慧箭頭轉換**：點擊箭頭設定資料轉換規則（Direct Map, Default Value, VLOOKUP, Aggregate, SQL Expression）  
✅ **狀態鎖定機制**：已映射的欄位自動變灰，防止重複映射  
✅ **自動 SQL 生成**：根據映射配置自動產生 CREATE TABLE 或 UPSERT 語句  
✅ **型別推斷**：自動從 CSV 範例資料推斷欄位型別

---

## 🏗️ 系統架構

### 技術堆疊

| 層級 | 技術 |
|------|------|
| 前端框架 | Next.js 14 (App Router) + TypeScript |
| UI 元件庫 | Radix UI + shadcn/ui + Tailwind CSS |
| 拖拉套件 | HTML5 Drag & Drop API（原生） |
| 後端 API | Next.js API Routes |
| 資料庫 | Supabase (PostgreSQL) |
| 狀態管理 | React Hooks (useState) |

### 檔案結構

```
/app
  /api
    /csv-upload          # CSV 上傳和解析 API
      route.ts
    /generate-sql        # SQL 生成引擎 API
      route.ts
    /execute-etl         # ETL 執行 API
      route.ts
  /dashboard
    /etl-import          # ETL 主頁面
      page.tsx

/components
  /etl
    netsuite-style.css        # NetSuite 風格樣式表
    SourceFieldList.tsx       # 左欄：CSV 欄位列表
    TargetFieldList.tsx       # 右欄：目標欄位列表
    MappingCanvas.tsx         # 中欄：映射畫布
    TransformModal.tsx        # 智慧箭頭：轉換規則 Modal
```

---

## 🎨 UI 設計規範

### NetSuite 風格配色

```css
--ns-blue-dark: #2D4466;      /* 深藍色標題背景 */
--ns-blue-light: #E0E6F0;     /* 淡藍色漸層 */
--ns-blue-header: #F0F2F5;    /* 淺灰藍背景 */
--ns-text-dark: #333333;      /* 深灰文字 */
--ns-border: #CCCCCC;         /* 邊框顏色 */
--ns-arrow-blue: #4A90E2;     /* 箭頭藍色 */
```

### 字體設定

- **字體家族**: Arial, Helvetica, sans-serif
- **字級**: 12px-13px（高密度資訊展示）
- **行高**: 1.5

### 佈局設計

#### 三欄式佈局 (Grid Layout)

```css
.ns-three-column {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 16px;
  height: calc(100vh - 200px);
}
```

- **左欄（300px）**: CSV 欄位列表，顯示欄位名稱、型別、範例值
- **中欄（1fr）**: 映射畫布，顯示已建立的映射關係
- **右欄（300px）**: 目標欄位樹狀圖，可展開/收合表

---

## 🔧 核心功能說明

### 1. CSV 上傳和解析

**API 路徑**: `POST /api/csv-upload`

**功能**:
- 接收 CSV 檔案（支援引號包覆的欄位）
- 解析 Header 和範例資料（最多取 5 筆）
- 自動推斷資料型別（text, integer, numeric, boolean, date）
- 回傳欄位結構給前端

**請求範例**:
```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/csv-upload', {
  method: 'POST',
  body: formData,
});
```

**回應範例**:
```json
{
  "success": true,
  "data": {
    "fileName": "sales_data.csv",
    "totalRows": 100,
    "fields": [
      {
        "name": "customer_name",
        "displayName": "customer_name",
        "inferredType": "text",
        "sampleValues": ["Company A", "Company B"],
        "isMapped": false
      },
      {
        "name": "amount",
        "displayName": "amount",
        "inferredType": "numeric",
        "sampleValues": [1500.50, 2300.00],
        "isMapped": false
      }
    ]
  }
}
```

---

### 2. 欄位映射（拖拉邏輯）

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

// 當映射刪除後，恢復來源欄位狀態
setSourceFields(
  sourceFields.map((f) =>
    f.name === mapping.sourceField ? { ...f, isMapped: false } : f
  )
);
```

---

### 3. 智慧箭頭：轉換規則設定

**元件**: `<TransformModal />`

**功能**: 點擊中欄映射行的箭頭圖示（<=>），開啟 Modal 設定轉換規則

**支援的轉換類型**:

#### 3.1 Direct Map（直接映射）
- **說明**: 來源欄位的值直接複製到目標欄位
- **設定**: 無需額外設定
- **範例**: `csv.customer_name` → `db.customer_name`

#### 3.2 Default Value（預設值）
- **說明**: 當來源欄位為空時，填入預設值
- **設定**: 
  - `defaultValue`: 預設值（字串、數字或日期）
- **範例**: 若 `status` 為空，填入 `"Pending Fulfillment"`

#### 3.3 VLOOKUP（查表）
- **說明**: 使用來源值到另一個表查詢，返回指定欄位
- **設定**:
  - `lookupTable`: 查表名稱（例如：`ns_subsidiary`）
  - `lookupKey`: Join 欄位（例如：`id`）
  - `returnField`: 返回欄位（例如：`full_name`）
- **範例**: 用 Subsidiary ID 查找 Subsidiary Name
  ```sql
  -- 等同於 SQL:
  SELECT full_name FROM ns_subsidiary WHERE id = ${value}
  ```

#### 3.4 Aggregate（聚合函數）
- **說明**: 對多筆資料進行聚合計算
- **支援函數**: SUM, AVG, COUNT, MAX, MIN
- **設定**:
  - `aggregateFunction`: 聚合函數名稱
  - `groupBy`: 群組欄位（可選）
- **範例**: 計算每個客戶的訂單總金額
  ```sql
  SELECT customer_id, SUM(amount) FROM orders GROUP BY customer_id
  ```

#### 3.5 SQL Expression（自訂表達式）
- **說明**: 使用 SQL 表達式進行複雜轉換
- **設定**:
  - `expression`: SQL 表達式（使用 `${value}` 代表來源值）
- **常用範例**:
  - 字串組合: `CONCAT(${value}, '_suffix')`
  - 條件判斷: `CASE WHEN ${value} > 100 THEN 'High' ELSE 'Low' END`
  - 數學運算: `${value} * 1.1`
  - 日期格式: `TO_CHAR(${value}, 'YYYY-MM-DD')`

**視覺回饋**:
- 若映射有轉換規則（非 Direct Map），箭頭會變成藍色且右上角有藍點標記

---

### 4. SQL 自動生成

**API 路徑**: `POST /api/generate-sql`

**功能**:
- 檢查目標表是否存在
- **Scenario A**: 表不存在 → 生成 `CREATE TABLE` + 索引 + 觸發器
- **Scenario B**: 表已存在 → 生成 `ALTER TABLE`（新增欄位）+ `UPSERT` 語句

**請求範例**:
```json
{
  "targetTable": "sales_orders",
  "mappings": [
    {
      "sourceField": "customer_name",
      "targetField": "customer_name",
      "targetType": "text",
      "transformType": "direct"
    },
    {
      "sourceField": "amount",
      "targetField": "amount",
      "targetType": "numeric",
      "transformType": "direct"
    }
  ],
  "primaryKey": "external_id",
  "createIfNotExists": true
}
```

**生成的 SQL 範例（CREATE TABLE）**:
```sql
-- 自動生成的表結構
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  customer_name TEXT,
  amount NUMERIC(18, 2)
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_sales_orders_external_id ON sales_orders(external_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_sync_timestamp ON sales_orders(sync_timestamp DESC);

-- 建立更新觸發器
CREATE OR REPLACE FUNCTION update_sales_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sales_orders_updated_at
  BEFORE UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_orders_updated_at();
```

**生成的 SQL 範例（UPSERT）**:
```sql
-- UPSERT 語句（使用參數化查詢）
INSERT INTO sales_orders (
  customer_name,
  amount,
  sync_timestamp
)
VALUES (
  $1,
  $2,
  NOW()
)
ON CONFLICT (external_id) 
DO UPDATE SET
    customer_name = EXCLUDED.customer_name,
    amount = EXCLUDED.amount,
    updated_at = NOW(),
    sync_timestamp = NOW();
```

---

### 5. ETL 執行

**API 路徑**: `POST /api/execute-etl`

**功能**:
- 根據映射規則轉換 CSV 資料
- 執行型別轉換（text → numeric, boolean 等）
- 套用轉換規則（Default Value, SQL Expression 等）
- 使用 Supabase Client 執行 INSERT 或 UPSERT

**資料轉換流程**:

```typescript
csvData.map((row) => {
  const transformed: Record<string, any> = {
    sync_timestamp: new Date().toISOString(),
  };

  mappings.forEach((mapping) => {
    const sourceValue = row[mapping.sourceField];
    const transformedValue = transformValue(
      sourceValue,
      mapping.transform,
      mapping.targetType
    );
    transformed[mapping.targetField] = transformedValue;
  });

  return transformed;
});
```

**型別轉換邏輯**:

| 來源值 | 目標型別 | 轉換結果 |
|--------|---------|---------|
| `"123"` | integer | `123` |
| `"45.67"` | numeric | `45.67` |
| `"T"` / `"true"` | boolean | `true` |
| `"F"` / `"false"` | boolean | `false` |
| `"2025-01-17"` | timestamp | `"2025-01-17T00:00:00.000Z"` |
| `null` / `""` | any | `null`（或 defaultValue） |

---

## 📊 使用流程

### 步驟 1: 上傳 CSV 檔案

1. 點擊「選擇檔案」按鈕
2. 選擇 CSV 檔案（支援逗號分隔，引號包覆）
3. 系統自動解析欄位和型別
4. 進入步驟 2

### 步驟 2: 欄位映射

1. **設定目標表**:
   - 輸入目標表名稱（例如：`sales_orders`）
   - 輸入主鍵欄位（可選，例如：`external_id`）

2. **建立映射**:
   - 方法 1（拖拉）: 從左欄拖曳 CSV 欄位 + 從右欄拖曳目標欄位到中欄
   - 方法 2（點擊）: 點擊左欄欄位 → 點擊右欄欄位（自動建立映射）

3. **設定轉換規則**（可選）:
   - 點擊中欄映射行的箭頭（<=>）
   - 選擇轉換類型（Direct Map / Default Value / VLOOKUP / Aggregate / SQL Expression）
   - 填入必要參數
   - 儲存

4. **驗證映射**:
   - 左欄已映射的欄位會變灰
   - 中欄顯示映射數量和轉換規則數量
   - 確認所有必要欄位都已映射

5. 點擊「下一步：生成 SQL」

### 步驟 3: 檢視 SQL

1. 系統顯示自動生成的 SQL 語句
2. 檢查 SQL 模式（CREATE TABLE 或 UPSERT）
3. 可選：下載 SQL 檔案
4. 點擊「執行匯入」或「返回修改」

### 步驟 4: 執行匯入

1. 系統執行資料轉換
2. 執行 SQL（建表或更新）
3. 匯入資料到 Supabase
4. 顯示成功訊息和匯入筆數

### 步驟 5: 完成

- 顯示匯入結果（成功匯入 XX 筆資料）
- 選項：「再匯入一次」或「返回儀表板」

---

## 🎯 最佳實踐

### 1. CSV 檔案準備

✅ **建議做法**:
- 第一行必須是 Header（欄位名稱）
- 欄位名稱使用英文和底線（例如：`customer_name`）
- 日期格式使用 ISO 8601（`YYYY-MM-DD` 或 `YYYY-MM-DD HH:MM:SS`）
- Boolean 使用 `T`/`F` 或 `true`/`false`
- 數字不要包含貨幣符號（`$1000` → `1000`）

❌ **避免做法**:
- 空白的 Header
- 混用不同的日期格式
- 數字欄位包含文字（例如：`"1,000"` 應該改為 `1000`）

### 2. 映射策略

- **必填欄位優先**: 先映射目標表的必填欄位（標記 *）
- **主鍵設定**: 若目標表已存在，務必設定主鍵以啟用 UPSERT 模式
- **型別匹配**: 盡量讓來源型別與目標型別一致（減少轉換錯誤）
- **轉換規則**: 只在必要時使用複雜轉換（VLOOKUP, Aggregate）

### 3. 效能優化

- **分批匯入**: 若 CSV 超過 10,000 筆，建議分批上傳
- **索引設計**: 主鍵欄位自動建立索引，常查詢的欄位也應建立索引
- **避免過度轉換**: 儘量在 CSV 預處理階段完成資料清理，減少即時轉換

---

## 🐛 常見問題排查

### Q1: CSV 上傳失敗

**可能原因**:
- 檔案不是 CSV 格式
- 檔案編碼不是 UTF-8
- 檔案過大（超過 10MB）

**解決方案**:
- 確認檔案副檔名為 `.csv`
- 使用 Excel 或 Numbers 另存為 CSV（UTF-8）
- 將大檔案分割為多個小檔案

### Q2: 型別推斷錯誤

**可能原因**:
- 範例資料不足（只有 1-2 筆）
- 資料格式不一致

**解決方案**:
- 確保 CSV 至少有 3 筆資料
- 手動在映射後調整型別（點擊箭頭 → 選擇正確型別）

### Q3: UPSERT 失敗

**可能原因**:
- 未設定主鍵
- 主鍵欄位在 CSV 中不存在
- 主鍵重複

**解決方案**:
- 確認目標表有主鍵或唯一約束
- 確認 CSV 包含主鍵欄位
- 檢查 CSV 是否有重複的主鍵值

### Q4: VLOOKUP 找不到資料

**可能原因**:
- 查表名稱錯誤
- 查詢鍵不匹配
- 目標表沒有對應的資料

**解決方案**:
- 確認查表名稱正確（區分大小寫）
- 確認查詢鍵型別一致（例如：都是 integer）
- 先執行手動查詢確認資料存在

---

## 🚀 進階功能（未來規劃）

以下功能目前尚未實作，列為未來開發方向：

### 1. 映射範本儲存
- 將常用的映射配置儲存為範本
- 下次匯入相同格式的 CSV 可直接套用

### 2. 資料驗證規則
- 在匯入前驗證資料（例如：Email 格式、數值範圍）
- 顯示驗證錯誤，允許修正後重試

### 3. 批次處理
- 支援上傳多個 CSV 檔案，自動依序處理
- 顯示批次進度條

### 4. 即時預覽
- 在映射階段顯示轉換後的資料預覽
- 讓使用者確認轉換邏輯正確

### 5. 錯誤復原
- 若匯入失敗，自動建立復原點
- 可一鍵回滾到匯入前的狀態

---

## 📚 相關文件

- [NetSuite中臺建置完全指南.md](../NetSuite中臺建置完全指南.md) - 專案整體架構
- [NS_CSV_ETL工具克隆版.md](../NS_CSV_ETL工具克隆版.md) - 原始需求文件
- [field-mapping-setup-guide.md](./field-mapping-setup-guide.md) - 欄位映射設定指南

---

## 🤝 開發團隊

- **專案經理**: [你的名字]
- **前端開發**: AI 助手 + 開發團隊
- **後端開發**: AI 助手 + 開發團隊
- **UI/UX 設計**: 參考 Oracle NetSuite Import Assistant

---

## 📝 變更日誌

### v1.0.0 (2025-01-17)
- ✅ 建立 CSV 上傳和解析 API
- ✅ 建立 NetSuite 風格三欄式映射界面
- ✅ 實作拖拉邏輯和狀態鎖定
- ✅ 建立智慧箭頭 Modal（5 種轉換規則）
- ✅ 建立 SQL 生成引擎（CREATE TABLE / UPSERT）
- ✅ 建立 ETL 執行 API
- ✅ 整合所有功能到主頁面
- ✅ 添加到 Sidebar 導航

---

**文檔維護**: 此文件隨專案持續更新，歡迎團隊成員補充和修正。

