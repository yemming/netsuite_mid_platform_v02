-- ============================================
-- 新增 subsidiary_id 欄位到 ns_tax_codes 表
-- 日期：2025-01-XX
-- 說明：為稅碼表新增子公司關聯欄位
-- ============================================

-- 新增 subsidiary_id 欄位
ALTER TABLE ns_tax_codes
ADD COLUMN IF NOT EXISTS subsidiary_id INTEGER;

-- 新增索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_tax_codes_subsidiary_id ON ns_tax_codes(subsidiary_id);

-- 新增外鍵約束（可選，如果 ns_subsidiary 表存在）
-- ALTER TABLE ns_tax_codes
-- ADD CONSTRAINT fk_tax_codes_subsidiary
-- FOREIGN KEY (subsidiary_id) REFERENCES ns_subsidiary(netsuite_internal_id);

-- 新增註解
COMMENT ON COLUMN ns_tax_codes.subsidiary_id IS '所屬公司 ID (subsidiary，NetSuite Internal ID)';

