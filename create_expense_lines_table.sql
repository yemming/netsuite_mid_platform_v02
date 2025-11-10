-- ============================================
-- 報支明細表（Expense Lines）
-- 說明：報支的表身，每個 line 包含完整的 OCR 資料、發票資料、文件檔案資訊
-- 用途：儲存報支的每一行明細資料
-- ============================================
CREATE TABLE expense_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_review_id UUID NOT NULL REFERENCES expense_reviews(id) ON DELETE CASCADE,
  
  -- ============================================
  -- 基本欄位
  -- ============================================
  line_number INTEGER NOT NULL,                    -- 行號（對應 refNo，從 1 開始）
  
  -- ============================================
  -- 手動輸入欄位（表身資料）
  -- ============================================
  date DATE NOT NULL,                              -- 報支日期（line 層級）
  category_id UUID,                                -- 費用類別 ID（對應 ns_expense_categories.id）
  category_name VARCHAR(255),                      -- 費用類別名稱（快取）
  currency_id UUID,                                -- 幣別 ID（對應 ns_currencies.id）
  currency VARCHAR(10),                            -- 幣別符號（TWD, USD 等）
  foreign_amount DECIMAL(15,2),                    -- 外幣金額
  exchange_rate DECIMAL(15,6) DEFAULT 1.0,         -- 匯率
  amount DECIMAL(15,2) NOT NULL,                   -- 金額（必填）
  tax_code VARCHAR(50),                            -- 稅碼
  tax_rate DECIMAL(5,2),                           -- 稅率（%）
  tax_amt DECIMAL(15,2),                           -- 稅額
  gross_amt DECIMAL(15,2) NOT NULL,                -- 總金額（必填）
  memo TEXT,                                       -- 備註
  department_id UUID,                              -- 部門 ID（對應 ns_departments.id，line 層級）
  department_name VARCHAR(255),                    -- 部門名稱（快取）
  class_id UUID,                                   -- 類別 ID（對應 ns_classes.id，line 層級）
  class_name VARCHAR(255),                        -- 類別名稱（快取）
  location_id UUID,                                -- 地點 ID（對應 ns_locations.id，line 層級）
  location_name VARCHAR(255),                      -- 地點名稱（快取）
  customer_id UUID,                                -- 客戶 ID（對應 ns_customers.id，可選）
  customer_name VARCHAR(255),                     -- 客戶名稱（快取）
  project_task_id UUID,                            -- 專案任務 ID（可選）
  project_task_name VARCHAR(255),                  -- 專案任務名稱（快取）
  billable BOOLEAN DEFAULT FALSE,                  -- 可計費
  
  -- ============================================
  -- OCR 識別結果（發票資訊）
  -- ============================================
  invoice_title VARCHAR(255),                      -- 發票標題
  invoice_period VARCHAR(50),                     -- 發票期別
  invoice_number VARCHAR(100),                     -- 發票號碼
  invoice_date DATE,                               -- 開立時間
  random_code VARCHAR(50),                        -- 隨機碼
  format_code VARCHAR(50),                        -- 格式代號
  
  -- 賣方資訊
  seller_name VARCHAR(255),                       -- 賣方名稱
  seller_tax_id VARCHAR(50),                      -- 賣方統編
  seller_address TEXT,                             -- 賣方地址
  
  -- 買方資訊
  buyer_name VARCHAR(255),                        -- 買方名稱
  buyer_tax_id VARCHAR(50),                       -- 買方統編
  buyer_address TEXT,                              -- 買方地址
  
  -- 金額明細
  untaxed_amount DECIMAL(15,2),                    -- 未稅銷售額
  tax_amount DECIMAL(15,2),                       -- 稅額
  total_amount DECIMAL(15,2),                      -- 總計金額
  
  -- ============================================
  -- OCR 元數據
  -- ============================================
  ocr_success BOOLEAN DEFAULT FALSE,              -- OCR 處理是否成功
  ocr_confidence DECIMAL(5,2),                     -- OCR 辨識信心度（%）
  ocr_document_type VARCHAR(100),                 -- OCR 文件類型
  ocr_errors TEXT,                                 -- OCR 錯誤訊息
  ocr_warnings TEXT,                               -- OCR 警告訊息
  ocr_error_count INTEGER DEFAULT 0,               -- OCR 錯誤數量
  ocr_warning_count INTEGER DEFAULT 0,             -- OCR 警告數量
  ocr_quality_grade VARCHAR(50),                  -- OCR 品質等級
  ocr_file_name VARCHAR(255),                     -- OCR 檔案名稱
  ocr_file_id VARCHAR(255),                        -- OCR 檔案 ID
  ocr_web_view_link TEXT,                          -- OCR 預覽連結
  ocr_processed_at TIMESTAMPTZ,                   -- OCR 處理時間
  
  -- ============================================
  -- 文件檔案資訊
  -- ============================================
  document_file_name VARCHAR(255),                 -- 文件檔案名稱
  document_file_path TEXT,                         -- 文件檔案路徑（Supabase Storage 路徑）
  attachment_url TEXT,                              -- 附件 URL（Supabase Storage URL）
  attachment_base64 TEXT,                          -- 附件 Base64（備用）
  
  -- ============================================
  -- 審計欄位
  -- ============================================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- ============================================
  -- 唯一約束
  -- ============================================
  CONSTRAINT unique_expense_review_line_number UNIQUE (expense_review_id, line_number)
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX idx_expense_lines_review_id ON expense_lines(expense_review_id);
CREATE INDEX idx_expense_lines_category ON expense_lines(category_id);
CREATE INDEX idx_expense_lines_currency ON expense_lines(currency_id);
CREATE INDEX idx_expense_lines_date ON expense_lines(date DESC);
CREATE INDEX idx_expense_lines_invoice_number ON expense_lines(invoice_number) WHERE invoice_number IS NOT NULL;
CREATE INDEX idx_expense_lines_ocr_file_id ON expense_lines(ocr_file_id) WHERE ocr_file_id IS NOT NULL;

-- 複合索引（常用查詢）
CREATE INDEX idx_expense_lines_review_line_number ON expense_lines(expense_review_id, line_number);

-- ============================================
-- 註解
-- ============================================
COMMENT ON TABLE expense_lines IS '報支明細表：儲存報支的每一行明細資料，包含 OCR 資料、發票資料、文件檔案資訊';
COMMENT ON COLUMN expense_lines.line_number IS '行號（對應前端 refNo），從 1 開始，在同一 expense_review_id 內必須唯一';
COMMENT ON COLUMN expense_lines.amount IS '金額（必填）';
COMMENT ON COLUMN expense_lines.gross_amt IS '總金額（必填），通常為 amount + tax_amt';
COMMENT ON COLUMN expense_lines.document_file_path IS '文件檔案路徑（Supabase Storage 路徑），例如：expense-receipts/user_id/timestamp_filename.ext';
COMMENT ON COLUMN expense_lines.attachment_url IS '附件 URL（Supabase Storage URL），優先使用此欄位';
COMMENT ON COLUMN expense_lines.attachment_base64 IS '附件 Base64（備用），當 Storage 上傳失敗時使用';

-- ============================================
-- 範例查詢
-- ============================================
-- 查詢特定報支的所有明細
-- SELECT * FROM expense_lines WHERE expense_review_id = 'xxx' ORDER BY line_number;

-- 查詢有 OCR 資料的明細
-- SELECT * FROM expense_lines WHERE ocr_success = true ORDER BY ocr_processed_at DESC;

-- 查詢特定發票號碼的明細
-- SELECT * FROM expense_lines WHERE invoice_number = 'xxx';

