# NetSuite MCP 設定指南

> **最後更新**: 2025-01-XX  
> **用途**: 在 Cursor 中設定 NetSuite MCP Tools  
> **參考來源**: [Folio3 NetSuite MCP IDE Integration Guide](https://netsuite.folio3.com/blog/ide-integration-guide-for-netsuite-mcp-tools-in-cursor-vs-code/)

---

## 📋 前置準備

### 必要條件

1. ✅ **Cursor 已安裝**
2. ✅ **Node.js 18+ 已安裝**（用於 Command-Based 配置）
3. ✅ **NetSuite Access Token (Bearer Token)** 已取得
4. ✅ **NetSuite AI Connector SuiteApp 已安裝**

### 獲取 NetSuite Access Token

根據 [Folio3 的 Postman 設定指南](https://netsuite.folio3.com/blog/ide-integration-guide-for-netsuite-mcp-tools-in-cursor-vs-code/)，你需要：

1. **建立 OAuth 2.0 Integration**
   - 登入 NetSuite
   - 前往 **Setup > Integration > Manage Integrations > New**
   - 設定：
     - ✅ **OAuth 2.0**: 已勾選
     - ✅ **Authorization Code Grant**: 已勾選
     - ✅ **Public Client**: 已勾選
     - ✅ **Redirect URI**: `http://localhost:8080/callback`（或你選擇的端口）
   - 記錄 **Client ID**（Consumer Key）

2. **取得 Bearer Token**
   - 使用 Postman 或其他工具完成 OAuth 2.0 流程
   - 或使用 NetSuite REST API 進行認證
   - 取得 **Access Token (Bearer Token)**

3. **確認 NetSuite Account ID**
   - 從 NetSuite URL 中取得（例如：`https://1234567.app.netsuite.com` → Account ID 是 `1234567`）
   - 或使用 Sandbox 格式：`tstdrv1234567`

---

## 🔧 配置方式

### 方式 1：Direct URL Connection（推薦用於快速測試）

**優點**：
- ✅ 快速設定
- ✅ 不需要本地 Node.js 環境
- ✅ 適合短期使用

**缺點**：
- ❌ 連接可能在不活動後自動關閉
- ❌ 某些客戶端可能不支援 Streamable HTTP

#### macOS 設定步驟

1. **開啟 Cursor 設定**
   - 點擊 **Cursor → Settings → Cursor Settings**
   - 導航至 **Tools & MCP**
   - 點擊 **New MCP Server (Add a Custom MCP Server)**

2. **建立 MCP 配置**

   這會開啟（或建立）`~/.cursor/mcp.json` 文件，加入以下配置：

   ```json
   {
     "mcpServers": {
       "ns-mcp-tools": {
         "url": "https://你的帳戶ID.suitetalk.api.netsuite.com/services/mcp/v1/suiteapp/com.netsuite.mcpstandardtools",
         "headers": {
           "Authorization": "Bearer <你的_BEARER_TOKEN>"
         }
       }
     }
   }
   ```

   **配置說明**：
   - `url`: NetSuite MCP 端點 URL
     - 格式：`https://{ACCOUNT_ID}.suitetalk.api.netsuite.com/services/mcp/v1/suiteapp/com.netsuite.mcpstandardtools`
     - 或使用 `/v1/all` 取得所有工具：`https://{ACCOUNT_ID}.suitetalk.api.netsuite.com/services/mcp/v1/all`
   - `headers.Authorization`: Bearer Token（格式：`Bearer <token>`）

3. **驗證連接**

   - 返回 **MCP & Integrations** 標籤
   - 如果認證成功，你會看到 **Active** 標籤
   - 下方會列出所有可用的 NetSuite MCP 工具

#### Windows 設定步驟

1. **開啟 Cursor 設定**
   - 點擊 **Settings**
   - 導航至 **MCP & Integrations**
   - 點擊 **Add Custom MCP**

2. **建立 MCP 配置**

   配置格式與 macOS 相同，加入上述 JSON 配置。

---

### 方式 2：Command-Based Configuration（推薦用於生產環境）

**優點**：
- ✅ 更穩定的長期連接
- ✅ 更好的除錯能力
- ✅ 支援 STDIO 傳輸（相容性更好）

**缺點**：
- ❌ 需要 Node.js 18+ 環境
- ❌ 設定稍微複雜

#### 設定步驟

1. **確認 Node.js 版本**

   ```bash
   node --version  # 應該 >= 18.0.0
   ```

2. **開啟 Cursor 設定**
   - 點擊 **Cursor → Settings → Cursor Settings**
   - 導航至 **Tools & MCP**
   - 點擊 **New MCP Server**

3. **建立 MCP 配置**

   在 `~/.cursor/mcp.json` 中加入：

   ```json
   {
     "mcpServers": {
       "ns-mcp-tools-remote": {
         "command": "npx",
         "args": [
           "mcp-remote",
           "https://你的帳戶ID.suitetalk.api.netsuite.com/services/mcp/v1/all",
           "--header",
           "Authorization: Bearer <你的_BEARER_TOKEN>"
         ]
       }
     }
   }
   ```

   **配置說明**：
   - `command`: 使用 `npx` 執行 `mcp-remote`
   - `args`: 
     - `mcp-remote`: MCP 遠端代理工具
     - URL: NetSuite MCP 端點
     - `--header`: 認證標頭（注意：這裡不需要 `Bearer` 前綴，`mcp-remote` 會自動處理）

4. **驗證連接**

   - 重啟 Cursor
   - 檢查 **MCP & Integrations** 標籤
   - 確認 NetSuite MCP 伺服器狀態為 **Active**

---

## 🎯 配置範例

### 範例 1：使用 Sandbox 環境

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

### 範例 2：使用 Production 環境

```json
{
  "mcpServers": {
    "ns-mcp-tools": {
      "url": "https://1234567.suitetalk.api.netsuite.com/services/mcp/v1/suiteapp/com.netsuite.mcpstandardtools",
      "headers": {
        "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
}
```

### 範例 3：Command-Based 配置（推薦）

```json
{
  "mcpServers": {
    "ns-mcp-tools-remote": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://tstdrv1234567.suitetalk.api.netsuite.com/services/mcp/v1/all",
        "--header",
        "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
      ]
    }
  }
}
```

---

## 🧪 測試 MCP 連接

### 方法 1：在 Cursor 中測試

1. **開啟 Cursor Chat**（Agent Mode，不是 Ask Mode）
2. **輸入測試查詢**：

   ```
   請使用 NetSuite MCP 工具列出所有可用的表格
   ```

3. **預期結果**：
   - AI 會自動識別並使用 NetSuite MCP 工具
   - 返回 NetSuite 資料庫中的表格列表

### 方法 2：檢查 MCP 工具列表

1. 前往 **Cursor → Settings → MCP & Integrations**
2. 找到你的 NetSuite MCP 伺服器
3. 展開工具列表，應該看到：
   - `list_tables`
   - `runCustomSuiteQL`
   - `getSalesOrderWithFilters`
   - 等其他 NetSuite 工具

---

## ⚠️ 重要注意事項

### 1. Agent Mode vs Ask Mode

- ✅ **Agent Mode**: MCP 工具可以正常運作
- ❌ **Ask Mode**: 只會返回文字回答，不會觸發 MCP 工具

**切換方式**：
- 在 Cursor Chat 中選擇 **Agent Mode**（通常有切換按鈕）

### 2. 使用最新 AI 模型

- 建議使用 **gpt-5** 或 **claude-4.5-sonnet**
- 舊版模型可能無法正確識別 MCP 工具

### 3. MCP 存取權限

- 確保 Cursor 設定中 **MCP Access** 設為 **"All"**
- 否則 MCP 伺服器可能無法啟動

### 4. Bearer Token 安全性

- ⚠️ **不要**將 Bearer Token 提交到 Git
- ⚠️ **不要**在公開場所分享 Token
- ✅ 使用環境變數或安全的配置管理工具

---

## 🔍 故障排除

### 問題 1：MCP 伺服器無法連接

**症狀**：
- MCP 伺服器顯示為 **Inactive**
- 連接錯誤訊息

**解決方案**：
1. 確認 Bearer Token 是否有效（未過期）
2. 確認 URL 格式正確（包含 `https://` 和完整路徑）
3. 確認 Account ID 正確（Sandbox 使用 `tstdrv` 前綴）
4. 檢查 NetSuite AI Connector SuiteApp 是否已安裝

### 問題 2：MCP 工具不可用

**症狀**：
- MCP 伺服器顯示為 **Active**
- 但工具列表中沒有 NetSuite 工具

**解決方案**：
1. 確認使用 `/v1/all` 端點（取得所有工具）
2. 或確認 SuiteApp ID 正確（`com.netsuite.mcpstandardtools`）
3. 重啟 Cursor
4. 檢查 NetSuite AI Connector SuiteApp 版本

### 問題 3：認證失敗

**症狀**：
- 認證錯誤訊息
- 401 Unauthorized

**解決方案**：
1. 確認 Bearer Token 格式正確（`Bearer <token>`）
2. 確認 Token 未過期
3. 重新取得 Bearer Token
4. 確認 OAuth 2.0 Integration 設定正確

### 問題 4：Command-Based 配置無法啟動

**症狀**：
- `npx mcp-remote` 執行失敗
- Node.js 版本錯誤

**解決方案**：
1. 確認 Node.js 版本 >= 18.0.0
2. 更新 Node.js：`brew upgrade node`（macOS）或從官網下載
3. 清除 npm 快取：`npm cache clean --force`
4. 手動測試：`npx mcp-remote --help`

---

## 📚 參考資料

### 官方文件
- [Folio3 NetSuite MCP IDE Integration Guide](https://netsuite.folio3.com/blog/ide-integration-guide-for-netsuite-mcp-tools-in-cursor-vs-code/)
- [NetSuite AI Connector SuiteApp](https://www.netsuite.com/portal/products/ai-connector.shtml)
- [MCP Remote Flags 文件](https://github.com/modelcontextprotocol/servers/tree/main/src/mcp-remote)

### 相關文件
- [NetSuite MCP 故障排除指南](./netsuite-mcp-troubleshooting.md)
- [環境變數設定指南](./environment-variables-template.md)
- [NetSuite 中臺建置完全指南](../NetSuite中臺建置完全指南.md)

---

## 💡 最佳實踐

### 1. 使用 Command-Based 配置（生產環境）

對於長期使用和穩定性，建議使用 Command-Based 配置方式。

### 2. 定期更新 Bearer Token

- Bearer Token 通常有過期時間
- 建議設定提醒，定期更新 Token
- 或使用自動刷新機制

### 3. 使用環境變數管理敏感資訊

雖然 Cursor MCP 配置不直接支援環境變數，但你可以：
- 使用配置管理工具
- 或建立配置範本（不包含實際 Token）

### 4. 測試不同端點

- `/v1/all`: 取得所有工具（推薦）
- `/v1/suiteapp/<applicationid>`: 特定 SuiteApp 工具

---

**文檔維護**: 隨著 NetSuite MCP 更新，請持續更新此文件。  
**最後更新**: 2025-01-XX  
**版本**: 1.0




