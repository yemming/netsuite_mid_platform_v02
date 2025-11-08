# 同步錯誤修復說明

## 問題 1：費用類別（Expense Categories）同步失敗

### 錯誤訊息
```
Could not find the 'default_rate' column of 'ns_expense_categories' in the schema cache
```

### 原因
Supabase 資料庫中的 `ns_expense_categories` 表缺少 `default_rate` 和 `rate_required` 欄位。雖然程式碼嘗試寫入這些欄位，但表結構中沒有定義。

### 解決方案

**步驟 1：在 Supabase 中執行以下 SQL**

```sql
-- 為 ns_expense_categories 表添加缺少的欄位
ALTER TABLE ns_expense_categories
ADD COLUMN IF NOT EXISTS default_rate DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS rate_required BOOLEAN DEFAULT FALSE;

-- 添加註解
COMMENT ON COLUMN ns_expense_categories.default_rate IS '預設費率（defaultrate）';
COMMENT ON COLUMN ns_expense_categories.rate_required IS '是否要求費率（raterequired = "T"）';
```

**步驟 2：執行 SQL 後重新同步**

執行完 SQL 後，回到設定頁面點擊「費用類別」的「同步」按鈕即可。

### 檔案位置
SQL 腳本已保存在：`fix_expense_categories_table.sql`

---

## 問題 2：會計期間（Accounting Periods）同步失敗

### 錯誤訊息
```
Invalid search query. Record 'accountingperiod' was not found.
```

### 原因
NetSuite SuiteQL **不支援** `accountingperiod` 表的查詢。根據對照表，這個記錄類型只能透過 REST API 查詢，不能使用 SuiteQL。

### 解決方案

**選項 A：暫時停用（已實作）**
- 會計期間的同步功能已暫時停用
- 在設定頁面中，該表的「同步」按鈕會顯示為「不支援」並禁用
- 這不會影響其他表的同步

**選項 B：使用 REST API（未來實作）**
- 需要使用 NetSuite REST API 的 `/services/rest/record/v1/accountingperiod` 端點
- 需要實作不同的查詢邏輯（不是 SuiteQL）
- 這需要額外的開發工作

### 目前狀態
- ✅ 程式碼已更新，會計期間同步會返回明確的錯誤訊息
- ✅ UI 中已標記為「不支援」，防止誤點
- ⚠️ 如需同步會計期間，需要實作 REST API 版本

---

## 總結

| 問題 | 類型 | 狀態 | 解決方式 |
|------|------|------|----------|
| 費用類別 | Supabase 表結構缺少欄位 | 🔧 需手動修復 | 執行 SQL 添加欄位 |
| 會計期間 | NetSuite SuiteQL 不支援 | ✅ 已處理 | 暫時停用，標記為不支援 |

## 下一步

1. **立即執行**：在 Supabase 執行 `fix_expense_categories_table.sql` 中的 SQL
2. **測試同步**：執行 SQL 後，重新同步「費用類別」表
3. **會計期間**：目前暫時不需要處理，已標記為不支援

