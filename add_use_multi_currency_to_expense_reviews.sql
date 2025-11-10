-- ============================================
-- 新增 use_multi_currency 欄位到 expense_reviews 表
-- 日期：2025-01-XX
-- 說明：儲存「使用多幣別」選項的狀態
-- ============================================

-- 新增 use_multi_currency 欄位
ALTER TABLE expense_reviews
ADD COLUMN IF NOT EXISTS use_multi_currency BOOLEAN DEFAULT FALSE;

-- 新增註解
COMMENT ON COLUMN expense_reviews.use_multi_currency IS '是否使用多幣別（表頭設定，影響表身是否顯示外幣金額和匯率欄位）';

