# 圖檔儲存策略說明

## 推薦方案：Supabase Storage

### 為什麼選擇 Supabase Storage？

1. **專為檔案設計**：Supabase Storage 是專門用來儲存檔案的服務，不是資料庫欄位
2. **效能優異**：使用 CDN 加速，讀取速度快
3. **權限控制**：可以使用 RLS (Row Level Security) 控制存取權限
4. **成本效益**：Supabase 免費方案提供 1GB 儲存空間，付費方案也很便宜
5. **整合簡單**：與現有的 Supabase 資料庫完美整合，不需要額外的 API 認證

### 實作方式

1. **在 Supabase 建立 Storage Bucket**
   - Bucket 名稱：`expense-receipts`
   - 設定為 Private（需要認證才能存取）

2. **上傳流程**
   - 前端：使用 Supabase Client 上傳圖片到 Storage
   - 取得 Public URL 或 Signed URL
   - 將 URL 存入資料庫的 `attachment_url` 欄位

3. **讀取流程**
   - 從資料庫讀取 `attachment_url`
   - 直接使用 URL 顯示圖片（Public URL）或取得 Signed URL（Private）

### 資料庫欄位調整

```sql
-- 保留 attachment_base64 作為備用（向後相容）
-- 新增 attachment_url 欄位
ALTER TABLE expense_reviews 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_expense_reviews_attachment_url 
ON expense_reviews(attachment_url) WHERE attachment_url IS NOT NULL;
```

### 成本估算

假設每張發票圖片平均 500KB：
- 1000 張發票 = 500MB
- 10000 張發票 = 5GB
- Supabase Free 方案：1GB 免費
- Supabase Pro 方案：100GB 儲存空間（$25/月）

### 與 Base64 方案比較

| 項目 | Base64 (資料庫) | Supabase Storage |
|------|----------------|------------------|
| 儲存空間 | 增加 33% | 原始大小 |
| 資料庫大小 | 會變大 | 只存 URL |
| 查詢效能 | 可能變慢 | 不受影響 |
| 讀取速度 | 快 | 快（CDN） |
| 權限控制 | 資料庫 RLS | Storage RLS |
| 成本 | 資料庫儲存成本 | Storage 成本（通常更便宜） |

## 結論

**建議使用 Supabase Storage**，因為：
1. 專案已經在使用 Supabase，整合最簡單
2. 效能和成本都更好
3. 未來擴展性更佳
4. 符合最佳實踐

如果圖檔數量很少（< 100 張），暫時用 Base64 也可以，但建議盡快遷移到 Storage。

