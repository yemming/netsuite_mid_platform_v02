# 環境變數設定指南

> **用途**: 列出所有需要的環境變數及其說明  
> **適用於**: Zeabur 部署和本地開發

---

## 📋 完整環境變數列表

### 🗄️ Supabase / PostgreSQL

#### 選項 A：使用 Supabase Cloud

```env
# Supabase Project URL（必需）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anon Key（必需）
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**獲取方式**：
1. 前往 [Supabase Dashboard](https://app.supabase.com)
2. 選擇你的專案
3. Settings → API
4. 複製 `Project URL` 和 `anon public` key

#### 選項 B：使用 Zeabur PostgreSQL

```env
# 直接資料庫連接（必需）
DATABASE_URL=postgresql://root:your_password@postgres.zeabur.internal:5432/zeabur
```

**獲取方式**：
1. 在 Zeabur Dashboard 中點擊 PostgreSQL 服務
2. Variables 標籤
3. 複製 `POSTGRES_PASSWORD`
4. 格式化為連接字串

---

### 🔴 Redis

```env
# Redis 連接 URL（必需）
REDIS_URL=redis://:your_redis_password@redis.zeabur.internal:6379
```

**獲取方式**：
1. 在 Zeabur Dashboard 中點擊 Redis 服務
2. Variables 標籤
3. 複製 `REDIS_PASSWORD`
4. 格式化為連接字串：`redis://:<password>@redis.zeabur.internal:6379`

**注意**：
- `:` 後面緊接密碼，前面沒有用戶名
- 內部域名必須是 `redis.zeabur.internal`

---

### 🤖 n8n（可選）

```env
# n8n Webhook Base URL（可選）
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n-abc123.zeabur.app
```

**獲取方式**：
1. 部署 n8n 到 Zeabur
2. 在 Zeabur Dashboard 中查看 n8n 服務的 URL
3. 複製完整 URL（不包含 `/webhook/...` 部分）

**使用場景**：
- 自動化工作流
- 與外部系統整合
- 定時任務

---

### 🔐 NetSuite OAuth

```env
# NetSuite Account ID（必需）
NETSUITE_ACCOUNT_ID=1234567

# Consumer Key（必需）
NETSUITE_CONSUMER_KEY=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Consumer Secret（必需）
NETSUITE_CONSUMER_SECRET=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Token ID（必需）
NETSUITE_TOKEN_ID=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Token Secret（必需）
NETSUITE_TOKEN_SECRET=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

**獲取方式**：

#### 1. 建立 Integration Record

1. 登入 NetSuite
2. Setup → Integration → Manage Integrations → New
3. 填寫：
   - Name: `NetSuite Platform V3`
   - State: `Enabled`
   - Token-Based Authentication: ✅ 勾選
4. Save
5. 記錄 **Consumer Key** 和 **Consumer Secret**

#### 2. 建立 Access Token

1. Setup → Users/Roles → Access Tokens → New
2. 選擇：
   - Application Name: `NetSuite Platform V3`（剛才建立的 Integration）
   - User: 選擇有權限的用戶
   - Role: 選擇適當的角色
3. Save
4. 記錄 **Token ID** 和 **Token Secret**（只會顯示一次！）

#### 3. Account ID

- 登入 NetSuite 後，URL 中的數字就是 Account ID
- 例如：`https://1234567.app.netsuite.com` → Account ID 是 `1234567`

---

### ⚙️ Next.js

```env
# Node 環境（必需）
NODE_ENV=production

# 伺服器端口（可選，Zeabur 會自動設定）
PORT=3000
```

---

### 🗺️ Google Maps API（可選）

```env
# Google Maps API Key（如果使用現場服務管理模組）
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyABC123...
```

**獲取方式**：
1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 啟用 Maps JavaScript API
3. 建立 API Key
4. 限制 API Key 使用範圍（建議）

**使用場景**：
- 現場服務管理（FSM）模組
- 人員位置追蹤
- 路線規劃

---

### 💳 LINE Pay（可選）

```env
# LINE Pay Channel ID（如果使用 LINE Pay 整合）
LINE_PAY_CHANNEL_ID=1234567890

# LINE Pay Channel Secret
LINE_PAY_CHANNEL_SECRET=abc123def456...
```

**獲取方式**：
1. 申請 LINE Pay 商家帳號
2. 在 LINE Pay Console 中建立 Channel
3. 獲取 Channel ID 和 Secret

**使用場景**：
- 費用報銷系統
- 員工支付整合

---

## 🎯 Zeabur 環境變數設定步驟

### 1. 前往 Zeabur Dashboard

1. 登入 [Zeabur](https://zeabur.com)
2. 選擇你的專案
3. 點擊 Next.js 服務

### 2. 進入 Variables 標籤

點擊「Variables」或「Environment Variables」標籤

### 3. 逐一添加環境變數

對於每個環境變數：

1. 點擊「Add Variable」
2. 輸入 Key（例如：`REDIS_URL`）
3. 輸入 Value（例如：`redis://:password@redis.zeabur.internal:6379`）
4. 點擊「Save」

### 4. 重要提醒

- ✅ **前端變數**必須有 `NEXT_PUBLIC_` 前綴
- ✅ **後端變數**不需要前綴
- ✅ 值中不要有多餘的空格或引號
- ✅ 修改後需要**重新部署**才會生效

### 5. 重新部署

1. 點擊「Redeploy」按鈕
2. 或者推送新的 commit 到 Git 觸發自動部署

---

## 🔍 驗證環境變數

### 方法 1：使用測試 API

部署完成後，訪問：

```
https://your-app.zeabur.app/api/test/all
```

應該返回所有服務的連接狀態。

### 方法 2：查看瀏覽器控制台

1. 打開你的應用
2. 按 F12 開啟開發者工具
3. Console 標籤中不應該有「環境變數未設定」的錯誤

### 方法 3：檢查 Zeabur Logs

1. 在 Zeabur Dashboard 中進入 Logs 標籤
2. 查找啟動日誌
3. 確認沒有環境變數相關的錯誤

---

## 📝 環境變數檢查清單

### 核心變數（必需）

- [ ] `NEXT_PUBLIC_SUPABASE_URL` 或 `DATABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`（如果用 Supabase Cloud）
- [ ] `REDIS_URL`
- [ ] `NETSUITE_ACCOUNT_ID`
- [ ] `NETSUITE_CONSUMER_KEY`
- [ ] `NETSUITE_CONSUMER_SECRET`
- [ ] `NETSUITE_TOKEN_ID`
- [ ] `NETSUITE_TOKEN_SECRET`
- [ ] `NODE_ENV=production`

### 可選變數

- [ ] `NEXT_PUBLIC_N8N_WEBHOOK_URL`（如果使用 n8n）
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`（如果使用地圖功能）
- [ ] `LINE_PAY_CHANNEL_ID`（如果使用 LINE Pay）
- [ ] `LINE_PAY_CHANNEL_SECRET`

---

## 🚨 常見錯誤

### 錯誤 1：前端變數未生效

**症狀**：
```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL); // undefined
```

**原因**：
1. 變數名稱沒有 `NEXT_PUBLIC_` 前綴
2. 部署時環境變數還沒設定
3. 修改後沒有重新部署

**解決**：
- 確保變數名稱正確
- 重新部署應用

### 錯誤 2：內部服務連接失敗

**症狀**：
```
Error: connect ECONNREFUSED
```

**原因**：
1. 使用了外部域名而不是 `.zeabur.internal`
2. 服務名稱錯誤
3. 服務未啟動

**解決**：
- 確認使用 `postgres.zeabur.internal` 和 `redis.zeabur.internal`
- 檢查服務是否在 Zeabur Dashboard 中顯示為運行狀態

### 錯誤 3：NetSuite API 認證失敗

**症狀**：
```
Error: Invalid login credentials
```

**原因**：
1. OAuth 憑證錯誤
2. Token 已過期或被撤銷
3. Account ID 錯誤

**解決**：
- 重新檢查所有 NetSuite 憑證
- 在 NetSuite 中確認 Integration 和 Token 是否啟用
- 確認 Account ID 正確（不含連字符或其他字元）

---

## 💡 最佳實踐

### 1. 使用環境變數而非硬編碼

❌ **錯誤**：
```typescript
const supabaseUrl = 'https://abc123.supabase.co';
```

✅ **正確**：
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
```

### 2. 驗證環境變數存在

```typescript
if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL 環境變數未設定');
}
```

### 3. 使用不同的環境

建議為不同環境建立不同的 Zeabur Projects：

- **開發環境**：`netsuite-platform-dev`
  - 連接 `dev` 分支
  - 使用測試資料庫
  
- **測試環境**：`netsuite-platform-staging`
  - 連接 `staging` 分支
  - 使用獨立資料庫
  
- **生產環境**：`netsuite-platform-prod`
  - 連接 `main` 分支
  - 使用生產資料庫

### 4. 定期輪換密鑰

- 每季更換 NetSuite Token
- 每半年更換資料庫密碼
- 記錄密鑰更換日期

---

## 📖 參考資料

- [Zeabur 環境變數文件](https://zeabur.com/docs/environment-variables)
- [Next.js 環境變數指南](https://nextjs.org/docs/basic-features/environment-variables)
- [NetSuite OAuth 設定指南](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_157771733782.html)
- [Supabase 連接指南](https://supabase.com/docs/guides/api)

---

**文檔維護**: 隨著新功能加入，請持續更新此文件。  
**最後更新**: 2025-01-16  
**版本**: 1.0

