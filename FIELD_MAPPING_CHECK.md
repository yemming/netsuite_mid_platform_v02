# Subsidiary 欄位映射對比確認

## 📊 欄位映射對照表

| NetSuite 欄位 | 指南中的映射 | 實際程式碼映射 | 狀態 |
|--------------|------------|--------------|------|
| `id` | `netsuite_internal_id` | `netsuite_internal_id: parseInt(item.id)` | ✅ 一致 |
| `name` | `name` | `name: item.name \|\| ''` | ✅ 一致 |
| `legalname` | `legal_name` | `legal_name: item.legalname \|\| null` | ✅ 一致 |
| `country` | `country` | `country: item.country \|\| null` | ✅ 一致 |
| `currency` | `base_currency_id` | `base_currency_id: item.currency ? parseInt(item.currency) : null` | ✅ 一致 |
| `parent` | `parent_id` | `parent_id: item.parent ? parseInt(item.parent) : null` | ✅ 一致 |
| `fullname` | `full_name` | `full_name: item.fullname \|\| null` | ✅ 一致 |
| `iselimination` | `is_elimination` (T/F → BOOLEAN) | `is_elimination: isElimination` (isElimination = item.iselimination === 'T') | ✅ 一致 |
| `isinactive` | `is_active` (F/T → BOOLEAN，需反轉) | `is_active: isActive` (isActive = item.isinactive !== 'T') | ✅ 一致 |
| `state` | `state` | `state: item.state \|\| null` | ✅ 一致 |
| `email` | `email` | `email: item.email \|\| null` | ✅ 一致 |
| `fiscalcalendar` | `fiscal_calendar_id` | `fiscal_calendar_id: item.fiscalcalendar ? parseInt(item.fiscalcalendar) : null` | ✅ 一致 |

## 🔍 詳細檢查

### 1. SuiteQL 查詢欄位
**指南中的查詢**（第 319-336 行）：
```sql
SELECT 
  id, name, legalname, country, currency, 
  parent, fullname, iselimination,
  state, email, fiscalcalendar, isinactive 
FROM subsidiary 
WHERE isinactive = 'F'
```

**實際程式碼查詢**（第 22-36 行）：
```sql
SELECT 
  id, name, legalname, country, currency, 
  isinactive, fullname, parent, iselimination,
  state, email, fiscalcalendar
FROM subsidiary
ORDER BY id
```

**差異**：
- ✅ 查詢的欄位完全相同（順序不同但不影響）
- ⚠️ 實際程式碼沒有使用 `WHERE isinactive = 'F'` 過濾，這是**正確的**，因為我們需要同步所有記錄（包括 inactive 的），然後在 Supabase 中用 `is_active` 欄位標記

### 2. 欄位映射邏輯

**✅ 所有欄位映射都正確**，包括：
- INTEGER 轉換：`id`, `currency`, `parent`, `fiscalcalendar` 都正確使用 `parseInt()`
- NULL 處理：所有可選欄位都正確處理了 `null`
- 布林值轉換：
  - `iselimination`: `'T'` → `true`, 其他 → `false` ✅
  - `isinactive`: `'F'` → `true` (active), `'T'` → `false` (inactive) ✅

### 3. 補充欄位

**實際程式碼額外添加的欄位**（符合 Supabase 表結構）：
- `sync_timestamp`: 同步時間戳 ✅
- `updated_at`: 更新時間戳 ✅

這些欄位在指南的表結構中也有定義（第 295, 299 行），所以也是正確的。

## ✅ 結論

**所有欄位映射都與指南完全一致！**

唯一的小差異是：
1. **查詢順序**：SQL 欄位順序不同，但不影響結果
2. **WHERE 條件**：實際程式碼沒有過濾 inactive 記錄，這是**更正確的做法**，因為：
   - 我們需要同步所有記錄到 Supabase
   - 用 `is_active` 欄位標記狀態
   - 業務系統可以根據需要查詢 active 或 inactive 的記錄

## 📝 建議

如果未來需要優化，可以考慮：
1. 在查詢時加入 `WHERE isinactive = 'F'` 來減少同步的資料量（如果只需要 active 記錄）
2. 或者在查詢中加入 `lastmodifieddate` 欄位來做增量同步

但目前實作完全符合指南的要求！

