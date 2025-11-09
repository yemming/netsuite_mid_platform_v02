# Phase 1 遷移指南：table-mapping.ts → table_mapping_config

## 概述

此指南說明如何將 hard code 的 `table-mapping.ts` 遷移到資料庫配置表 `table_mapping_config`。

## 執行步驟

### 步驟 1：建立配置表

在 Supabase SQL Editor 中執行：

```sql
-- 執行 create_table_mapping_config.sql
```

或直接複製 `create_table_mapping_config.sql` 的內容到 Supabase SQL Editor 執行。

### 步驟 2：遷移現有資料

在 Supabase SQL Editor 中執行：

```sql
-- 執行 migrate_table_mapping_to_config.sql
```

或直接複製 `migrate_table_mapping_to_config.sql` 的內容到 Supabase SQL Editor 執行。

### 步驟 3：驗證遷移結果

執行以下 SQL 查詢確認資料已正確遷移：

```sql
-- 檢查所有配置
SELECT 
  mapping_key,
  label,
  priority,
  sync_order,
  is_enabled,
  depends_on
FROM table_mapping_config
ORDER BY sync_order;

-- 檢查是否有遺漏的配置
SELECT COUNT(*) as total_configs FROM table_mapping_config;
-- 預期：18 個配置（17 個啟用 + 1 個停用）
```

### 步驟 4：測試系統

1. **測試 API 路由**：
   - 訪問 `/api/sync-status`，確認能正確讀取配置
   - 檢查是否從資料庫讀取（查看 console log）

2. **測試前端頁面**：
   - 訪問 `/dashboard/settings`
   - 確認所有表都正常顯示
   - 確認優先級和狀態正確

3. **測試同步功能**：
   - 嘗試同步一個表（例如：公司別）
   - 確認同步功能正常運作

## 回退方案

如果遷移後出現問題，系統會自動 fallback 到 hard code 配置：

- `getAllTableMappings()` 會先嘗試從資料庫讀取
- 如果資料庫讀取失敗，會自動使用 `TABLE_MAPPING` 的 hard code 配置
- 前端使用 `getAllTableMappingsSync()` 直接讀取 hard code 配置

## 驗證清單

- [ ] 配置表已建立
- [ ] 資料已成功遷移（18 筆記錄）
- [ ] `/api/sync-status` 正常運作
- [ ] `/dashboard/settings` 頁面正常顯示
- [ ] 同步功能正常運作
- [ ] Console 沒有錯誤訊息

## 注意事項

1. **前端限制**：前端（Client Component）無法直接使用 async 函數，所以使用 `getAllTableMappingsSync()` 讀取 hard code 配置。如果需要從資料庫讀取，應該透過 API。

2. **向後相容**：所有現有的程式碼都能正常運作，因為：
   - 提供了 async 和 sync 兩種版本的函數
   - 自動 fallback 到 hard code 配置

3. **資料庫優先**：Server-side API 會優先從資料庫讀取配置，只有在資料庫讀取失敗時才會使用 hard code 配置。

## 下一步

完成 Phase 1 後，可以進行 Phase 2：
- 建立表結構模板庫
- 實作自動建表 API
- 實作 NetSuite 掃描功能

