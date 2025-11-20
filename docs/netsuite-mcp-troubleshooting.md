# NetSuite MCP 故障排除指南

> **最後更新**: 2025-01-XX  
> **用途**: 解決 NetSuite MCP 認證和連接問題

---

## 🔍 問題診斷

### 症狀
- NetSuite MCP 無法認證
- 顯示認證錯誤
- MCP 工具無法使用

### 常見原因
1. **配置不正確**：環境變數設定錯誤或包含不必要的配置
2. **認證過期**：OAuth token 已過期
3. **Session 損壞**：認證 session 文件損壞
4. **NetSuite AI Connector SuiteApp 未安裝**：缺少必要的 SuiteApp

---

## ✅ 解決方案

### 方案 1：清理並重新認證（推薦）

#### 1.1 檢查 MCP 配置

確認 `~/.cursor/mcp.json` 中的 NetSuite MCP 配置正確：

```json
{
  "mcpServers": {
    "netsuite": {
      "command": "npx",
      "args": ["-y", "@suiteinsider/netsuite-mcp@latest"],
      "env": {
        "NETSUITE_ACCOUNT_ID": "你的帳戶ID",
        "NETSUITE_CLIENT_ID": "你的Client ID",
        "OAUTH_CALLBACK_PORT": "8080"
      }
    }
  }
}
```

**重要**：
- ✅ 只需要這三個環境變數
- ❌ 不要包含 `NETSUITE_MCP_URL`（已移除）
- ✅ `OAUTH_CALLBACK_PORT` 是可選的（預設 8080）

#### 1.2 清理舊的認證 Session

```bash
# 刪除舊的 session 文件
rm -f ~/.npm/_npx/*/node_modules/@suiteinsider/netsuite-mcp/sessions/session.json
```

#### 1.3 重啟 Cursor 並重新認證

1. **完全關閉 Cursor**
2. **重新開啟 Cursor**
3. 在 MCP 設定頁面中，找到 NetSuite MCP 伺服器
4. 點擊 **"netsuite_authenticate"** 按鈕
5. 按照瀏覽器中的 OAuth 流程完成認證

---

### 方案 2：驗證 NetSuite 設定

#### 2.1 確認 NetSuite AI Connector SuiteApp 已安裝

**重要**：NetSuite MCP 需要安裝 NetSuite AI Connector SuiteApp 才能正常運作。

1. 登入 NetSuite
2. 前往 **Customization > SuiteBundler > Search & Install Bundles**
3. 搜尋 "NetSuite AI Connector"
4. 確認已安裝並啟用

#### 2.2 確認 OAuth 2.0 Integration 設定正確

1. 前往 **Setup > Integration > Manage Integrations**
2. 找到你的 Integration Record
3. 確認設定：
   - ✅ **OAuth 2.0**: 已勾選
   - ✅ **Authorization Code Grant**: 已勾選
   - ✅ **Public Client**: 已勾選
   - ✅ **Redirect URI**: `http://localhost:8080/callback`（或你設定的端口）

#### 2.3 確認 Client ID 正確

- 在 Integration Record 中複製 **Client ID**（Consumer Key）
- 確認與 MCP 配置中的 `NETSUITE_CLIENT_ID` 一致

---

### 方案 3：手動測試認證

#### 3.1 使用命令行測試

```bash
# 測試 NetSuite MCP 是否能正常啟動
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
```

如果顯示 "Already authenticated"，但 Cursor 中無法使用，可能需要清理 session 並重新認證。

#### 3.2 檢查端口是否被占用

```bash
# 檢查 8080 端口是否被占用
lsof -i :8080
```

如果端口被占用，可以：
- 關閉占用端口的程序
- 或更改 `OAUTH_CALLBACK_PORT` 為其他端口（例如 8081）

---

## 🔧 進階除錯

### 檢查認證 Session 狀態

```bash
# 查看 session 文件內容
cat ~/.npm/_npx/*/node_modules/@suiteinsider/netsuite-mcp/sessions/session.json | jq '.'
```

**正常狀態**：
- `authenticated: true`
- `tokens.access_token` 存在
- `tokens.refresh_token` 存在
- `tokens.expires_at` 是未來的時間戳

**異常狀態**：
- `authenticated: false`
- `pkce: null`（可能需要重新認證）
- `tokens` 為空或過期

### 檢查 MCP 配置格式

```bash
# 驗證 JSON 格式
cat ~/.cursor/mcp.json | jq '.'
```

如果出現 JSON 格式錯誤，需要修復配置文件。

---

## 📋 檢查清單

### 基本檢查
- [ ] NetSuite AI Connector SuiteApp 已安裝
- [ ] OAuth 2.0 Integration Record 已建立並啟用
- [ ] Client ID 正確
- [ ] MCP 配置文件格式正確
- [ ] 環境變數設定正確（只有三個必要變數）

### 認證檢查
- [ ] 已清理舊的 session 文件
- [ ] 已重啟 Cursor
- [ ] 已點擊 "netsuite_authenticate" 按鈕
- [ ] OAuth 流程已完成
- [ ] 認證成功後 session 文件已建立

### 功能檢查
- [ ] NetSuite MCP 工具可用（例如：`list_tables`）
- [ ] 可以執行 SuiteQL 查詢
- [ ] 可以訪問 NetSuite 資料

---

## 🚨 常見錯誤

### 錯誤 1：`Authentication failed`

**原因**：
- Client ID 錯誤
- OAuth Integration 設定不正確
- Redirect URI 不匹配

**解決**：
1. 確認 Client ID 與 NetSuite 中的一致
2. 確認 Integration Record 中的 Redirect URI 為 `http://localhost:8080/callback`
3. 確認 OAuth 2.0 設定正確

### 錯誤 2：`MCP tools not available`

**原因**：
- NetSuite AI Connector SuiteApp 未安裝
- 認證未完成

**解決**：
1. 安裝 NetSuite AI Connector SuiteApp
2. 重新認證

### 錯誤 3：`Port already in use`

**原因**：
- 8080 端口被其他程序占用

**解決**：
1. 更改 `OAUTH_CALLBACK_PORT` 為其他端口
2. 同時更新 NetSuite Integration Record 中的 Redirect URI

### 錯誤 4：`Session expired`

**原因**：
- OAuth token 已過期
- Refresh token 也過期

**解決**：
1. 清理 session 文件
2. 重新認證

---

## 💡 最佳實踐

### 1. 定期檢查認證狀態
- 每月檢查一次 session 是否正常
- 如果發現問題，及時重新認證

### 2. 備份配置
- 將 MCP 配置加入版本控制（注意：不要提交敏感資訊）
- 記錄 Client ID 的建立日期

### 3. 使用標準配置
- 只使用必要的環境變數
- 不要添加未文檔化的配置項

### 4. 保持 SuiteApp 更新
- 定期檢查 NetSuite AI Connector SuiteApp 更新
- 保持最新版本以獲得最佳相容性

---

## 📚 參考資料

### NetSuite MCP 官方文件
- [npm: @suiteinsider/netsuite-mcp](https://www.npmjs.com/package/@suiteinsider/netsuite-mcp)
- [GitHub: netsuite-mcp-server](https://github.com/dsvantien/netsuite-mcp-server)

### NetSuite 官方文件
- [NetSuite OAuth 2.0 設定指南](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_157771733782.html)
- [NetSuite AI Connector SuiteApp](https://www.netsuite.com/portal/products/ai-connector.shtml)

### 相關文件
- [環境變數設定指南](./environment-variables-template.md)
- [NetSuite 中臺建置完全指南](../NetSuite中臺建置完全指南.md)

---

**文檔維護**: 隨著 NetSuite MCP 更新，請持續更新此文件。  
**最後更新**: 2025-01-XX  
**版本**: 1.0





