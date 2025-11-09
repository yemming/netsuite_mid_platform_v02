-- ============================================
-- 遷移 table-mapping.ts 資料到 table_mapping_config
-- 用途：將現有的 hard code 配置遷移到資料庫
-- 執行方式：在 Supabase SQL Editor 中執行
-- ============================================

-- 清除現有資料（如果有的話）
TRUNCATE TABLE table_mapping_config;

-- 插入所有表映射配置
-- 注意：sync_order 是根據優先級和依賴關係設定的
INSERT INTO table_mapping_config (
  mapping_key,
  netsuite_table,
  supabase_table_name,
  label,
  priority,
  api_route,
  conflict_column,
  depends_on,
  sync_order,
  is_enabled,
  disabled_reason
) VALUES
-- 第一階段：基礎主檔（無依賴）
('subsidiaries', 'subsidiary', 'ns_subsidiaries', '公司別', '🔴 最高', '/api/sync-subsidiaries', 'netsuite_internal_id', '{}', 1, TRUE, NULL),
('currencies', 'currency', 'ns_currencies', '幣別', '🔴 最高', '/api/sync-currencies', 'netsuite_internal_id', '{}', 2, TRUE, NULL),
('items', 'item', 'ns_items', '產品主檔', '🔴 最高', '/api/sync-items', 'netsuite_internal_id', '{}', 3, TRUE, NULL),

-- 第二階段：組織架構（依賴 Subsidiary）
('departments', 'department', 'ns_departments', '部門', '🟡 中', '/api/sync-departments', 'netsuite_internal_id', ARRAY['subsidiaries'], 4, TRUE, NULL),
('classes', 'classification', 'ns_classes', '類別', '🟡 中', '/api/sync-classes', 'netsuite_internal_id', ARRAY['subsidiaries'], 5, TRUE, NULL),
('locations', 'location', 'ns_locations', '地點', '🟡 中', '/api/sync-locations', 'netsuite_internal_id', ARRAY['subsidiaries'], 6, TRUE, NULL),
('accounts', 'account', 'ns_accounts', '會計科目', '🟡 中', '/api/sync-accounts', 'netsuite_internal_id', ARRAY['subsidiaries'], 7, TRUE, NULL),

-- 第三階段：實體主檔（依賴 Subsidiary）
('customers', 'customer', 'ns_entities_customers', '客戶', '🔴 高', '/api/sync-customers', 'netsuite_internal_id', ARRAY['subsidiaries'], 8, TRUE, NULL),
('vendors', 'vendor', 'ns_entities_vendors', '供應商', '🟡 中', '/api/sync-vendors', 'netsuite_internal_id', ARRAY['subsidiaries'], 9, TRUE, NULL),
('employees', 'employee', 'ns_entities_employees', '員工', '🟡 中', '/api/sync-employees', 'netsuite_internal_id', ARRAY['subsidiaries'], 10, TRUE, NULL),

-- 第四階段：交易相關
('taxCodes', 'taxitem', 'ns_tax_codes', '稅碼', '🔴 高', '/api/sync-tax-codes', 'netsuite_internal_id', '{}', 11, TRUE, NULL),
('expenseCategories', 'expensecategory', 'ns_expense_categories', '費用類別', '🟡 中', '/api/sync-expense-categories', 'netsuite_internal_id', ARRAY['accounts'], 12, TRUE, NULL),
('terms', 'term', 'ns_terms', '付款條件', '🟢 低', '/api/sync-terms', 'netsuite_internal_id', '{}', 13, TRUE, NULL),

-- 第五階段：製造業（依賴 Items）
('bomHeaders', 'bom', 'ns_bom_headers', 'BOM 表頭', '🔴 最高', '/api/sync-bom-headers', 'netsuite_internal_id', ARRAY['items'], 14, TRUE, NULL),
('bomLines', 'bom', 'ns_bom_lines', 'BOM 明細', '🔴 最高', '/api/sync-bom-lines', 'id', ARRAY['bomHeaders'], 15, TRUE, NULL),
('workCenters', 'workcenter', 'ns_work_centers', '工作中心', '🟡 中', '/api/sync-work-centers', 'netsuite_internal_id', ARRAY['locations'], 16, TRUE, NULL),

-- 第六階段：可選表
('shipMethods', 'shipitem', 'ns_ship_methods', '運送方式', '🟢 低', '/api/sync-ship-methods', 'netsuite_internal_id', '{}', 17, TRUE, NULL),

-- 停用表
('accountingPeriods', 'accountingperiod', 'ns_accounting_periods', '會計期間', '🔴 最高', '/api/sync-accounting-periods', 'netsuite_internal_id', '{}', 18, FALSE, 'SuiteQL 不支援')
ON CONFLICT (mapping_key) DO UPDATE SET
  netsuite_table = EXCLUDED.netsuite_table,
  supabase_table_name = EXCLUDED.supabase_table_name,
  label = EXCLUDED.label,
  priority = EXCLUDED.priority,
  api_route = EXCLUDED.api_route,
  conflict_column = EXCLUDED.conflict_column,
  depends_on = EXCLUDED.depends_on,
  sync_order = EXCLUDED.sync_order,
  is_enabled = EXCLUDED.is_enabled,
  disabled_reason = EXCLUDED.disabled_reason,
  updated_at = NOW();

-- 驗證資料
SELECT 
  mapping_key,
  label,
  priority,
  sync_order,
  is_enabled,
  depends_on
FROM table_mapping_config
ORDER BY sync_order;

