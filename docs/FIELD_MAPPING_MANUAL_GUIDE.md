# 欄位映射手動管理指南

## 概述

這是一個類似 NetSuite CSV Import 的欄位映射管理系統，讓你可以手動、視覺化地設定 NetSuite 欄位到 Supabase 欄位的映射關係。

## 功能特色

1. **表列表視圖**：第一層顯示所有 NetSuite 表
2. **拖拽映射**：直觀的拖拽操作來建立欄位映射
3. **動態新增欄位**：可以直接在 Supabase 側新增欄位
4. **ETL 轉換規則**：支援設定資料轉換規則（開發中）

## 使用流程

### 步驟 1：初始化資料庫函數

在 Supabase SQL Editor 中執行：

```sql
-- 執行 create_get_table_columns_function.sql
-- 這個函數用於查詢 Supabase 表的欄位結構
```

### 步驟 2：訪問表列表頁面

訪問 `/dashboard/field-mapping`，你會看到所有 NetSuite 表的列表。

### 步驟 3：選擇要映射的表

點擊任何一個表卡片，進入詳細映射頁面。

### 步驟 4：進行欄位映射

在詳細頁面中：

1. **左側**：顯示 NetSuite 表的所有欄位
2. **右側**：顯示 Supabase 表的所有欄位
3. **拖拽操作**：
   - 從左側拖拽 NetSuite 欄位
   - 放到右側的 Supabase 欄位上
   - 系統會自動建立映射關係

### 步驟 5：新增 Supabase 欄位（如需要）

如果 Supabase 表中缺少某個欄位：

1. 點擊右側的「新增欄位」按鈕
2. 輸入欄位名稱、選擇型別
3. 欄位會顯示在右側列表中
4. **重要**：記得在 Supabase SQL Editor 中執行 `ALTER TABLE` 來實際新增欄位

### 步驟 6：設定轉換規則（可選）

點擊已映射欄位旁的設定圖示，可以設定 ETL 轉換規則（例如：'T'/'F' → boolean）。

### 步驟 7：儲存映射

點擊右上角的「儲存映射」按鈕，所有映射關係會儲存到 `field_mapping_config` 表中。

## API 端點

### 取得 NetSuite 欄位

```
GET /api/field-mapping/netsuite-fields?mappingKey=customers
```

### 取得 Supabase 欄位

```
GET /api/field-mapping/supabase-columns?tableName=ns_customers
```

### 儲存欄位映射

```
POST /api/field-mapping
{
  "mappingKey": "customers",
  "netsuiteFieldName": "isinactive",
  "supabaseColumnName": "is_active",
  "supabaseColumnType": "boolean",
  "transformationRule": {
    "type": "boolean",
    "true_value": "F",
    "false_value": "T"
  },
  "isCustomField": false
}
```

## 注意事項

1. **Supabase 欄位新增**：在 UI 中新增的欄位只是暫時顯示，需要手動在 Supabase 中執行 SQL 來實際建立欄位。

2. **映射儲存**：映射關係儲存在 `field_mapping_config` 表中，可以隨時修改和更新。

3. **轉換規則**：轉換規則以 JSONB 格式儲存，支援多種轉換類型（boolean、integer、date 等）。

4. **拖拽操作**：使用 `@dnd-kit` 實作，支援鍵盤和滑鼠操作。

## 後續開發

- [ ] 完善 ETL 轉換規則設定 UI
- [ ] 支援批次映射操作
- [ ] 映射關係匯出/匯入功能
- [ ] 映射驗證和測試功能

