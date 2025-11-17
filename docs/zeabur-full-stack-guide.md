# Zeabur 全端部署完全指南

> **適用場景**: 部署 Next.js + Supabase + n8n + Redis 的完整技術堆疊
> **最後更新**: 2025-01-16

---

## 🏗️ 系統架構概覽

```
┌─────────────────────────────────────────────────────────┐
│                    Zeabur Project                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │   Next.js    │───▶│  PostgreSQL  │ (Supabase DB)    │
│  │  (前端+API)   │    │  + Volume    │                  │
│  └──────┬───────┘    └──────────────┘                  │
│         │                                                │
│         ├───────────▶┌──────────────┐                  │
│         │            │    Redis     │ (快取層)          │
│         │            │  + Volume    │                  │
│         │            └──────────────┘                  │
│         │                                                │
│         └───────────▶┌──────────────┐                  │
│                      │     n8n      │ (自動化工作流)    │
│                      │  + Volume    │                  │
│                      └──────────────┘                  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 部署步驟（完整版）

### 第一步：建立 Zeabur Project

1. 登入 [Zeabur Dashboard](https://zeabur.com)
2. 點擊「Create Project」
3. 命名專案（例如：`netsuite-platform-prod`）

---

### 第二步：部署 PostgreSQL（Supabase DB）

#### 方案 A：使用 Zeabur 的 PostgreSQL（推薦）

如果你想要**完全控制**資料庫並省錢：

1. 在 Zeabur Project 中點擊「Add Service」
2. 選擇「Marketplace」→「PostgreSQL」
3. 配置：
   ```yaml
   服務名稱: postgres
   版本: 16.x (最新穩定版)
   Volume: 5GB (自動掛載到 /var/lib/postgresql/data)
   ```

4. 部署後，Zeabur 會自動生成環境變數：
   ```env
   POSTGRES_HOST=postgres.zeabur.internal
   POSTGRES_PORT=5432
   POSTGRES_USER=root
   POSTGRES_PASSWORD=<自動生成>
   POSTGRES_DATABASE=zeabur
   ```

5. **連接字串格式**（用於 Next.js）：
   ```env
   DATABASE_URL=postgresql://root:<password>@postgres.zeabur.internal:5432/zeabur
   ```

#### 方案 B：使用外部 Supabase Cloud（更簡單）

如果你想要**Supabase 的完整功能**（Auth、Storage、Realtime）：

1. 在 [Supabase](https://supabase.com) 建立專案
2. 獲取連接資訊：
   - Project URL: `https://xxx.supabase.co`
   - Anon Key: `eyJhbGc...`
   - Service Role Key: `eyJhbGc...`
   - Database URL: `postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres`

3. 在 Zeabur 中設定環境變數（見下方）

**建議**：如果你需要 Supabase Auth 和 Storage，用方案 B。如果只需要 PostgreSQL，用方案 A 省錢。

---

### 第三步：部署 Redis

1. 在同一個 Zeabur Project 中，點擊「Add Service」
2. 選擇「Marketplace」→「Redis」
3. 配置：
   ```yaml
   服務名稱: redis
   版本: 7.x
   Volume: 1GB (自動掛載到 /data)
   ```

4. Zeabur 會自動生成環境變數：
   ```env
   REDIS_HOST=redis.zeabur.internal
   REDIS_PORT=6379
   REDIS_PASSWORD=<自動生成>
   ```

5. **連接字串格式**：
   ```env
   REDIS_URL=redis://:<password>@redis.zeabur.internal:6379
   ```

---

### 第四步：部署 n8n

1. 在同一個 Zeabur Project 中，點擊「Add Service」
2. 選擇「Marketplace」→「n8n」
3. 配置：
   ```yaml
   服務名稱: n8n
   Volume: 2GB (自動掛載到 /home/node/.n8n)
   ```

4. **必要環境變數**（在 Zeabur 中設定）：
   ```env
   # n8n 基本設定
   N8N_BASIC_AUTH_ACTIVE=true
   N8N_BASIC_AUTH_USER=admin
   N8N_BASIC_AUTH_PASSWORD=<設定你的密碼>
   
   # Webhook 設定
   WEBHOOK_URL=https://n8n-<your-service-id>.zeabur.app
   
   # PostgreSQL 連接（如果要持久化工作流到 DB）
   DB_TYPE=postgresdb
   DB_POSTGRESDB_HOST=postgres.zeabur.internal
   DB_POSTGRESDB_PORT=5432
   DB_POSTGRESDB_DATABASE=n8n
   DB_POSTGRESDB_USER=root
   DB_POSTGRESDB_PASSWORD=<postgres 密碼>
   
   # 時區
   GENERIC_TIMEZONE=Asia/Taipei
   TZ=Asia/Taipei
   ```

5. **n8n 資料庫初始化**：
   - 連接到 PostgreSQL，建立 `n8n` 資料庫：
     ```sql
     CREATE DATABASE n8n;
     ```

6. 部署完成後，訪問 n8n：
   - URL: `https://n8n-<service-id>.zeabur.app`
   - 用戶名：`admin`
   - 密碼：<你設定的密碼>

---

### 第五步：部署 Next.js 應用

1. 在 Zeabur Project 中，點擊「Add Service」
2. 選擇「Git」→ 連接你的 GitHub 倉庫
3. 選擇分支（例如：`main`）
4. Zeabur 會自動偵測到 Next.js 專案

#### 構建設定（自動偵測）

Zeabur 會讀取你的 `zeabur.json`：

```json
{
  "build": {
    "command": "npm run build",
    "installCommand": "npm install"
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheck": {
      "path": "/api/health",
      "interval": 30,
      "timeout": 10
    }
  }
}
```

#### 環境變數設定（關鍵！）

在 Zeabur 的 Next.js 服務中，設定以下環境變數：

```env
# === Supabase 連接 ===
# 如果用方案 A（Zeabur PostgreSQL + 自建 Auth）
NEXT_PUBLIC_SUPABASE_URL=https://<your-nextjs-domain>.zeabur.app
DATABASE_URL=postgresql://root:<password>@postgres.zeabur.internal:5432/zeabur

# 如果用方案 B（Supabase Cloud）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres

# === Redis 連接 ===
REDIS_URL=redis://:<password>@redis.zeabur.internal:6379

# === n8n Webhook（如果需要） ===
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n-<service-id>.zeabur.app/webhook

# === NetSuite OAuth ===
NETSUITE_ACCOUNT_ID=your_account_id
NETSUITE_CONSUMER_KEY=your_consumer_key
NETSUITE_CONSUMER_SECRET=your_consumer_secret
NETSUITE_TOKEN_ID=your_token_id
NETSUITE_TOKEN_SECRET=your_token_secret

# === Next.js 設定 ===
NODE_ENV=production
PORT=3000
```

#### 🔑 如何獲取內部服務的連接資訊？

1. 點擊 PostgreSQL 服務 → 「Variables」→ 複製 `POSTGRES_PASSWORD`
2. 點擊 Redis 服務 → 「Variables」→ 複製 `REDIS_PASSWORD`
3. 使用內部域名：
   - PostgreSQL: `postgres.zeabur.internal:5432`
   - Redis: `redis.zeabur.internal:6379`
   - n8n: `n8n.zeabur.internal:5678`（內部調用）

---

## 🔗 服務間通信設定

### 1. Next.js → PostgreSQL

在 `utils/supabase/client.ts` 中，確保使用正確的連接字串：

```typescript
import { createClient } from '@supabase/supabase-js'

// 如果用 Supabase Cloud
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 如果用 Zeabur PostgreSQL + 直接連接
// 使用 DATABASE_URL 環境變數
```

### 2. Next.js → Redis

建立 Redis 客戶端（`lib/redis-client.ts`）：

```typescript
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.error('Redis Error:', err));

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

export default redisClient;
```

### 3. Next.js → n8n

在你的 API Route 中調用 n8n webhook：

```typescript
// app/api/trigger-workflow/route.ts
export async function POST(request: Request) {
  const data = await request.json();
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL}/your-webhook-id`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  );
  
  return Response.json(await response.json());
}
```

### 4. n8n → Next.js API

在 n8n 工作流中使用 HTTP Request 節點：

```
URL: https://<your-nextjs-domain>.zeabur.app/api/your-endpoint
Method: POST
Authentication: None（或根據需求設定）
Body: JSON
```

---

## 💾 資料持久化設定

### Zeabur Volume 自動掛載

Zeabur 會自動為以下服務掛載 Volume：

| 服務 | Volume 掛載點 | 用途 | 建議大小 |
|------|--------------|------|---------|
| PostgreSQL | `/var/lib/postgresql/data` | 資料庫檔案 | 5-20GB |
| Redis | `/data` | RDB/AOF 持久化 | 1-5GB |
| n8n | `/home/node/.n8n` | 工作流定義、憑證 | 2-5GB |

### ⚠️ 重要提醒

1. **Zeabur 的 Volume 是持久化的**，即使重啟服務也不會丟失資料
2. **但如果刪除服務，Volume 也會一起刪除**，所以：
   - 定期備份 PostgreSQL（用 `pg_dump`）
   - 定期匯出 n8n 工作流（JSON 格式）
   - Redis 設定 AOF 持久化（預設開啟）

3. **備份策略**（建議）：
   ```bash
   # PostgreSQL 備份（每天自動執行）
   pg_dump -h postgres.zeabur.internal -U root zeabur > backup-$(date +%Y%m%d).sql
   
   # 上傳到 Supabase Storage 或 S3
   ```

---

## 🔍 驗證服務連接

### 測試 PostgreSQL 連接

```typescript
// app/api/test/db/route.ts
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data, error } = await supabase.from('sync_logs').select('count');
    
    if (error) throw error;
    
    return Response.json({ status: 'ok', message: '資料庫連接成功' });
  } catch (error) {
    return Response.json({ status: 'error', error: String(error) }, { status: 500 });
  }
}
```

### 測試 Redis 連接

```typescript
// app/api/test/redis/route.ts
import { connectRedis } from '@/lib/redis-client';

export async function GET() {
  try {
    const redis = await connectRedis();
    await redis.set('test_key', 'Hello Zeabur', { EX: 60 });
    const value = await redis.get('test_key');
    
    return Response.json({ status: 'ok', value });
  } catch (error) {
    return Response.json({ status: 'error', error: String(error) }, { status: 500 });
  }
}
```

### 測試 n8n Webhook

```bash
curl -X POST https://n8n-<service-id>.zeabur.app/webhook/<webhook-id> \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

## 📊 服務監控與日誌

### Zeabur 內建監控

1. 在 Zeabur Dashboard 中，每個服務都有：
   - **Logs**：即時日誌查看
   - **Metrics**：CPU、記憶體使用率
   - **Events**：部署歷史、重啟記錄

2. **設定 Alert**（如果可用）：
   - CPU > 80% 發送通知
   - 記憶體 > 90% 發送通知

### Next.js 健康檢查

確保你的 `app/api/health/route.ts` 存在：

```typescript
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'ok',  // 可以真實檢查
      redis: 'ok',
      n8n: 'ok'
    }
  });
}
```

---

## 🔒 安全性設定

### 1. 環境變數安全

- ✅ 所有密鑰使用 Zeabur 的環境變數（自動加密）
- ✅ 不要在程式碼中硬編碼任何密鑰
- ✅ 使用 `NEXT_PUBLIC_` 前綴來區分前端/後端變數

### 2. 網路安全

- ✅ PostgreSQL 和 Redis 只能通過內部網路訪問（`.zeabur.internal`）
- ✅ n8n 使用 Basic Auth 保護管理介面
- ✅ Next.js API Routes 實作適當的認證（Supabase Auth）

### 3. CORS 設定

如果需要跨域請求，在 Next.js 中設定：

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        ],
      },
    ];
  },
};
```

---

## 💰 成本估算（參考）

基於 Zeabur 的計費模式（實際以官網為準）：

| 服務 | 規格 | 預估月費（USD） |
|------|------|----------------|
| Next.js | 1 vCPU, 512MB RAM | $5-10 |
| PostgreSQL | 1 vCPU, 512MB RAM, 5GB 儲存 | $5-10 |
| Redis | 0.5 vCPU, 256MB RAM, 1GB 儲存 | $3-5 |
| n8n | 1 vCPU, 512MB RAM, 2GB 儲存 | $5-10 |
| **總計** | | **$18-35/月** |

**省錢技巧**：
1. 開發環境可以暫停不用的服務
2. 使用外部 Supabase Cloud（免費額度足夠小專案）
3. Redis 可以用較小的規格（256MB 足夠大部分場景）

---

## 🚀 部署 Checklist

部署前確認：

- [ ] PostgreSQL 服務已啟動並有 Volume
- [ ] Redis 服務已啟動並有 Volume
- [ ] n8n 服務已啟動，能訪問管理介面
- [ ] Next.js 環境變數已正確設定（至少 10 個）
- [ ] 所有內部域名使用 `.zeabur.internal`
- [ ] 測試 API：`/api/test/db` 和 `/api/test/redis` 返回 ok
- [ ] n8n 能成功連接到 PostgreSQL
- [ ] Next.js 能調用 n8n webhook
- [ ] 健康檢查 `/api/health` 正常
- [ ] 備份策略已設定（至少手動備份一次）

---

## 🔧 常見問題排查

### 問題 1：Next.js 無法連接 PostgreSQL

**症狀**：`ECONNREFUSED` 或 `timeout`

**解決方法**：
1. 確認環境變數 `DATABASE_URL` 使用 `postgres.zeabur.internal`
2. 檢查 PostgreSQL 服務是否正在運行
3. 測試內部連接：
   ```bash
   # 在 Next.js 容器中執行
   curl http://postgres.zeabur.internal:5432
   ```

### 問題 2：Redis 連接失敗

**症狀**：`Redis connection timeout`

**解決方法**：
1. 確認 `REDIS_URL` 格式正確：`redis://:<password>@redis.zeabur.internal:6379`
2. 檢查 Redis 密碼是否正確
3. 確認 Redis 服務狀態

### 問題 3：n8n 無法持久化工作流

**症狀**：重啟後工作流消失

**解決方法**：
1. 確認 Volume 已掛載到 `/home/node/.n8n`
2. 或者設定 PostgreSQL 作為 n8n 的資料庫（見上方 n8n 環境變數）
3. 檢查 Zeabur Volumes 頁面確認儲存空間

### 問題 4：環境變數在前端無效

**症狀**：`process.env.XXX` 是 `undefined`

**解決方法**：
1. 前端變數必須加 `NEXT_PUBLIC_` 前綴
2. 修改環境變數後需要**重新部署**（Rebuild）
3. 確認在 Zeabur 的 Variables 頁面已保存

---

## 📚 進階主題

### 使用 Zeabur CLI 管理

```bash
# 安裝 CLI
npm install -g zeabur

# 登入
zeabur login

# 查看專案列表
zeabur projects list

# 查看服務日誌
zeabur logs <service-id>

# 設定環境變數
zeabur env set KEY=VALUE
```

### CI/CD 整合

如果你想要自動化部署：

1. 在 GitHub 設定 Webhook 到 Zeabur（自動觸發）
2. 或使用 GitHub Actions：
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to Zeabur
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Trigger Zeabur Deploy
           run: |
             curl -X POST https://zeabur.com/api/v1/deployments \
               -H "Authorization: Bearer ${{ secrets.ZEABUR_TOKEN }}"
   ```

### 多環境部署（Dev / Staging / Prod）

建議建立 3 個 Zeabur Projects：

1. **netsuite-platform-dev**（開發環境）
   - 連接 `dev` 分支
   - 使用較小的資源配置
   
2. **netsuite-platform-staging**（測試環境）
   - 連接 `staging` 分支
   - 使用與生產相同的配置
   
3. **netsuite-platform-prod**（生產環境）
   - 連接 `main` 分支
   - 完整資源配置 + 備份策略

---

## 📖 參考資源

- [Zeabur 官方文件](https://zeabur.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [n8n 自託管指南](https://docs.n8n.io/hosting/)
- [Supabase 連接指南](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

**維護者**: 專案團隊  
**最後更新**: 2025-01-16  
**版本**: 1.0


