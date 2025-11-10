-- ============================================
-- 修改 ns_tax_codes 表：將 subsidiary_id 改為 country
-- 日期：2025-01-XX
-- 說明：根據 NetSuite 邏輯，稅碼是根據 Country 來篩選的
-- 流程：Employee → Subsidiary → Country → Tax Code
-- ============================================

-- 如果之前有 subsidiary_id 欄位，先移除
ALTER TABLE ns_tax_codes
DROP COLUMN IF EXISTS subsidiary_id;

-- 移除舊的索引
DROP INDEX IF EXISTS idx_tax_codes_subsidiary_id;

-- 新增 country 欄位
ALTER TABLE ns_tax_codes
ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- 新增索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_tax_codes_country ON ns_tax_codes(country);

-- 新增註解
COMMENT ON COLUMN ns_tax_codes.country IS '國家代碼（country，例如：TW, US, CN），用於根據 Employee → Subsidiary → Country → Tax Code 的流程篩選稅碼';

