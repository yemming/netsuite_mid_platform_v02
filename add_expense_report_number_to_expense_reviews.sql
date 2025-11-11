-- ============================================
-- 新增費用報告編號欄位到 expense_reviews 表
-- 說明：為每個費用報告新增系統自動生成的編號
-- 用途：方便追蹤和管理費用報告
-- ============================================

-- 新增 expense_report_number 欄位
ALTER TABLE expense_reviews
ADD COLUMN IF NOT EXISTS expense_report_number VARCHAR(50);

-- 建立索引以加速查詢
CREATE INDEX IF NOT EXISTS idx_expense_reviews_report_number 
ON expense_reviews(expense_report_number) 
WHERE expense_report_number IS NOT NULL;

-- 新增註解
COMMENT ON COLUMN expense_reviews.expense_report_number IS '費用報告編號：系統自動生成的唯一編號，格式為 EXP-YYYYMMDD-XXXXX';

-- ============================================
-- 為現有記錄生成編號（可選）
-- ============================================
-- 如果需要為現有記錄生成編號，可以執行以下 SQL：
-- UPDATE expense_reviews
-- SET expense_report_number = 'EXP-' || TO_CHAR(created_at, 'YYYYMMDD') || '-' || LPAD(ROW_NUMBER() OVER (PARTITION BY DATE(created_at) ORDER BY created_at)::TEXT, 5, '0')
-- WHERE expense_report_number IS NULL;

