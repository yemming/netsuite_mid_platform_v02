-- ============================================
-- 新增 netsuite_url 欄位到 expense_reviews 表
-- ============================================
ALTER TABLE expense_reviews 
ADD COLUMN IF NOT EXISTS netsuite_url TEXT;

-- 建立索引（如果 URL 存在）
CREATE INDEX IF NOT EXISTS idx_expense_reviews_netsuite_url 
ON expense_reviews(netsuite_url) 
WHERE netsuite_url IS NOT NULL;

-- 註解
COMMENT ON COLUMN expense_reviews.netsuite_url IS 'NetSuite 網址（用於直接連結到 NetSuite UI 查看該筆 Expense Report）';

