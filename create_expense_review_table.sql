-- ============================================
-- 報支審核表（Expense Review）
-- 說明：暫存報支資料，供財務人員檢核後再寫入 NetSuite
-- 用途：報支流程的中間審核層
-- ============================================
CREATE TABLE expense_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- ============================================
  -- 基本報支資訊
  -- ============================================
  expense_date DATE NOT NULL,                      -- 報支日期
  expense_category_id UUID,                        -- 費用類別 ID（對應 ns_expense_categories.id）
  expense_category_name VARCHAR(255),             -- 費用類別名稱（快取，避免 JOIN）
  employee_id UUID,                               -- 員工 ID（對應 ns_entities_employees.id）
  employee_name VARCHAR(255),                     -- 員工名稱（快取）
  subsidiary_id UUID,                             -- 公司別 ID（對應 ns_subsidiaries.id）
  subsidiary_name VARCHAR(255),                  -- 公司別名稱（快取）
  location_id UUID,                               -- 地點 ID（對應 ns_locations.id，可選）
  location_name VARCHAR(255),                    -- 地點名稱（快取，可選）
  department_id UUID,                             -- 部門 ID（對應 ns_departments.id，可選）
  department_name VARCHAR(255),                  -- 部門名稱（快取，可選）
  class_id UUID,                                 -- 類別 ID（對應 ns_classes.id，可選）
  class_name VARCHAR(255),                       -- 類別名稱（快取，可選）
  
  -- 金額資訊
  receipt_amount DECIMAL(15,2) NOT NULL,           -- 收據金額
  receipt_currency VARCHAR(10) NOT NULL,          -- 幣別（TWD, USD 等）
  currency_id UUID,                               -- 幣別 ID（對應 ns_currencies.id）
  
  -- 描述
  description TEXT,                               -- 報支描述
  
  -- 收據狀態
  receipt_missing BOOLEAN DEFAULT FALSE,         -- 收據遺失
  
  -- ============================================
  -- OCR 識別結果（發票資訊）
  -- ============================================
  invoice_title VARCHAR(255),                    -- 發票標題
  invoice_period VARCHAR(50),                    -- 發票期別
  invoice_number VARCHAR(100),                   -- 發票號碼
  invoice_date DATE,                              -- 開立時間
  random_code VARCHAR(50),                        -- 隨機碼
  format_code VARCHAR(50),                        -- 格式代號
  
  -- 賣方資訊
  seller_name VARCHAR(255),                       -- 賣方名稱
  seller_tax_id VARCHAR(50),                     -- 賣方統編
  seller_address TEXT,                            -- 賣方地址
  
  -- 買方資訊
  buyer_name VARCHAR(255),                        -- 買方名稱
  buyer_tax_id VARCHAR(50),                       -- 買方統編
  buyer_address TEXT,                             -- 買方地址
  
  -- 金額明細
  untaxed_amount DECIMAL(15,2),                   -- 未稅銷售額
  tax_amount DECIMAL(15,2),                       -- 稅額
  total_amount DECIMAL(15,2),                     -- 總計金額
  
  -- ============================================
  -- OCR 元數據
  -- ============================================
  ocr_success BOOLEAN DEFAULT FALSE,                -- OCR 處理是否成功
  ocr_confidence DECIMAL(5,2),                     -- OCR 辨識信心度（%）
  ocr_document_type VARCHAR(100),                 -- OCR 文件類型
  ocr_errors TEXT,                                -- OCR 錯誤訊息
  ocr_warnings TEXT,                              -- OCR 警告訊息
  ocr_error_count INTEGER DEFAULT 0,              -- OCR 錯誤數量
  ocr_warning_count INTEGER DEFAULT 0,            -- OCR 警告數量
  ocr_quality_grade VARCHAR(50),                 -- OCR 品質等級
  ocr_file_name VARCHAR(255),                    -- OCR 檔案名稱
  ocr_file_id VARCHAR(255),                       -- OCR 檔案 ID
  ocr_web_view_link TEXT,                         -- OCR 預覽連結
  ocr_processed_at TIMESTAMPTZ,                   -- OCR 處理時間
  
  -- ============================================
  -- 附件（圖片）
  -- ============================================
  attachment_base64 TEXT,                         -- 附件圖片（Base64 格式）
  attachment_url TEXT,                             -- 附件 URL（如果上傳到雲端）
  
  -- ============================================
  -- 審核狀態
  -- ============================================
  review_status VARCHAR(50) DEFAULT 'pending',    -- 審核狀態：pending(待審核), approved(已審核), rejected(已拒絕), cancelled(已取消)
  reviewed_by UUID,                               -- 審核人員 ID（對應 Supabase auth.users.id）
  reviewed_by_name VARCHAR(255),                  -- 審核人員名稱（快取）
  reviewed_at TIMESTAMPTZ,                        -- 審核時間
  review_notes TEXT,                              -- 審核備註
  rejection_reason TEXT,                          -- 拒絕原因（如果被拒絕）
  
  -- ============================================
  -- NetSuite 同步狀態
  -- ============================================
  netsuite_sync_status VARCHAR(50) DEFAULT 'pending', -- 同步狀態：pending(待同步), syncing(同步中), success(成功), failed(失敗)
  netsuite_internal_id INTEGER,                   -- NetSuite Internal ID（同步成功後填入）
  netsuite_tran_id VARCHAR(100),                  -- NetSuite 交易編號（如 ER-12345）
  netsuite_sync_error TEXT,                       -- NetSuite 同步錯誤訊息
  netsuite_synced_at TIMESTAMPTZ,                 -- NetSuite 同步時間
  netsuite_sync_retry_count INTEGER DEFAULT 0,    -- NetSuite 同步重試次數
  
  -- NetSuite 請求/回應備份（除錯用）
  netsuite_request_payload JSONB,                 -- 發送給 NetSuite 的 JSON
  netsuite_response_payload JSONB,                -- NetSuite 返回的 JSON
  
  -- ============================================
  -- 審計欄位
  -- ============================================
  created_by UUID,                                -- 建立人員 ID（對應 Supabase auth.users.id）
  created_by_name VARCHAR(255),                  -- 建立人員名稱（快取）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- ============================================
  -- 內部欄位
  -- ============================================
  internal_notes TEXT,                            -- 內部備註（僅供系統管理員使用）
  priority VARCHAR(20) DEFAULT 'normal',         -- 優先級：low, normal, high, urgent
  tags TEXT[],                                    -- 標籤（用於分類和搜尋）
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX idx_expense_reviews_status ON expense_reviews(review_status);
CREATE INDEX idx_expense_reviews_sync_status ON expense_reviews(netsuite_sync_status);
CREATE INDEX idx_expense_reviews_employee ON expense_reviews(employee_id);
CREATE INDEX idx_expense_reviews_subsidiary ON expense_reviews(subsidiary_id);
CREATE INDEX idx_expense_reviews_date ON expense_reviews(expense_date DESC);
CREATE INDEX idx_expense_reviews_created_at ON expense_reviews(created_at DESC);
CREATE INDEX idx_expense_reviews_reviewed_at ON expense_reviews(reviewed_at DESC);
CREATE INDEX idx_expense_reviews_invoice_number ON expense_reviews(invoice_number) WHERE invoice_number IS NOT NULL;

-- 複合索引（常用查詢）
CREATE INDEX idx_expense_reviews_status_date ON expense_reviews(review_status, expense_date DESC);
CREATE INDEX idx_expense_reviews_sync_status_date ON expense_reviews(netsuite_sync_status, expense_date DESC);

-- ============================================
-- 註解
-- ============================================
COMMENT ON TABLE expense_reviews IS '報支審核表：暫存報支資料，供財務人員檢核後再寫入 NetSuite';
COMMENT ON COLUMN expense_reviews.review_status IS '審核狀態：pending(待審核), approved(已審核), rejected(已拒絕), cancelled(已取消)';
COMMENT ON COLUMN expense_reviews.netsuite_sync_status IS 'NetSuite 同步狀態：pending(待同步), syncing(同步中), success(成功), failed(失敗)';
COMMENT ON COLUMN expense_reviews.attachment_base64 IS '附件圖片（Base64 格式），建議大小限制在 10MB 以內';
COMMENT ON COLUMN expense_reviews.review_notes IS '審核備註：財務人員可以在此記錄審核意見';
COMMENT ON COLUMN expense_reviews.rejection_reason IS '拒絕原因：如果審核狀態為 rejected，記錄拒絕原因';
COMMENT ON COLUMN expense_reviews.internal_notes IS '內部備註：僅供系統管理員使用，一般使用者看不到';

-- ============================================
-- 範例查詢
-- ============================================
-- 查詢待審核的報支
-- SELECT * FROM expense_reviews WHERE review_status = 'pending' ORDER BY created_at DESC;

-- 查詢已審核但未同步的報支
-- SELECT * FROM expense_reviews WHERE review_status = 'approved' AND netsuite_sync_status = 'pending' ORDER BY reviewed_at DESC;

-- 查詢特定員工的報支
-- SELECT * FROM expense_reviews WHERE employee_id = 'xxx' ORDER BY expense_date DESC;

-- 查詢特定日期的報支
-- SELECT * FROM expense_reviews WHERE expense_date >= '2025-01-01' AND expense_date <= '2025-01-31' ORDER BY expense_date DESC;

