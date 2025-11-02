# Zeabur 部署故障排除指南

## 無法連線網頁的常見原因

### 1. 環境變數未設置

**檢查方法**：
- 在 Zeabur 後台檢查所有環境變數是否已正確設置
- 特別是 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**必需環境變數**：
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NETSUITE_ACCOUNT_ID=your_account_id
NETSUITE_CONSUMER_KEY=your_consumer_key
NETSUITE_CONSUMER_SECRET=your_consumer_secret
NETSUITE_TOKEN_ID=your_token_id
NETSUITE_TOKEN_SECRET=your_token_secret
```

### 2. 啟動命令問題

**檢查啟動命令**：
- Zeabur 後台應該設置為：`node .next/standalone/server.js`
- 如果 standalone 模式有問題，可以嘗試改為：`npm start`

### 3. 端口問題

Next.js 在 standalone 模式下會自動讀取 `PORT` 環境變數。Zeabur 通常會自動設置，但請確認：
- `PORT` 環境變數已設置（Zeabur 通常自動處理）

### 4. 構建失敗但顯示成功

檢查構建日誌中的警告和錯誤訊息。

## 如何查看 Zeabur 日誌

### 方法 1: Zeabur Dashboard
1. 登入 Zeabur
2. 進入你的專案
3. 選擇服務（service-69075e41e899b7703fe6754b）
4. 點擊 "Logs" 或 "日誌" 標籤
5. 查看實時日誌輸出

### 方法 2: 檢查構建日誌
1. 在 Zeabur 服務頁面
2. 查看 "Build Logs" 或 "構建日誌"
3. 確認構建是否真的成功

### 方法 3: 運行時日誌
查看運行時錯誤：
- 檢查是否有 "Supabase 環境變數未設置" 錯誤
- 檢查是否有端口綁定錯誤
- 檢查是否有模組找不到的錯誤

## 常見錯誤訊息及解決方案

### "Supabase 環境變數未設置"
**解決方案**：在 Zeabur 後台設置 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### "Cannot find module"
**解決方案**：
1. 檢查 `package.json` 是否完整
2. 確認構建過程中所有依賴都已安裝
3. 檢查 Node.js 版本是否為 20.x

### "Port already in use" 或 "EADDRINUSE"
**解決方案**：這是正常的，Zeabur 會自動處理端口

### "ECONNREFUSED" 或連接錯誤
**解決方案**：
1. 檢查 Supabase URL 是否正確
2. 檢查 Supabase 專案是否還在運行
3. 確認網路連線正常

## 測試部署

### 1. 檢查健康狀態
訪問首頁 `/` 應該能正常載入（即使未登入）

### 2. 檢查環境變數
如果環境變數未設置，應用程式會：
- 在 middleware 中記錄錯誤但允許通過
- 在頁面載入時顯示更明確的錯誤訊息

### 3. 檢查 API 路由
訪問 `/api/netsuite/test`（需要認證）可以測試 NetSuite 連線

## 快速修復步驟

1. **確認環境變數**：檢查 Zeabur 後台所有環境變數
2. **重新部署**：點擊 "Redeploy" 或重新推送代碼
3. **檢查日誌**：查看實時日誌確認錯誤訊息
4. **檢查域名**：確認 Zeabur 分配的域名正確
5. **測試連線**：使用 curl 或瀏覽器測試首頁

## 需要協助？

如果以上步驟都無法解決，請提供：
1. Zeabur 的完整構建日誌
2. Zeabur 的運行時日誌（特別是錯誤訊息）
3. 瀏覽器控制台的錯誤訊息
4. 網路請求的狀態碼（404、500 等）

