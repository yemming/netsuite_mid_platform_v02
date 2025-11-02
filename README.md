# NetSuite Platform V2

這是一個整合 Next.js、Supabase、N8n 和 NetSuite 的前臺應用程式。

## 功能特色

- ✅ Next.js 14 框架
- ✅ Supabase 認證系統
- ✅ 響應式設計（Tailwind CSS）
- ✅ TypeScript 支援
- 🚧 N8n 工作流程整合（準備中）
- 🚧 NetSuite ERP 整合（準備中）

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

建立 `.env.local` 檔案並填入以下資訊：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# N8n Webhooks
NEXT_PUBLIC_N8N_WEBHOOK_URL=your_n8n_webhook_url

# NetSuite OAuth 認證（直接連線）
NETSUITE_ACCOUNT_ID=your_account_id
NETSUITE_CONSUMER_KEY=your_consumer_key
NETSUITE_CONSUMER_SECRET=your_consumer_secret
NETSUITE_TOKEN_ID=your_token_id
NETSUITE_TOKEN_SECRET=your_token_secret
```

**Supabase 設定：**
- 您可以在 Supabase Dashboard > Settings > API 中找到這些資訊

**NetSuite 設定：**
- `NETSUITE_ACCOUNT_ID`: 您的 NetSuite Account ID（例如：1234567 或 TSTDRV1234567）
- `NETSUITE_CONSUMER_KEY` 和 `NETSUITE_CONSUMER_SECRET`: 從 NetSuite > Setup > Integrations > Manage Integrations 建立的 Integration 中取得
- `NETSUITE_TOKEN_ID` 和 `NETSUITE_TOKEN_SECRET`: 從 NetSuite > Setup > Users/Roles > Access Tokens 建立的 Token 中取得

### 3. 執行開發伺服器

```bash
npm run dev
```

開啟瀏覽器前往 [http://localhost:3000](http://localhost:3000)

## 專案結構

```
├── app/
│   ├── dashboard/        # 儀表板頁面（需登入）
│   ├── layout.tsx         # 根佈局
│   ├── page.tsx           # 首頁（登入頁面）
│   └── globals.css        # 全域樣式
├── utils/
│   └── supabase/         # Supabase 客戶端設定
│       ├── client.ts      # 瀏覽器端客戶端
│       └── server.ts      # 伺服器端客戶端
├── middleware.ts          # Next.js 中間件（處理認證）
└── package.json
```

## 使用說明

### 註冊新帳號

1. 在首頁點擊「還沒有帳號？立即註冊」
2. 輸入電子郵件和密碼（至少 6 個字元）
3. 點擊「註冊」
4. 檢查您的電子郵件以驗證帳號

### 登入

1. 在首頁輸入您的電子郵件和密碼
2. 點擊「登入」
3. 成功後會自動導向儀表板

### 儀表板

登入後，您會看到：
- Welcome to NextJS 歡迎訊息
- 三個整合模組的狀態卡片（Supabase、N8n、NetSuite）

## 開發指令

- `npm run dev` - 啟動開發伺服器
- `npm run build` - 建置生產版本
- `npm run start` - 啟動生產伺服器
- `npm run lint` - 執行 ESLint 檢查

## 功能狀態

- ✅ Supabase 認證系統整合
- ✅ N8n Webhook 連線測試
- ✅ NetSuite API 直接連線測試
- 🚧 NetSuite 資料同步功能（準備中）
- 🚧 資料視覺化圖表（準備中）

## NetSuite 連線測試

登入後，儀表板會自動測試：
- **Supabase**: 認證系統連線狀態
- **N8n**: Webhook 連線狀態
- **NetSuite**: API 連線狀態（透過 OAuth 1.0 認證）

如果 NetSuite 顯示綠燈，表示 OAuth 認證成功且可以正常呼叫 NetSuite REST API。

## 技術棧

- **框架**: Next.js 14
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **認證**: Supabase Auth
- **部署**: 支援 Vercel、Netlify 等平台

