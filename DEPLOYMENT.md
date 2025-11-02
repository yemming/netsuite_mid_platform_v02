# Zeabur 部署指南

## 環境變數設置

在 Zeabur 平台上，請確保設置以下環境變數：

### 必需環境變數

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NetSuite OAuth 認證
NETSUITE_ACCOUNT_ID=your_account_id
NETSUITE_CONSUMER_KEY=your_consumer_key
NETSUITE_CONSUMER_SECRET=your_consumer_secret
NETSUITE_TOKEN_ID=your_token_id
NETSUITE_TOKEN_SECRET=your_token_secret
```

### 可選環境變數

```env
# N8n Webhooks（如果使用）
NEXT_PUBLIC_N8N_WEBHOOK_URL=your_n8n_webhook_url

# Next.js
NODE_ENV=production
PORT=3000
```

## Zeabur 部署配置

### 構建配置

- **構建命令**: `npm run build`
- **啟動命令**: `node .next/standalone/server.js`（standalone 模式）或 `npm start`（標準模式）
- **Node.js 版本**: 20.x（由 `.nvmrc` 和 `package.json` 指定）

**注意**: 如果使用 standalone 模式（已在 `next.config.js` 中啟用），啟動命令應為 `node .next/standalone/server.js`。如果 Zeabur 平台不支援 standalone 啟動，可以改回 `npm start`。

### 注意事項

1. **Standalone 模式**: 專案已配置為使用 Next.js standalone 輸出模式，這會減少部署大小並提高性能。

2. **端口**: Zeabur 會自動設置 `PORT` 環境變數，Next.js 會自動使用它。

3. **構建時間**: 首次部署可能需要較長時間來安裝依賴和構建應用程式。

4. **環境變數**: 請確保所有必需的環境變數都已設置，否則應用程式可能無法正常運行。

## 常見問題

### 部署失敗：環境變數未設置

如果看到 "環境變數未設定" 的錯誤，請檢查 Zeabur 環境變數設置。

### 構建失敗：Node.js 版本不匹配

確保 Zeabur 使用 Node.js 20.x。如果遇到問題，可以在 Zeabur 設置中指定 Node.js 版本。

### API 路由返回 500 錯誤

檢查：
1. 所有環境變數是否正確設置
2. NetSuite 憑證是否有效
3. Supabase 連線是否正常

## 部署後驗證

1. 訪問應用程式首頁
2. 測試註冊/登入功能
3. 測試 NetSuite API 連線（在儀表板中）
4. 測試 SuiteQL 查詢功能

