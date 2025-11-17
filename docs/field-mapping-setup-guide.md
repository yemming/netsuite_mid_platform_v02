# 欄位映射設定指南

## 📋 概述

本指南說明如何設定「公司別」（Subsidiaries）表的欄位映射配置。

## 🔍 第一步：檢查目前狀態

在 Supabase SQL Editor 中執行：

```sql
-- 執行 scripts/check_field_mapping_status.sql
```

這個腳本會顯示：
- ✅ 表是否存在
- 📊 各表的欄位映射統計
- 🔍 公司別的詳細狀態
- ⏳ 待確認的欄位列表

## 🚀 第二步：初始化公司別欄位映射

### 前置條件

1. ✅ 確認 `table_mapping_config` 表已有資料（執行過 `migrate_table_mapping_to_config.sql`）
2. ✅ 確認 `field_mapping_config` 表已建立（執行過 `create_field_mapping_config.sql`）

### 執行初始化

在 Supabase SQL Editor 中執行：

```sql
-- 執行 scripts/init_subsidiaries_field_mapping.sql
```

這個腳本會：
- ✅ 自動取得 `subsidiaries` 的 `table_mapping_id`
- ✅ 插入 12 個標準欄位的映射配置
- ✅ 設定正確的轉換規則（特別是布林值欄位）
- ✅ 使用 `ON CONFLICT` 避免重複插入

### 公司別欄位映射清單

| NetSuite 欄位 | Supabase 欄位 | 型別 | 轉換規則 |
|--------------|-------------|------|---------|
| `id` | `netsuite_internal_id` | integer | - |
| `name` | `name` | text | - |
| `legalname` | `legal_name` | text | - |
| `fullname` | `full_name` | text | - |
| `country` | `country` | text | - |
| `state` | `state` | text | - |
| `email` | `email` | text | - |
| `currency` | `base_currency_id` | integer | - |
| `parent` | `parent_id` | integer | - |
| `fiscalcalendar` | `fiscal_calendar_id` | integer | - |
| `iselimination` | `is_elimination` | boolean | T/F → boolean |
| `isinactive` | `is_active` | boolean | F/T → boolean（反轉） |

## 🎯 第三步：驗證設定

執行檢查腳本確認：

```sql
-- 再次執行 scripts/check_field_mapping_status.sql
```

應該會看到：
- ✅ 公司別有 12 個已啟用的欄位映射
- ✅ 所有欄位的映射都正確

## 📱 第四步：在 UI 中查看

1. 前往「欄位映射管理」頁面
2. 應該會看到公司別的欄位映射（如果有的話）
3. 或者點擊「掃描」按鈕來偵測新欄位

## 🔄 替代方案：使用 UI 掃描

如果你想要使用 UI 來掃描並自動偵測欄位：

1. 前往「欄位映射管理」頁面
2. 點擊「公司別」表的掃描按鈕
3. 系統會自動：
   - 連接到 NetSuite
   - 偵測所有欄位
   - 生成映射建議
   - 將新欄位加入待確認列表

4. 然後你可以：
   - 檢查自動生成的映射
   - 調整欄位名稱或型別（如需要）
   - 啟用選中的欄位

## ⚠️ 注意事項

### 布林值轉換規則

- **`iselimination`**: `'T'` → `true`, 其他 → `false`
- **`isinactive`**: `'F'` → `true` (active), `'T'` → `false` (inactive)

注意 `isinactive` 需要**反轉邏輯**，因為 NetSuite 的 `isinactive = 'F'` 表示 active。

### 唯一約束

`field_mapping_config` 表有唯一約束：`(mapping_key, netsuite_field_name)`

這意味著：
- ✅ 同一個表的同一個 NetSuite 欄位只能有一個映射
- ✅ 使用 `ON CONFLICT` 可以安全地重複執行初始化腳本

## 🐛 疑難排解

### 問題：找不到 table_mapping_id

**錯誤訊息**：
```
找不到 mapping_key = 'subsidiaries' 的記錄
```

**解決方法**：
1. 確認已執行 `migrate_table_mapping_to_config.sql`
2. 檢查 `table_mapping_config` 表中是否有 `mapping_key = 'subsidiaries'` 的記錄

### 問題：表不存在

**錯誤訊息**：
```
relation "field_mapping_config" does not exist
```

**解決方法**：
1. 執行 `create_field_mapping_config.sql` 建立表

### 問題：UI 中看不到欄位

**可能原因**：
1. 欄位的 `is_active = false`（待確認狀態）
2. 需要重新載入頁面

**解決方法**：
1. 在 SQL Editor 中檢查：`SELECT * FROM field_mapping_config WHERE mapping_key = 'subsidiaries'`
2. 確認 `is_active = true` 的欄位
3. 或者使用 UI 的「啟用選中的欄位」功能

## 📚 下一步

設定完公司別的欄位映射後，你可以：

1. ✅ 在「n8n 同步管理」中觸發同步
2. 🔄 繼續設定其他表的欄位映射（幣別、產品主檔等）
3. 🔍 使用 UI 掃描功能來發現新欄位

## 📝 相關檔案

- `scripts/check_field_mapping_status.sql` - 檢查狀態腳本
- `scripts/init_subsidiaries_field_mapping.sql` - 初始化腳本
- `create_field_mapping_config.sql` - 建立表結構
- `migrate_table_mapping_to_config.sql` - 初始化表映射
- `FIELD_MAPPING_CHECK.md` - 欄位映射對比確認文件

