-- ============================================
-- 簡化 expense_reviews 表
-- 說明：移除 OCR、金額、附件相關欄位（這些已移到 expense_lines 表）
-- 保留：基本資訊、審核狀態、NetSuite 同步狀態、審計欄位
-- ============================================

-- 先清掉舊資料（根據用戶要求，不需要 migration）
TRUNCATE TABLE expense_reviews CASCADE;

-- 移除不需要的欄位
ALTER TABLE expense_reviews
  DROP COLUMN IF EXISTS expense_category_id,
  DROP COLUMN IF EXISTS expense_category_name,
  DROP COLUMN IF EXISTS receipt_amount,
  DROP COLUMN IF EXISTS receipt_currency,
  DROP COLUMN IF EXISTS currency_id,
  DROP COLUMN IF EXISTS receipt_missing,
  -- OCR 相關欄位
  DROP COLUMN IF EXISTS invoice_title,
  DROP COLUMN IF EXISTS invoice_period,
  DROP COLUMN IF EXISTS invoice_number,
  DROP COLUMN IF EXISTS invoice_date,
  DROP COLUMN IF EXISTS random_code,
  DROP COLUMN IF EXISTS format_code,
  DROP COLUMN IF EXISTS seller_name,
  DROP COLUMN IF EXISTS seller_tax_id,
  DROP COLUMN IF EXISTS seller_address,
  DROP COLUMN IF EXISTS buyer_name,
  DROP COLUMN IF EXISTS buyer_tax_id,
  DROP COLUMN IF EXISTS buyer_address,
  DROP COLUMN IF EXISTS untaxed_amount,
  DROP COLUMN IF EXISTS tax_amount,
  DROP COLUMN IF EXISTS total_amount,
  DROP COLUMN IF EXISTS ocr_success,
  DROP COLUMN IF EXISTS ocr_confidence,
  DROP COLUMN IF EXISTS ocr_document_type,
  DROP COLUMN IF EXISTS ocr_errors,
  DROP COLUMN IF EXISTS ocr_warnings,
  DROP COLUMN IF EXISTS ocr_error_count,
  DROP COLUMN IF EXISTS ocr_warning_count,
  DROP COLUMN IF EXISTS ocr_quality_grade,
  DROP COLUMN IF EXISTS ocr_file_name,
  DROP COLUMN IF EXISTS ocr_file_id,
  DROP COLUMN IF EXISTS ocr_web_view_link,
  DROP COLUMN IF EXISTS ocr_processed_at,
  -- 附件欄位
  DROP COLUMN IF EXISTS attachment_base64,
  DROP COLUMN IF EXISTS attachment_url,
  -- 移除 location, department, class（這些在 line 層級）
  DROP COLUMN IF EXISTS location_id,
  DROP COLUMN IF EXISTS location_name,
  DROP COLUMN IF EXISTS department_id,
  DROP COLUMN IF EXISTS department_name,
  DROP COLUMN IF EXISTS class_id,
  DROP COLUMN IF EXISTS class_name;

-- 更新註解
COMMENT ON TABLE expense_reviews IS '報支審核表（表頭）：暫存報支資料，供財務人員檢核後再寫入 NetSuite。明細資料請參考 expense_lines 表。';

-- 移除不再需要的索引
DROP INDEX IF EXISTS idx_expense_reviews_invoice_number;

