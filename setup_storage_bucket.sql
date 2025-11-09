-- ============================================
-- Supabase Storage Bucket 設定
-- 說明：建立 expense-receipts bucket 用於儲存報支發票圖片
-- 執行方式：在 Supabase Dashboard → Storage → New bucket 手動建立
-- 或使用 Supabase CLI: supabase storage create expense-receipts --public false
-- ============================================

-- 注意：Storage bucket 無法透過 SQL 直接建立
-- 需要在 Supabase Dashboard 手動建立，或使用 Supabase Management API

-- ============================================
-- 手動建立步驟（Supabase Dashboard）
-- ============================================
-- 1. 進入 Supabase Dashboard → Storage
-- 2. 點擊 "New bucket"
-- 3. Bucket 名稱：expense-receipts
-- 4. Public bucket：關閉（設為 Private，需要認證才能存取）
-- 5. File size limit：10MB（建議）
-- 6. Allowed MIME types：image/jpeg, image/png, image/webp, application/pdf

-- ============================================
-- RLS 政策（Row Level Security）
-- ============================================
-- 建立 bucket 後，需要設定 RLS 政策以控制存取權限

-- 政策 1：允許已認證使用者上傳檔案
-- INSERT policy for authenticated users
-- CREATE POLICY "Allow authenticated users to upload receipts"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'expense-receipts' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );

-- 政策 2：允許已認證使用者讀取自己的檔案
-- SELECT policy for authenticated users
-- CREATE POLICY "Allow authenticated users to read receipts"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'expense-receipts' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );

-- 政策 3：允許已認證使用者更新自己的檔案
-- UPDATE policy for authenticated users
-- CREATE POLICY "Allow authenticated users to update receipts"
-- ON storage.objects FOR UPDATE
-- TO authenticated
-- USING (
--   bucket_id = 'expense-receipts' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );

-- 政策 4：允許已認證使用者刪除自己的檔案
-- DELETE policy for authenticated users
-- CREATE POLICY "Allow authenticated users to delete receipts"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'expense-receipts' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );

-- ============================================
-- 檔案命名規則
-- ============================================
-- 建議格式：{user_id}/{expense_review_id}/{timestamp}.{ext}
-- 範例：550e8400-e29b-41d4-a716-446655440000/123e4567-e89b-12d3-a456-426614174000/2025-01-09T10-30-00.jpg
--
-- 優點：
-- 1. 按使用者分資料夾，方便管理
-- 2. 按報支 ID 分資料夾，方便查找
-- 3. 時間戳記避免檔名衝突

-- ============================================
-- 使用 Supabase CLI 建立（可選）
-- ============================================
-- supabase storage create expense-receipts --public false
-- supabase storage policy create expense-receipts-upload --bucket expense-receipts --operation insert --policy "Allow authenticated users to upload receipts"
-- supabase storage policy create expense-receipts-read --bucket expense-receipts --operation select --policy "Allow authenticated users to read receipts"

