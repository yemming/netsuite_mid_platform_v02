# NetSuite MCP 快速設定指南

> **快速參考**: 5 分鐘內完成 NetSuite MCP 設定

---

## 🚀 快速開始

### 步驟 1：取得 NetSuite Bearer Token

如果你還沒有 Bearer Token，請參考：
- [Folio3 Postman 設定指南](https://netsuite.folio3.com/blog/ide-integration-guide-for-netsuite-mcp-tools-in-cursor-vs-code/)（需要先完成 OAuth 2.0 設定）

**或使用現有的 OAuth 1.0a 憑證轉換**（需要額外步驟）

### 步驟 2：確認 NetSuite Account ID

- **Production**: `1234567`（從 URL `https://1234567.app.netsuite.com` 取得）
- **Sandbox**: `tstdrv1234567`（從 URL `https://tstdrv1234567.app.netsuite.com` 取得）

### 步驟 3：選擇配置方式

#### 選項 A：Direct URL（最簡單）

1. 開啟 Cursor → Settings → Tools & MCP → New MCP Server
2. 複製以下配置，替換 `<ACCOUNT_ID>` 和 `<BEARER_TOKEN>`：

```json
{
  "mcpServers": {
    "ns-mcp-tools": {
      "url": "https://<ACCOUNT_ID>.suitetalk.api.netsuite.com/services/mcp/v1/all",
      "headers": {
        "Authorization": "Bearer <BEARER_TOKEN>"
      }
    }
  }
}
```

**範例**（Sandbox）：
```json
{
  "mcpServers": {
    "ns-mcp-tools": {
      "url": "https://tstdrv1234567.suitetalk.api.netsuite.com/services/mcp/v1/all",
      "headers": {
        "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
}
```

#### 選項 B：Command-Based（更穩定）

1. 確認 Node.js >= 18: `node --version`
2. 開啟 Cursor → Settings → Tools & MCP → New MCP Server
3. 複製以下配置：

```json
{
  "mcpServers": {
    "ns-mcp-tools-remote": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://<ACCOUNT_ID>.suitetalk.api.netsuite.com/services/mcp/v1/all",
        "--header",
        "Authorization: Bearer <BEARER_TOKEN>"
      ]
    }
  }
}
```

### 步驟 4：驗證連接

1. 重啟 Cursor
2. 前往 Settings → MCP & Integrations
3. 確認 NetSuite MCP 顯示為 **Active**
4. 展開工具列表，應該看到 NetSuite 相關工具

### 步驟 5：測試使用

在 Cursor Chat（**Agent Mode**）中輸入：

```
請使用 NetSuite MCP 工具列出資料庫中的所有表格
```

---

## ⚡ 常見問題快速解決

### Q: 找不到 MCP 設定頁面？
**A**: 
- macOS: Cursor → Settings → Cursor Settings → Tools & MCP
- Windows: Settings → MCP & Integrations

### Q: MCP 顯示 Inactive？
**A**: 
1. 檢查 Bearer Token 是否正確（格式：`Bearer <token>`）
2. 確認 Account ID 正確（Sandbox 需要 `tstdrv` 前綴）
3. 確認 NetSuite AI Connector SuiteApp 已安裝

### Q: 工具列表為空？
**A**: 
1. 使用 `/v1/all` 端點（不是 `/v1/suiteapp/...`）
2. 重啟 Cursor
3. 檢查 NetSuite AI Connector SuiteApp 版本

### Q: 如何取得 Bearer Token？
**A**: 
- 參考 [Folio3 的完整指南](https://netsuite.folio3.com/blog/ide-integration-guide-for-netsuite-mcp-tools-in-cursor-vs-code/)
- 或使用 Postman 完成 OAuth 2.0 流程

---

## 📝 配置檔案位置

- **macOS**: `~/.cursor/mcp.json`
- **Windows**: `%APPDATA%\Cursor\mcp.json`

---

## 🔗 相關文件

- [完整設定指南](./netsuite-mcp-setup-guide.md)
- [故障排除指南](./netsuite-mcp-troubleshooting.md)






