-- ============================================
-- 修復費用類別表：添加缺少的欄位
-- ============================================
-- 為 ns_expense_categories 表添加 default_rate 和 rate_required 欄位

ALTER TABLE ns_expense_categories
ADD COLUMN IF NOT EXISTS default_rate DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS rate_required BOOLEAN DEFAULT FALSE;

-- 添加註解
COMMENT ON COLUMN ns_expense_categories.default_rate IS '預設費率（defaultrate）';
COMMENT ON COLUMN ns_expense_categories.rate_required IS '是否要求費率（raterequired = "T"）';

-- 完成訊息
SELECT '費用類別表結構已更新！' as message;

