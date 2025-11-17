# Zeabur 部署檢查清單（完整版）

> **適用於**: NetSuite Platform V3 全端部署  
> **包含服務**: Next.js + PostgreSQL + Redis + n8n  
> **最後更新**: 2025-01-16

---

## 📋 階段一：Zeabur 專案建立

### 1.1 建立新專案

- [ ] 登入 [Zeabur Dashboard](https://zeabur.com)
- [ ] 點擊「Create Project」
- [ ] 命名專案：`netsuite-platform-prod`（或你的專案名稱）
- [ ] 選擇地區：選擇離你最近的地區（例如：Hong Kong、Singapore）

---

## 🗄️ 階段二：部署 PostgreSQL

### 選項 A：使用 Zeabur PostgreSQL（推薦）

#### 2.1 部署服務

- [ ] 在 Zeabur Project 中點擊「Add Service」
- [ ] 選擇「Marketplace」→「PostgreSQL」
- [ ] 服務名稱：`postgres`
- [ ] 版本：`16.x`（最新穩定版）
- [ ] Volume：選擇 `5GB` 或更大

#### 2.2 獲取連接資訊

- [ ] 點擊 PostgreSQL 服務
- [ ] 進入「Variables」標籤
- [ ] 記錄以下資訊：
  ```
  POSTGRES_HOST: postgres.zeabur.internal
  POSTGRES_PORT: 5432
  POSTGRES_USER: root
  POSTGRES_PASSWORD: <自動生成的密碼>
  POSTGRES_DATABASE: zeabur
  ```

#### 2.3 建立連接字串

- [ ] 格式化連接字串：
  ```
  postgresql://root:<password>@postgres.zeabur.internal:5432/zeabur
  ```
- [ ] 保存此連接字串（稍後會用到）

### 選項 B：使用 Supabase Cloud（更簡單）

#### 2.1 建立 Supabase 專案

- [ ] 前往 [Supabase](https://supabase.com)
- [ ] 點擊「New Project」
- [ ] 設定專案名稱和資料庫密碼
- [ ] 選擇地區（建議選擇離 Zeabur 相同的地區）

#### 2.2 獲取 Supabase 連接資訊

- [ ] 在 Supabase Dashboard → Settings → API
- [ ] 記錄以下資訊：
  ```
  Project URL: https://xxx.supabase.co
  Anon Key: eyJhbGc...
  Service Role Key: eyJhbGc...
  ```
- [ ] 在 Settings → Database → Connection string
- [ ] 記錄：
  ```
  Database URL: postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
  ```

#### 2.3 執行資料庫遷移

- [ ] 在 Supabase SQL Editor 中執行所有 `.sql` 檔案
- [ ] 確認表已建立（查看 Table Editor）

---

## 🔴 階段三：部署 Redis

### 3.1 部署服務

- [ ] 在同一個 Zeabur Project 中，點擊「Add Service」
- [ ] 選擇「Marketplace」→「Redis」
- [ ] 服務名稱：`redis`
- [ ] 版本：`7.x`
- [ ] Volume：選擇 `1GB`（通常足夠）

### 3.2 獲取連接資訊

- [ ] 點擊 Redis 服務
- [ ] 進入「Variables」標籤
- [ ] 記錄以下資訊：
  ```
  REDIS_HOST: redis.zeabur.internal
  REDIS_PORT: 6379
  REDIS_PASSWORD: <自動生成的密碼>
  ```

### 3.3 建立連接字串

- [ ] 格式化連接字串：
  ```
  redis://:<password>@redis.zeabur.internal:6379
  ```
- [ ] 保存此連接字串

---

## 🤖 階段四：部署 n8n（可選）

### 4.1 部署服務

- [ ] 在同一個 Zeabur Project 中，點擊「Add Service」
- [ ] 選擇「Marketplace」→「n8n」
- [ ] 服務名稱：`n8n`
- [ ] Volume：選擇 `2GB`

### 4.2 設定 n8n 環境變數

- [ ] 點擊 n8n 服務 → Variables
- [ ] 添加以下環境變數：

```env
# 基本認證
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=<設定你的強密碼>

# Webhook 設定
WEBHOOK_URL=https://n8n-<your-service-id>.zeabur.app

# 時區
GENERIC_TIMEZONE=Asia/Taipei
TZ=Asia/Taipei
```

### 4.3 （可選）連接 PostgreSQL

如果你想將 n8n 工作流持久化到資料庫：

- [ ] 添加以下環境變數：

```env
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=postgres.zeabur.internal
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=root
DB_POSTGRESDB_PASSWORD=<你的 PostgreSQL 密碼>
```

- [ ] 在 PostgreSQL 中建立 `n8n` 資料庫：
  ```sql
  CREATE DATABASE n8n;
  ```

### 4.4 驗證 n8n

- [ ] 訪問 n8n URL：`https://n8n-<service-id>.zeabur.app`
- [ ] 使用設定的用戶名和密碼登入
- [ ] 確認可以建立工作流

---

## 🚀 階段五：部署 Next.js 應用

### 5.1 連接 Git 倉庫

- [ ] 在 Zeabur Project 中，點擊「Add Service」
- [ ] 選擇「Git」
- [ ] 授權 GitHub/GitLab
- [ ] 選擇你的倉庫：`NetSuite_Platform_V3`
- [ ] 選擇分支：`main`

### 5.2 Zeabur 會自動偵測

- [ ] 確認 Zeabur 偵測到 Next.js 專案
- [ ] 構建命令應為：`npm run build`
- [ ] 啟動命令應為：`node server.js`（根據你的 zeabur.json）

### 5.3 設定環境變數（關鍵步驟！）

點擊 Next.js 服務 → Variables，添加以下變數：

#### 必需變數

```env
# === Supabase（如果用 Supabase Cloud）===
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# === 或者（如果用 Zeabur PostgreSQL）===
DATABASE_URL=postgresql://root:<password>@postgres.zeabur.internal:5432/zeabur

# === Redis ===
REDIS_URL=redis://:<password>@redis.zeabur.internal:6379

# === NetSuite OAuth ===
NETSUITE_ACCOUNT_ID=your_account_id
NETSUITE_CONSUMER_KEY=your_consumer_key
NETSUITE_CONSUMER_SECRET=your_consumer_secret
NETSUITE_TOKEN_ID=your_token_id
NETSUITE_TOKEN_SECRET=your_token_secret

# === Next.js ===
NODE_ENV=production
```

#### 可選變數

```env
# === n8n（如果使用）===
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n-<service-id>.zeabur.app

# === Google Maps（如果使用現場服務）===
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

### 5.4 部署

- [ ] 檢查所有環境變數已正確設定
- [ ] 點擊「Deploy」或等待自動部署
- [ ] 查看建置日誌（Logs 標籤）
- [ ] 等待部署完成（通常需要 3-5 分鐘）

### 5.5 獲取應用 URL

- [ ] 部署完成後，Zeabur 會自動生成 URL
- [ ] 格式：`https://<your-app>.zeabur.app`
- [ ] 記錄此 URL

---

## 🔗 階段六：配置服務間連接

### 6.1 更新 Supabase 設定（如果使用 Supabase Cloud）

- [ ] 前往 Supabase Dashboard → Authentication → URL Configuration
- [ ] 設定 **Site URL**：
  ```
  https://<your-app>.zeabur.app
  ```
- [ ] 添加 **Redirect URLs**：
  ```
  https://<your-app>.zeabur.app/dashboard
  https://<your-app>.zeabur.app/**
  ```
- [ ] 點擊 Save

### 6.2 測試內部服務連接

在你的本地終端執行（需要先獲取 Zeabur CLI）：

```bash
# 測試 PostgreSQL
curl https://<your-app>.zeabur.app/api/test/db

# 測試 Redis
curl https://<your-app>.zeabur.app/api/test/redis

# 測試 n8n
curl https://<your-app>.zeabur.app/api/test/n8n

# 完整測試
curl https://<your-app>.zeabur.app/api/test/all
```

或直接在瀏覽器中訪問這些 URL。

---

## ✅ 階段七：驗證部署

### 7.1 前端驗證

- [ ] 訪問應用首頁：`https://<your-app>.zeabur.app`
- [ ] 檢查頁面是否正常載入
- [ ] 檢查瀏覽器控制台是否有錯誤

### 7.2 認證功能驗證

- [ ] 嘗試註冊新帳號
- [ ] 檢查是否收到驗證郵件（如果啟用）
- [ ] 嘗試登入
- [ ] 確認可以訪問 Dashboard

### 7.3 API 功能驗證

- [ ] 訪問：`/api/health`
  - 應返回：`{ "status": "ok" }`
- [ ] 訪問：`/api/test/all`
  - 應返回所有服務的狀態
- [ ] 檢查 NetSuite 連接（在 Dashboard 中）
- [ ] 嘗試執行一次同步（例如同步 Subsidiary）

### 7.4 n8n 驗證（如果使用）

- [ ] 訪問 n8n：`https://n8n-<service-id>.zeabur.app`
- [ ] 登入 n8n
- [ ] 建立一個簡單的測試工作流
- [ ] 從 Next.js 應用觸發 webhook

---

## 📊 階段八：監控設定

### 8.1 設定 Zeabur 監控

- [ ] 在 Zeabur Dashboard 中，進入每個服務
- [ ] 檢查「Metrics」標籤：
  - CPU 使用率
  - 記憶體使用率
  - 網路流量

### 8.2 設定日誌查看

- [ ] 在 Zeabur Dashboard 中，進入「Logs」標籤
- [ ] 確認可以看到即時日誌
- [ ] 設定日誌過濾器（如果需要）

### 8.3 設定 Alert（如果可用）

- [ ] CPU > 80% 發送通知
- [ ] 記憶體 > 90% 發送通知
- [ ] 服務離線發送通知

---

## 💾 階段九：備份策略

### 9.1 PostgreSQL 備份

**手動備份**：

- [ ] 使用 `pg_dump` 匯出資料庫：
  ```bash
  pg_dump -h postgres.zeabur.internal -U root zeabur > backup.sql
  ```

**自動備份（建議）**：

- [ ] 在 n8n 中建立定時工作流
- [ ] 每天自動執行 `pg_dump`
- [ ] 上傳到 Supabase Storage 或 S3

### 9.2 n8n 工作流備份

- [ ] 在 n8n 中匯出所有工作流（Settings → Export）
- [ ] 保存到 Git 倉庫
- [ ] 定期更新

### 9.3 Redis 備份

Redis 的 AOF 持久化預設開啟，但建議：

- [ ] 定期備份 `/data` 目錄（Zeabur Volume）
- [ ] 或者使用 Redis `SAVE` 命令定期建立 RDB 快照

---

## 🔒 階段十：安全性檢查

### 10.1 環境變數安全

- [ ] 所有密鑰都使用 Zeabur 環境變數（不要寫死在程式碼中）
- [ ] 確認 `.env.local` 沒有被提交到 Git
- [ ] 使用強密碼（n8n、資料庫等）

### 10.2 網路安全

- [ ] PostgreSQL 和 Redis 只能通過內部網路訪問（`.zeabur.internal`）
- [ ] n8n 使用 Basic Auth 保護
- [ ] Next.js API Routes 使用 Supabase Auth

### 10.3 HTTPS

- [ ] 確認所有 Zeabur 提供的 URL 都使用 HTTPS
- [ ] 檢查 SSL 憑證有效

---

## 🎯 階段十一：性能優化（可選）

### 11.1 CDN 設定

- [ ] 如果使用自訂域名，考慮使用 Cloudflare CDN
- [ ] 設定快取策略

### 11.2 資料庫優化

- [ ] 為常用查詢添加索引
- [ ] 檢查慢查詢日誌
- [ ] 設定連接池

### 11.3 Redis 快取策略

- [ ] 識別熱點資料
- [ ] 設定合理的 TTL
- [ ] 實作快取預熱（warm-up）

---

## 📝 最終檢查清單

### 核心功能

- [ ] 應用可以訪問
- [ ] 用戶可以註冊和登入
- [ ] Dashboard 功能正常
- [ ] NetSuite API 連接成功
- [ ] 同步功能可以執行

### 服務狀態

- [ ] PostgreSQL 運行正常並有 Volume
- [ ] Redis 運行正常並有 Volume
- [ ] n8n 運行正常並有 Volume（如果使用）
- [ ] Next.js 應用運行正常

### 測試端點

- [ ] `/api/health` 返回 OK
- [ ] `/api/test/all` 所有測試通過
- [ ] `/api/test/redis` Redis 測試通過
- [ ] `/api/test/n8n` n8n 測試通過（如果使用）

### 監控和備份

- [ ] 可以查看即時日誌
- [ ] 可以查看監控指標
- [ ] 備份策略已設定
- [ ] Alert 已設定（如果可用）

---

## 🆘 常見問題排查

### 問題：Next.js 建置失敗

**檢查**：
1. 查看 Zeabur Logs 中的錯誤訊息
2. 確認 `package.json` 中的腳本正確
3. 確認 Node.js 版本符合要求（>= 20.0.0）

**解決**：
- 修正錯誤後，推送到 Git，Zeabur 會自動重新部署

### 問題：環境變數未生效

**檢查**：
1. 確認在 Zeabur Variables 頁面已保存
2. 前端變數必須有 `NEXT_PUBLIC_` 前綴

**解決**：
- 修改環境變數後，需要重新部署（Redeploy）

### 問題：無法連接 PostgreSQL 或 Redis

**檢查**：
1. 確認服務正在運行
2. 確認使用內部域名（`.zeabur.internal`）
3. 確認密碼正確

**解決**：
- 重啟服務
- 檢查連接字串格式

### 問題：n8n 工作流執行失敗

**檢查**：
1. 查看 n8n Logs
2. 確認 Webhook URL 正確
3. 確認請求格式正確

**解決**：
- 在 n8n 中測試工作流
- 檢查 Next.js 發送的請求內容

---

## 📚 後續維護

### 每週

- [ ] 檢查 Zeabur Logs 是否有異常
- [ ] 檢查監控指標
- [ ] 檢查備份是否正常執行

### 每月

- [ ] 更新依賴套件（`npm update`）
- [ ] 檢查 Zeabur 計費
- [ ] 檢查資料庫和 Volume 使用量

### 每季

- [ ] 審查安全性設定
- [ ] 優化資料庫查詢
- [ ] 清理不必要的資料和日誌

---

## 🎉 部署完成！

如果以上所有步驟都完成並通過驗證，恭喜你！你的 NetSuite Platform V3 已經成功部署到 Zeabur。

**下一步**：
1. 開始使用應用
2. 監控性能和錯誤
3. 根據使用情況調整資源配置
4. 持續優化和改進

**需要幫助？**
- 查看 `docs/zeabur-full-stack-guide.md` 獲取詳細說明
- 查看 `TROUBLESHOOTING.md` 排查問題
- 聯繫 Zeabur 支援或專案團隊

---

**文檔維護**: 此清單應隨部署流程演進持續更新。
**最後更新**: 2025-01-16
**版本**: 1.0

