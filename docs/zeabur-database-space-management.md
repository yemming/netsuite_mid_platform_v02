# Zeabur PostgreSQL 空間管理完全指南

> **場景**: PostgreSQL Volume 空間不足或即將滿載  
> **適用於**: Zeabur 部署的 PostgreSQL 服務  
> **最後更新**: 2025-01-16

---

## 🚨 問題診斷

### 第一步：確認空間使用情況

#### 方法 1：使用我們的診斷 API

```bash
# 訪問診斷 API
curl https://your-app.zeabur.app/api/admin/db-stats

# 或直接在瀏覽器打開
https://your-app.zeabur.app/api/admin/db-stats
```

**你會看到**：
```json
{
  "status": "success",
  "database": {
    "totalSize": "4.2 GB",
    "estimatedSavings": "1.5 GB"
  },
  "tables": [
    { "table": "sync_logs", "rowCount": 250000 },
    { "table": "transaction_references", "rowCount": 120000 }
  ],
  "recommendations": [
    "🔴 sync_logs 表有 250,000 筆記錄，建議清理 90 天前的舊資料"
  ]
}
```

#### 方法 2：在 Zeabur Dashboard 查看

1. 登入 Zeabur
2. 進入你的 Project
3. 點擊 PostgreSQL 服務
4. 查看 **Volumes** 標籤
   - 會顯示：`3.8 GB / 5 GB (76% used)`

#### 方法 3：直接連接資料庫查詢

```sql
-- 查看資料庫總大小
SELECT pg_size_pretty(pg_database_size('zeabur')) as db_size;

-- 查看各表大小
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC
LIMIT 20;

-- 查看索引大小
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_indexes
JOIN pg_class ON indexrelid = pg_class.oid
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 10;
```

---

## 💡 解決方案矩陣

根據你的情況選擇對應方案：

| 情況 | 當前使用 | 解決方案 | 時效 | 成本 |
|------|---------|---------|------|------|
| 🟢 預防 | < 60% | 設定定期清理 | 長期 | 免費 |
| 🟡 警告 | 60-80% | 清理舊資料 | 立即 | 免費 |
| 🟠 緊急 | 80-95% | 清理 + 擴充 Volume | 1-2 小時 | $5-10/月 |
| 🔴 爆滿 | > 95% | 緊急清理 + 立即擴充 | 30 分鐘 | $10-20/月 |
| 🔵 長期 | 持續增長 | 遷移到 Supabase Cloud | 1-2 天 | $0-25/月 |

---

## 🔧 解決方案詳解

### 方案 1：清理舊資料（立即，免費）

#### 1.1 使用自動清理 API

**步驟 1：試運行**（先看看會刪多少）

```bash
curl -X POST https://your-app.zeabur.app/api/admin/cleanup-logs \
  -H "Content-Type: application/json" \
  -d '{
    "daysToKeep": 90,
    "dryRun": true,
    "tables": ["sync_logs", "transaction_references"]
  }'
```

**步驟 2：實際執行**（確認無誤後）

```bash
curl -X POST https://your-app.zeabur.app/api/admin/cleanup-logs \
  -H "Content-Type: application/json" \
  -d '{
    "daysToKeep": 90,
    "dryRun": false,
    "tables": ["sync_logs"]
  }'
```

#### 1.2 手動清理（SQL）

連接到 PostgreSQL 後執行：

```sql
-- 1. 刪除 90 天前的同步日誌
DELETE FROM sync_logs 
WHERE created_at < NOW() - INTERVAL '90 days';

-- 2. 刪除失敗的交易記錄（保留 180 天）
DELETE FROM transaction_references 
WHERE status = 'failed' 
  AND created_at < NOW() - INTERVAL '180 days';

-- 3. 清理成功但很舊的交易記錄（保留 365 天）
DELETE FROM transaction_references 
WHERE status = 'success' 
  AND created_at < NOW() - INTERVAL '365 days';

-- 4. 回收空間（重要！）
VACUUM FULL;

-- 5. 重建索引
REINDEX DATABASE zeabur;
```

**預期效果**：
- `sync_logs` 通常可以釋放 30-50% 空間
- `VACUUM FULL` 會真正回收磁碟空間
- 整個過程可能需要 5-30 分鐘（視資料量而定）

#### 1.3 最容易爆的表

根據經驗，以下表最容易佔空間：

| 表名 | 增長速度 | 清理策略 |
|------|---------|---------|
| `sync_logs` | 🔴 極快 | 保留 30-90 天 |
| `transaction_references` | 🟠 快 | 保留 180-365 天 |
| `ns_*` 主檔表 | 🟢 慢 | 通常不清理（業務資料） |
| `expense_reviews` | 🟡 中 | 歸檔超過 2 年的資料 |

---

### 方案 2：擴充 Volume 空間（1-2 小時，$5-20/月）

#### 2.1 在 Zeabur 擴充 Volume

**步驟**：

1. 登入 Zeabur Dashboard
2. 進入 PostgreSQL 服務
3. 點擊 **Volumes** 標籤
4. 點擊「Resize」或「Upgrade」
5. 選擇新的大小：
   - 5 GB → 10 GB（約 $5-10/月增加）
   - 10 GB → 20 GB（約 $10-20/月增加）
6. 確認並等待擴充完成（通常 5-15 分鐘）

**注意**：
- ✅ **可以線上擴充**，不需要停機
- ✅ **資料不會丟失**
- ⚠️  **只能擴大，不能縮小**（擴充後無法降回去）
- ⚠️  **會增加月費**

#### 2.2 成本估算

| 原始空間 | 擴充後 | 月費增加 | 適用場景 |
|---------|--------|---------|---------|
| 5 GB | 10 GB | +$5-10 | 中小型專案 |
| 10 GB | 20 GB | +$10-15 | 中型專案 |
| 20 GB | 50 GB | +$20-30 | 大型專案 |

**建議**：
- 如果清理後能降到 < 60%，暫時不擴充
- 如果清理後仍 > 70%，建議擴充到 2 倍大小
- 如果資料增長很快，考慮遷移到 Supabase Cloud（見方案 5）

---

### 方案 3：資料歸檔（中期，免費但需開發）

#### 3.1 建立歸檔表

```sql
-- 建立歸檔表（例如歸檔舊的同步日誌）
CREATE TABLE sync_logs_archive (
  LIKE sync_logs INCLUDING ALL
);

-- 將舊資料移到歸檔表
INSERT INTO sync_logs_archive
SELECT * FROM sync_logs
WHERE created_at < NOW() - INTERVAL '180 days';

-- 刪除原表中的舊資料
DELETE FROM sync_logs
WHERE created_at < NOW() - INTERVAL '180 days';

-- 回收空間
VACUUM FULL sync_logs;
```

#### 3.2 匯出到外部儲存

```bash
# 匯出舊資料到 CSV
psql -h postgres.zeabur.internal -U root -d zeabur -c \
  "COPY (SELECT * FROM sync_logs WHERE created_at < NOW() - INTERVAL '365 days') TO STDOUT CSV HEADER" \
  > sync_logs_archive_$(date +%Y%m%d).csv

# 上傳到 Supabase Storage 或 S3
# （需要額外腳本）

# 刪除已匯出的資料
psql -h postgres.zeabur.internal -U root -d zeabur -c \
  "DELETE FROM sync_logs WHERE created_at < NOW() - INTERVAL '365 days';"
```

---

### 方案 4：資料庫優化（免費，立即）

#### 4.1 刪除不必要的索引

```sql
-- 查看索引使用情況
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- 刪除從未使用的索引（idx_scan = 0）
-- 注意：小心刪除，確認不是新建立的索引
DROP INDEX IF EXISTS your_unused_index;
```

#### 4.2 優化表結構

```sql
-- 查找有 NULL 值的大欄位
SELECT 
  attname,
  n_distinct,
  null_frac,
  avg_width
FROM pg_stats
WHERE tablename = 'your_table'
  AND null_frac > 0.5
ORDER BY avg_width DESC;

-- 考慮將大欄位移到單獨的表
```

#### 4.3 壓縮資料（PostgreSQL 內建）

```sql
-- 啟用表壓縮（對大表有效）
ALTER TABLE sync_logs SET (toast_tuple_target = 128);

-- 重建表以應用壓縮
VACUUM FULL sync_logs;
```

---

### 方案 5：遷移到 Supabase Cloud（長期，$0-25/月）

#### 5.1 為什麼遷移？

| Zeabur PostgreSQL | Supabase Cloud |
|------------------|----------------|
| 固定空間（需付費擴充） | 500 MB 免費，$25/月 8GB |
| 自己管理備份 | 自動每日備份 |
| 基本功能 | 完整功能（Auth, Storage, Realtime） |
| 單一資料庫 | 多專案支援 |

**適合遷移的情況**：
- 資料持續快速增長
- 需要 Supabase 的進階功能
- 想要自動備份和更好的監控

#### 5.2 遷移步驟

**步驟 1：建立 Supabase 專案**

1. 前往 [Supabase](https://supabase.com)
2. 建立新專案
3. 記錄連接資訊

**步驟 2：匯出現有資料**

```bash
# 匯出整個資料庫
pg_dump -h postgres.zeabur.internal -U root -d zeabur -F c -f backup.dump

# 或只匯出結構和資料（SQL 格式）
pg_dump -h postgres.zeabur.internal -U root -d zeabur > backup.sql
```

**步驟 3：匯入到 Supabase**

```bash
# 方法 1：使用 pg_restore（推薦）
pg_restore -h db.xxx.supabase.co -U postgres -d postgres backup.dump

# 方法 2：使用 psql
psql -h db.xxx.supabase.co -U postgres -d postgres < backup.sql
```

**步驟 4：更新環境變數**

在 Zeabur 的 Next.js 服務中：

```env
# 改為 Supabase Cloud
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**步驟 5：驗證並切換**

1. 測試新的 Supabase 連接
2. 確認資料完整
3. 停止寫入舊資料庫
4. 切換到新資料庫
5. 刪除 Zeabur PostgreSQL 服務（可選）

---

## 🔮 預防措施（最重要！）

### 1. 設定定期清理（用 n8n）

**在 n8n 中建立工作流**：

```
觸發器: Schedule (每週日凌晨 2:00)
  ↓
HTTP Request: POST /api/admin/cleanup-logs
  Body: { "daysToKeep": 90, "dryRun": false }
  ↓
發送通知: Slack/Email（清理結果）
```

### 2. 設定空間監控告警

**建立監控 API**：

```typescript
// app/api/admin/space-alert/route.ts
export async function GET() {
  // 查詢資料庫大小
  // 如果 > 80%，發送告警
  // 返回狀態
}
```

**在 n8n 中每天執行**：

```
觸發器: Schedule (每天早上 9:00)
  ↓
HTTP Request: GET /api/admin/space-alert
  ↓
條件判斷: 如果使用率 > 80%
  ↓
發送告警: Slack/Email
```

### 3. 設定資料保留政策

在專案中建立文件 `DATA_RETENTION_POLICY.md`：

```markdown
# 資料保留政策

| 表名 | 保留期限 | 清理頻率 |
|------|---------|---------|
| sync_logs | 90 天 | 每週 |
| transaction_references | 365 天 | 每月 |
| expense_reviews | 3 年 | 每年 |
| ns_* 主檔 | 永久 | 不清理 |
```

### 4. 優化同步邏輯

**減少日誌寫入**：

```typescript
// 只記錄失敗的同步，成功的可以不記錄
if (syncResult.status === 'failed') {
  await logSync(syncResult);
}

// 或者使用分級日誌
await logSync({
  ...syncResult,
  level: syncResult.status === 'failed' ? 'error' : 'info',
  // info 級別的日誌只保留 30 天
});
```

---

## 📊 實戰案例

### 案例 1：緊急空間爆滿（95%）

**情況**：
- Volume: 5 GB
- 已使用: 4.75 GB (95%)
- 主要佔用: `sync_logs` (3.2 GB)

**解決方案**：

```bash
# 1. 立即清理舊日誌（保留 30 天）
curl -X POST https://your-app.zeabur.app/api/admin/cleanup-logs \
  -H "Content-Type: application/json" \
  -d '{"daysToKeep": 30, "dryRun": false}'

# 2. 手動執行 VACUUM
psql -h postgres.zeabur.internal -U root -d zeabur -c "VACUUM FULL;"

# 3. 擴充到 10 GB（立即）
在 Zeabur Dashboard 擴充 Volume

# 結果: 使用率降到 35%（3.5 GB / 10 GB）
```

### 案例 2：持續增長（每月 +1 GB）

**情況**：
- 資料每月增長 1 GB
- 主要是業務資料，不能隨意刪除

**解決方案**：

```
1. 短期: 擴充到 20 GB（夠用 15 個月）
2. 中期: 建立資料歸檔機制
3. 長期: 遷移到 Supabase Cloud（無限擴充）
```

---

## 🎯 決策流程圖

```
空間使用率？
  ├─ < 60% → ✅ 健康，設定定期清理
  ├─ 60-80% → 🟡 警告，清理舊資料
  ├─ 80-90% → 🟠 緊急，清理 + 考慮擴充
  └─ > 90% → 🔴 爆滿
      ├─ 立即清理（保留 30 天）
      ├─ 執行 VACUUM FULL
      ├─ 緊急擴充 Volume
      └─ 規劃長期方案
          ├─ 資料增長快 → 遷移到 Supabase Cloud
          └─ 資料增長慢 → 定期清理 + 適當擴充
```

---

## 💰 成本效益分析

### 方案對比（以 5 GB 起始為例）

| 方案 | 初始成本 | 月費 | 維護時間 | 擴充性 | 推薦度 |
|------|---------|------|---------|--------|--------|
| **定期清理** | $0 | $0 | 1 小時/月 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **擴充到 10GB** | $0 | +$10 | 0 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **擴充到 20GB** | $0 | +$20 | 0 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Supabase Cloud** | $0 | $0-25 | 0 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**建議策略**：
1. **初期**（< 5 GB）：定期清理
2. **中期**（5-20 GB）：清理 + 適度擴充
3. **長期**（> 20 GB）：遷移到 Supabase Cloud

---

## 📚 參考資源

- [PostgreSQL VACUUM 文件](https://www.postgresql.org/docs/current/sql-vacuum.html)
- [Zeabur Volumes 文件](https://zeabur.com/docs/deploy/volumes)
- [Supabase 遷移指南](https://supabase.com/docs/guides/resources/migrating-to-supabase)

---

**文檔維護**: 隨著 Zeabur 功能更新，請持續更新此文件。  
**最後更新**: 2025-01-16  
**版本**: 1.0

