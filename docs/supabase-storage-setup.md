# Supabase Storage 設定指南

## 建立 expense-receipts Bucket

### 步驟 1：進入 Supabase Dashboard

1. 登入 [Supabase Dashboard](https://app.supabase.com)
2. 選擇你的專案
3. 點擊左側選單的 **Storage**

### 步驟 2：建立新 Bucket

1. 點擊 **New bucket** 按鈕
2. 填寫以下資訊：
   - **Bucket name**: `expense-receipts`
   - **Public bucket**: **關閉**（設為 Private，需要認證才能存取）
   - **File size limit**: `10` MB（建議）
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, application/pdf`（可選，用於限制檔案類型）

3. 點擊 **Create bucket**

### 步驟 3：設定 RLS 政策（Row Level Security）

建立 bucket 後，需要設定 RLS 政策以控制存取權限。

#### 方法 1：使用 Supabase Dashboard（推薦）

1. 進入 **Storage** → **Policies**
2. 選擇 `expense-receipts` bucket
3. 點擊 **New Policy**
4. 建立以下政策：

**政策 1：允許已認證使用者上傳檔案**
- Policy name: `Allow authenticated users to upload receipts`
- Allowed operation: `INSERT`
- Policy definition:
```sql
(bucket_id = 'expense-receipts'::text) AND (auth.role() = 'authenticated'::text)
```

**政策 2：允許已認證使用者讀取檔案**
- Policy name: `Allow authenticated users to read receipts`
- Allowed operation: `SELECT`
- Policy definition:
```sql
(bucket_id = 'expense-receipts'::text) AND (auth.role() = 'authenticated'::text)
```

**政策 3：允許已認證使用者更新檔案**
- Policy name: `Allow authenticated users to update receipts`
- Allowed operation: `UPDATE`
- Policy definition:
```sql
(bucket_id = 'expense-receipts'::text) AND (auth.role() = 'authenticated'::text)
```

**政策 4：允許已認證使用者刪除檔案**
- Policy name: `Allow authenticated users to delete receipts`
- Allowed operation: `DELETE`
- Policy definition:
```sql
(bucket_id = 'expense-receipts'::text) AND (auth.role() = 'authenticated'::text)
```

#### 方法 2：使用 SQL Editor

在 Supabase Dashboard → SQL Editor 執行以下 SQL：

```sql
-- 允許已認證使用者上傳檔案
CREATE POLICY "Allow authenticated users to upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'expense-receipts' AND
  auth.role() = 'authenticated'
);

-- 允許已認證使用者讀取檔案
CREATE POLICY "Allow authenticated users to read receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'expense-receipts' AND
  auth.role() = 'authenticated'
);

-- 允許已認證使用者更新檔案
CREATE POLICY "Allow authenticated users to update receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'expense-receipts' AND
  auth.role() = 'authenticated'
);

-- 允許已認證使用者刪除檔案
CREATE POLICY "Allow authenticated users to delete receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'expense-receipts' AND
  auth.role() = 'authenticated'
);
```

### 步驟 4：測試上傳

1. 在報支表單頁面上傳一張發票圖片
2. 檢查 Supabase Dashboard → Storage → `expense-receipts` 是否有檔案
3. 檢查資料庫 `expense_reviews` 表的 `attachment_url` 欄位是否有 URL

## 檔案命名規則

系統會自動產生檔案名稱，格式為：
```
{user_id}/{timestamp}_{timestamp}.{ext}
```

範例：
```
550e8400-e29b-41d4-a716-446655440000/2025-01-09T10-30-00-000Z_1704781800000.jpg
```

## 疑難排解

### 問題 1：上傳失敗，錯誤訊息 "new row violates row-level security policy"

**解決方案**：
- 確認已建立 RLS 政策
- 確認使用者已登入（authenticated）
- 檢查政策定義是否正確

### 問題 2：無法讀取圖片，URL 返回 403

**解決方案**：
- 如果 bucket 是 Private，需要使用 Signed URL 而非 Public URL
- 或檢查 RLS 政策是否允許 SELECT 操作

### 問題 3：上傳成功但 URL 無法顯示

**解決方案**：
- 檢查 bucket 是否設為 Public（如果是 Private，需要使用 Signed URL）
- 或修改前端使用 `createSignedUrl()` 而非 `getPublicUrl()`

## 使用 Signed URL（Private Bucket）

如果 bucket 設為 Private，需要在前端使用 Signed URL：

```typescript
// 取得 Signed URL（有效期 1 小時）
const { data: signedUrlData } = await supabase.storage
  .from('expense-receipts')
  .createSignedUrl(fileName, 3600); // 3600 秒 = 1 小時

if (signedUrlData) {
  attachmentUrl = signedUrlData.signedUrl;
}
```

## 成本估算

- **Supabase Free 方案**：1GB 免費儲存空間
- **Supabase Pro 方案**：100GB 儲存空間（$25/月）

假設每張發票圖片平均 500KB：
- 1000 張 = 500MB（免費方案可容納）
- 10000 張 = 5GB（Pro 方案可容納）

