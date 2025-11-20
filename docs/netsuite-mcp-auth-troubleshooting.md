# NetSuite MCP 認證問題故障排除

> **問題**: 點擊 `netsuite_authenticate` 按鈕後，沒有跳出瀏覽器進行 OAuth 授權

---

## 🔍 問題診斷

### 症狀
- ✅ NetSuite MCP 已被 Cursor 識別
- ✅ 可以看到 `netsuite_authenticate` 按鈕
- ❌ 點擊按鈕後，瀏覽器沒有自動開啟
- ❌ 沒有看到 OAuth 授權頁面

---

## ✅ 解決方案

### 方案 1：手動觸發認證流程（推薦）

#### 步驟 1：確認端口可用

```bash
# 檢查 8080 端口是否被占用
lsof -i :8080
```

如果端口被占用：
- 關閉占用端口的程序
- 或更改端口（見下方）

#### 步驟 2：手動啟動認證服務器

在終端機中執行：

```bash
# 啟動 NetSuite MCP 並觸發認證
npx -y @suiteinsider/netsuite-mcp@latest
```

**預期輸出**：
```
🚀 NetSuite MCP Server starting...
📦 Version: 1.0.0
🔌 Transport: stdio (MCP Client)
🌐 Callback Port: 8080
📁 Sessions Directory: ...
⏳ Waiting for authentication...
🌐 Open this URL in your browser:
   https://TD3018275.app.netsuite.com/app/login/oauth2/auth.nl?client_id=...
```

#### 步驟 3：複製並打開授權 URL

1. 從終端機輸出中複製授權 URL
2. 手動在瀏覽器中打開該 URL
3. 完成 NetSuite 登入和授權
4. 授權成功後，瀏覽器會自動跳轉到 `http://localhost:8080/callback`

#### 步驟 4：返回 Cursor

1. 關閉終端機中的 NetSuite MCP 進程（Ctrl+C）
2. 重啟 Cursor
3. 在 Cursor 中再次點擊 `netsuite_authenticate` 按鈕
4. 這次應該會自動使用已建立的 session

---

### 方案 2：更改 OAuth Callback 端口

如果 8080 端口被占用，可以更改為其他端口：

#### 步驟 1：更新 MCP 配置

編輯 `~/.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "netsuite": {
      "command": "npx",
      "args": [
        "-y",
        "@suiteinsider/netsuite-mcp@latest"
      ],
      "env": {
        "NETSUITE_ACCOUNT_ID": "TD3018275",
        "NETSUITE_CLIENT_ID": "fd9f0a76aa457b196df935dd7a1de8d29933e9201bd7834cc1e976b40c2379ce",
        "OAUTH_CALLBACK_PORT": "8081"
      }
    }
  }
}
```

**注意**：將 `8080` 改為 `8081`（或其他可用端口）

#### 步驟 2：更新 NetSuite Integration Record

1. 登入 NetSuite
2. 前往 **Setup > Integration > Manage Integrations**
3. 找到你的 Integration Record
4. 更新 **Redirect URI** 為：`http://localhost:8081/callback`
5. 儲存

#### 步驟 3：重啟 Cursor

1. 完全關閉 Cursor
2. 重新開啟 Cursor
3. 再次點擊 `netsuite_authenticate` 按鈕

---

### 方案 3：檢查 NetSuite Integration 設定

確認 NetSuite 中的 OAuth 2.0 Integration 設定正確：

#### 必要設定

1. **Setup > Integration > Manage Integrations**
2. 找到你的 Integration Record（Client ID: `fd9f0a76aa457b196df935dd7a1de8d29933e9201bd7834cc1e976b40c2379ce`）
3. 確認以下設定：

   - ✅ **OAuth 2.0**: 已勾選
   - ✅ **Authorization Code Grant**: 已勾選
   - ✅ **Public Client**: 已勾選
   - ✅ **Redirect URI**: `http://localhost:8080/callback`（必須完全匹配）

#### 常見錯誤

- ❌ Redirect URI 不匹配（例如：多了 `/` 或少了 `http://`）
- ❌ 使用 `https://` 而不是 `http://`（本地開發必須使用 `http://`）
- ❌ 端口號不一致

---

### 方案 4：清理並重新認證

如果以上方法都不行，嘗試完全清理並重新開始：

#### 步驟 1：清理舊的 Session

```bash
# 刪除所有 NetSuite MCP session 文件
find ~/.npm/_npx -name "session.json" -path "*/netsuite-mcp/*" -delete
```

#### 步驟 2：重啟 Cursor

1. 完全關閉 Cursor
2. 重新開啟 Cursor

#### 步驟 3：手動觸發認證

按照「方案 1」的步驟手動觸發認證流程。

---

## 🔧 進階除錯

### 檢查 MCP 進程狀態

```bash
# 查看 NetSuite MCP 進程
ps aux | grep netsuite-mcp | grep -v grep
```

### 檢查端口監聽狀態

```bash
# 檢查 8080 端口是否在監聽
lsof -i :8080
netstat -an | grep 8080
```

### 查看 Cursor 日誌

1. 開啟 Cursor
2. 前往 **Help > Toggle Developer Tools**
3. 查看 Console 標籤中的錯誤訊息

### 手動測試認證 URL

1. 在終端機中執行：
   ```bash
   npx -y @suiteinsider/netsuite-mcp@latest
   ```
2. 複製輸出的授權 URL
3. 在瀏覽器中打開
4. 如果瀏覽器顯示錯誤，檢查：
   - URL 是否完整
   - Client ID 是否正確
   - NetSuite 帳戶是否可以正常登入

---

## 📋 檢查清單

### 基本檢查
- [ ] 端口 8080 未被占用
- [ ] NetSuite Integration Record 已正確設定
- [ ] Redirect URI 完全匹配（`http://localhost:8080/callback`）
- [ ] OAuth 2.0 設定正確（Authorization Code Grant + Public Client）
- [ ] Client ID 與 MCP 配置中的一致

### 認證流程檢查
- [ ] 已手動啟動 NetSuite MCP 服務器
- [ ] 已複製授權 URL 並在瀏覽器中打開
- [ ] 已完成 NetSuite 登入
- [ ] 已授權應用程式
- [ ] 瀏覽器已跳轉到 callback URL
- [ ] Session 文件已建立

### Cursor 整合檢查
- [ ] 已重啟 Cursor
- [ ] NetSuite MCP 顯示為 Active
- [ ] 可以點擊 `netsuite_authenticate` 按鈕
- [ ] 認證後可以正常使用 NetSuite MCP 工具

---

## 🚨 常見錯誤訊息

### 錯誤 1：`Port 8080 is already in use`

**解決**：
1. 關閉占用端口的程序
2. 或更改 `OAUTH_CALLBACK_PORT` 為其他端口

### 錯誤 2：`Redirect URI mismatch`

**解決**：
1. 確認 NetSuite Integration Record 中的 Redirect URI 為 `http://localhost:8080/callback`
2. 確認沒有多餘的空格或斜線

### 錯誤 3：`Invalid client_id`

**解決**：
1. 確認 Client ID 與 NetSuite Integration Record 中的一致
2. 確認 Integration Record 已啟用

### 錯誤 4：瀏覽器沒有自動開啟

**解決**：
1. 手動複製授權 URL 並在瀏覽器中打開
2. 這是正常的，某些環境下瀏覽器不會自動開啟

---

## 💡 最佳實踐

### 1. 使用手動觸發方式

對於首次認證，建議使用手動方式（方案 1），因為：
- 可以確認授權 URL 是否正確
- 可以查看完整的認證流程
- 更容易除錯問題

### 2. 保持端口一致

確保：
- MCP 配置中的 `OAUTH_CALLBACK_PORT`
- NetSuite Integration Record 中的 Redirect URI 端口
- 實際使用的端口

三者完全一致。

### 3. 定期檢查認證狀態

```bash
# 檢查 session 文件
find ~/.npm/_npx -name "session.json" -path "*/netsuite-mcp/*" -exec cat {} \; | jq '.authenticated'
```

如果顯示 `false` 或文件不存在，需要重新認證。

---

## 📚 參考資料

- [NetSuite MCP 故障排除指南](./netsuite-mcp-troubleshooting.md)
- [NetSuite MCP 設定指南](./netsuite-mcp-setup-guide.md)
- [@suiteinsider/netsuite-mcp npm 套件](https://www.npmjs.com/package/@suiteinsider/netsuite-mcp)

---

**文檔維護**: 隨著問題解決，請持續更新此文件。  
**最後更新**: 2025-01-XX  
**版本**: 1.0

