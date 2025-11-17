# Zeabur 快速開始指南（5 分鐘版）

> **目標**: 最快速度在 Zeabur 上部署完整技術堆疊  
> **假設**: 你已經有 Zeabur 和 GitHub 帳號

---

## 🚀 第一步：部署所有服務（2 分鐘）

### 1. 建立 Zeabur Project

```
1. 前往 https://zeabur.com
2. 點擊「Create Project」
3. 命名：netsuite-platform-prod
```

### 2. 一次性添加所有服務

在同一個 Project 中：

| 順序 | 服務 | 來源 | 配置 |
|------|------|------|------|
| 1️⃣ | PostgreSQL | Marketplace → PostgreSQL | Version: 16.x, Volume: 5GB |
| 2️⃣ | Redis | Marketplace → Redis | Version: 7.x, Volume: 1GB |
| 3️⃣ | n8n (可選) | Marketplace → n8n | Volume: 2GB |
| 4️⃣ | Next.js | Git → 你的倉庫 | Branch: main |

**提示**：前 3 個服務會在 1-2 分鐘內啟動完成。

---

## ⚙️ 第二步：配置環境變數（2 分鐘）

### 獲取自動生成的密碼

1. **PostgreSQL**:
   - 點擊 PostgreSQL 服務 → Variables
   - 複製 `POSTGRES_PASSWORD`
   - 格式化：`postgresql://root:<密碼>@postgres.zeabur.internal:5432/zeabur`

2. **Redis**:
   - 點擊 Redis 服務 → Variables
   - 複製 `REDIS_PASSWORD`
   - 格式化：`redis://:<密碼>@redis.zeabur.internal:6379`

### 設定 Next.js 環境變數

點擊 Next.js 服務 → Variables，**複製貼上以下內容**並替換 `<...>` 部分：

```env
# === 資料庫（選擇其一）===
# 選項 A：Zeabur PostgreSQL
DATABASE_URL=postgresql://root:<POSTGRES_PASSWORD>@postgres.zeabur.internal:5432/zeabur

# 選項 B：Supabase Cloud（如果已有）
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# === Redis ===
REDIS_URL=redis://:<REDIS_PASSWORD>@redis.zeabur.internal:6379

# === NetSuite（稍後填寫）===
NETSUITE_ACCOUNT_ID=<your-account-id>
NETSUITE_CONSUMER_KEY=<your-consumer-key>
NETSUITE_CONSUMER_SECRET=<your-consumer-secret>
NETSUITE_TOKEN_ID=<your-token-id>
NETSUITE_TOKEN_SECRET=<your-token-secret>

# === Next.js ===
NODE_ENV=production
```

**點擊「Save」然後「Redeploy」**

---

## ✅ 第三步：驗證部署（1 分鐘）

### 等待部署完成

在 Zeabur Dashboard 中，等待 Next.js 服務顯示 ✅（通常 3-5 分鐘）

### 快速測試

1. **訪問應用**：
   ```
   https://<your-app>.zeabur.app
   ```

2. **測試所有服務**：
   ```
   https://<your-app>.zeabur.app/api/test/all
   ```

   **期望結果**：
   ```json
   {
     "status": "success",
     "message": "系統測試完成: 2 成功, 0 錯誤, 1 警告",
     "results": [
       { "service": "PostgreSQL", "status": "success" },
       { "service": "Redis", "status": "success" },
       { "service": "n8n", "status": "warning" }
     ]
   }
   ```

---

## 🎯 完成！

**現在你已經有**：
- ✅ Next.js 應用運行在 Zeabur
- ✅ PostgreSQL 資料庫（帶持久化）
- ✅ Redis 快取層（帶持久化）
- ✅ n8n 自動化平台（可選）

---

## 🔥 常見問題速查

### Q1: 部署失敗？

**檢查**：
- Zeabur Logs 中的錯誤訊息
- 環境變數是否正確設定
- Node.js 版本是否符合（需要 >= 20.0.0）

**解決**：修正後推送到 Git，會自動重新部署。

### Q2: 無法連接資料庫？

**檢查**：
- 是否使用 `.zeabur.internal` 域名
- 密碼是否正確（複製時沒有多餘空格）
- PostgreSQL 服務是否在運行

**解決**：重新複製密碼，確保格式正確。

### Q3: 前端環境變數無效？

**檢查**：
- 變數名稱是否有 `NEXT_PUBLIC_` 前綴
- 是否在修改後重新部署

**解決**：確保變數名稱正確，然後 Redeploy。

---

## 📚 下一步

### 1. 設定 NetSuite 連接

參考 `docs/environment-variables-template.md` 獲取 NetSuite OAuth 憑證。

### 2. 設定 Supabase Auth（如果使用）

1. 前往 Supabase Dashboard
2. Authentication → URL Configuration
3. 設定 Site URL：`https://<your-app>.zeabur.app`
4. 添加 Redirect URLs：`https://<your-app>.zeabur.app/**`

### 3. 執行資料庫遷移

連接到 PostgreSQL，執行專案中的 `.sql` 檔案。

### 4. 設定備份策略

參考 `ZEABUR_DEPLOYMENT_CHECKLIST.md` 的「階段九：備份策略」。

---

## 🆘 需要詳細指南？

- **完整部署步驟**：`ZEABUR_DEPLOYMENT_CHECKLIST.md`
- **服務整合指南**：`docs/zeabur-full-stack-guide.md`
- **環境變數說明**：`docs/environment-variables-template.md`
- **問題排查**：`TROUBLESHOOTING.md`

---

## 💡 專業提示

1. **使用 Supabase Cloud** 可以省去很多配置，特別是 Auth 和 Storage。

2. **n8n 可以晚點再加**，先把核心功能跑起來。

3. **開發環境用 Zeabur 免費額度**，生產環境再升級。

4. **定期備份資料庫**，雖然 Volume 是持久化的，但 `pg_dump` 更安全。

5. **用 n8n 建立定時任務**來自動備份和監控。

---

**祝你部署順利！** 🎉

如果遇到問題，記得查看 Zeabur Logs，那裡有最詳細的錯誤訊息。

