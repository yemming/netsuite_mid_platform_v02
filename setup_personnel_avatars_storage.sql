-- ============================================
-- 人員照片 Storage Bucket 設定
-- 說明：建立 personnel-avatars bucket 用於儲存人員照片
-- 執行方式：在 Supabase Dashboard → Storage → New bucket 手動建立
-- ============================================

-- 注意：Storage bucket 無法透過 SQL 直接建立
-- 需要在 Supabase Dashboard 手動建立，或使用 Supabase Management API

-- ============================================
-- 手動建立步驟（Supabase Dashboard）
-- ============================================
-- 1. 進入 Supabase Dashboard → Storage
-- 2. 點擊 "New bucket"
-- 3. Bucket 名稱：personnel-avatars
-- 4. Public bucket：關閉（設為 Private，需要認證才能存取）
-- 5. File size limit：5MB（建議）
-- 6. Allowed MIME types：image/jpeg, image/jpg, image/png, image/webp

-- ============================================
-- RLS 政策（Row Level Security）
-- ============================================
-- 建立 bucket 後，執行以下 SQL 設定 RLS 政策

-- 政策 1：允許已認證使用者上傳照片
CREATE POLICY "Allow authenticated users to upload personnel avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'personnel-avatars' AND
  auth.role() = 'authenticated'
);

-- 政策 2：允許已認證使用者讀取照片
CREATE POLICY "Allow authenticated users to read personnel avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'personnel-avatars' AND
  auth.role() = 'authenticated'
);

-- 政策 3：允許已認證使用者更新照片
CREATE POLICY "Allow authenticated users to update personnel avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'personnel-avatars' AND
  auth.role() = 'authenticated'
);

-- 政策 4：允許已認證使用者刪除照片
CREATE POLICY "Allow authenticated users to delete personnel avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'personnel-avatars' AND
  auth.role() = 'authenticated'
);

