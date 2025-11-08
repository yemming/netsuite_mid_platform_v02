# 建立測試 BOM 指引

## 目的

建立一個測試 BOM 來確認 NetSuite REST API 返回的欄位結構，以便正確同步 BOM 資料到 Supabase。

---

## 步驟 1: 建立 Assembly Item（組裝件）

### 路徑
```
Lists > Items > New > Assembly Item
```

### 必填欄位
1. **Item Name（物料名稱）** - 例如：`TEST-ASSEMBLY-001`
2. **Item ID（物料編號）** - 例如：`TEST-ASSEMBLY-001`
3. **Base Unit（基本單位）** - 例如：`Each` 或 `個`

### 建議設定
- **Display Name（顯示名稱）**：與 Item Name 相同
- **Costing Method（成本計算方法）**：Standard（標準成本）
- **Subsidiary（公司別）**：選擇您的主要公司別

### 完成後
點擊 **Save** 保存，記下建立的 Assembly Item 的 Internal ID。

---

## 步驟 2: 建立組件物料（Component Items）

### 說明
在建立 BOM 之前，需要先有至少一個組件物料（Component Item）。

### 路徑
```
Lists > Items > New > Inventory Item（或 Stock Item）
```

### 建立至少一個組件物料
- **Item Name**：例如 `TEST-COMPONENT-001`
- **Item ID**：例如 `TEST-COMPONENT-001`
- **Base Unit**：例如 `Each` 或 `個`

---

## 步驟 3: 建立 BOM（物料清單）

### 路徑
```
Lists > Bills of Materials > New
```

### 必填欄位

#### 基本資訊
1. **Assembly Item（組裝件）** - 選擇步驟 1 建立的 Assembly Item
2. **Name（名稱）** - 例如：`TEST-BOM-001` 或自動生成
3. **Revision（版本）** - 可選，例如：`Rev A` 或 `1.0`

#### Components（組件）標籤頁
至少添加一個組件：
1. **Item（物料）** - 選擇步驟 2 建立的組件物料
2. **Quantity（數量）** - 例如：`1` 或 `2`
3. **Unit（單位）** - 通常會自動帶出

### 建議設定
- **Effective Start Date（生效開始日期）**：今天或更早的日期
- **Effective End Date（生效結束日期）**：留空（表示永久有效）
- **Memo（備註）**：例如：`測試用 BOM`

### 完成後
點擊 **Save** 保存。

---

## 步驟 4: 驗證 BOM 結構

### 方法 1: 使用 API 測試

執行以下命令來查看 BOM 的欄位結構：

```bash
curl -X POST http://localhost:3000/api/test-bom-structure \
  -H "Content-Type: application/json"
```

或在瀏覽器中訪問：
```
POST http://localhost:3000/api/test-bom-structure
```

### 方法 2: 直接查詢 BOM 列表

```bash
curl -X POST http://localhost:3000/api/sync-bom-headers \
  -H "Content-Type: application/json"
```

---

## 預期結果

建立完成後，API 應該會返回：

1. **BOM 列表**：包含剛才建立的 BOM
2. **BOM 詳細資訊**：包含所有欄位
3. **Components 結構**：組件物料的詳細資訊

### 關鍵欄位確認

API 會返回以下關鍵資訊：
- `id` - BOM 的 Internal ID
- `name` - BOM 名稱
- `assemblyItem` 或 `item` - 組裝件資訊
- `revision` - 版本號
- `component` 或 `components` - 組件列表
  - 每個組件包含：
    - `item` - 組件物料 ID
    - `quantity` - 數量
    - `unitOfMeasure` - 單位

---

## 注意事項

1. **權限**：確保您的角色有權限：
   - 建立 Assembly Items
   - 建立 Bills of Materials
   - 查看 Bills of Materials

2. **製造模組**：確保製造模組已啟用（已確認啟用）

3. **測試資料**：建議使用明顯的測試名稱（如 `TEST-` 前綴），方便後續清理

4. **清理**：測試完成後，可以刪除這些測試資料，或保留作為日後測試使用

---

## 下一步

建立完成後：
1. 執行 `/api/test-bom-structure` 查看完整欄位結構
2. 根據實際欄位結構更新 `sync-bom-headers` 和 `sync-bom-lines` API
3. 更新 `NetSuite_實際欄位對照表.md` 記錄實際欄位名稱

