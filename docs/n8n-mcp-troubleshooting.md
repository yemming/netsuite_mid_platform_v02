# n8n MCP 工具故障排除指南

> **最後更新**: 2025-01-16  
> **用途**: 解決 n8n MCP 工具連接問題

---

## 🔍 問題診斷

### 症狀
- n8n MCP 工具啟動時顯示 "n8n API is not configured"
- 無法連接到 n8n 實例
- MCP 工具無法執行 n8n 工作流相關操作

### 常見原因
1. **本地 n8n 服務未運行**：`localhost:5678` 無法連接
2. **環境變數未正確傳遞**：MCP 配置中的環境變數沒有生效
3. **API Key 無效或過期**：n8n API Key 已過期或被撤銷
4. **版本過舊**：n8n-mcp 版本過舊，缺少最新修復

---

## ✅ 解決方案

### 方案 1：更新 n8n-mcp 到最新版本

```bash
# 更新全局安裝的 n8n-mcp
npm install -g n8n-mcp@latest

# 驗證版本
npm list -g n8n-mcp
```

**當前版本**：
- 已安裝：`2.21.1` → 最新：`2.22.18` ✅ 已更新

---

### 方案 2：檢查並啟動本地 n8n 服務

#### 2.1 檢查 n8n 是否運行

```bash
# 檢查端口 5678 是否被占用
lsof -i :5678

# 或測試連接
curl http://localhost:5678/healthz
```

#### 2.2 啟動本地 n8n（如果未運行）

**使用 Docker**：
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**使用 npm**：
```bash
# 全局安裝 n8n
npm install -g n8n

# 啟動 n8n
n8n start
```

**使用 npx（臨時）**：
```bash
npx n8n
```

#### 2.3 獲取 n8n API Key

1. 訪問 `http://localhost:5678`
2. 登入 n8n
3. 前往 **Settings** → **API**
4. 點擊 **Create API Key**
5. 複製生成的 API Key

---

### 方案 3：使用雲端 n8n（推薦）

如果你已經在 Zeabur 上部署了 n8n，可以使用雲端配置：

#### 3.1 更新 MCP 配置

編輯 `~/.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "n8n-mcp-cloud": {
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": {
        "N8N_API_URL": "https://yemming-n8n.zeabur.app",
        "N8N_API_KEY": "你的雲端 n8n API Key"
      }
    }
  }
}
```

#### 3.2 獲取雲端 n8n API Key

1. 訪問你的 Zeabur n8n URL：`https://yemming-n8n.zeabur.app`
2. 登入 n8n
3. 前往 **Settings** → **API**
4. 建立新的 API Key
5. 更新 MCP 配置

---

### 方案 4：驗證 MCP 配置

#### 4.1 檢查配置文件位置

**macOS**：
- `~/.cursor/mcp.json`
- `~/Library/Application Support/Cursor/User/globalStorage/mcp.json`

**Windows**：
- `%APPDATA%\Cursor\User\globalStorage\mcp.json`

**Linux**：
- `~/.config/Cursor/User/globalStorage/mcp.json`

#### 4.2 確認配置格式

```json
{
  "mcpServers": {
    "n8n-mcp-local": {
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": {
        "N8N_API_URL": "http://localhost:5678",
        "N8N_API_KEY": "你的 API Key"
      }
    }
  }
}
```

**重要**：
- ✅ 使用 `npx n8n-mcp` 而不是全局安裝的版本（確保使用最新版本）
- ✅ 環境變數必須在 `env` 區塊中
- ✅ API URL 不要包含尾隨斜線（`/`）

---

## 🔧 進階除錯

### 檢查環境變數是否傳遞

1. 在 Cursor 中重啟 MCP 服務器
2. 查看 n8n-mcp 的啟動日誌
3. 確認是否顯示 "n8n API: configured" 而不是 "not configured"

### 測試 n8n API 連接

```bash
# 使用 curl 測試 API
curl -H "X-N8N-API-KEY: 你的API_KEY" \
     http://localhost:5678/api/v1/workflows

# 或測試雲端
curl -H "X-N8N-API-KEY: 你的API_KEY" \
     https://yemming-n8n.zeabur.app/api/v1/workflows
```

**預期回應**：應該返回工作流列表（JSON 格式）

### 檢查 API Key 權限

確保 API Key 有足夠的權限：
- ✅ 讀取工作流
- ✅ 執行工作流
- ✅ 讀取執行歷史

---

## 📋 檢查清單

### 基本檢查
- [ ] n8n-mcp 已更新到最新版本（`2.22.18`）
- [ ] MCP 配置文件路徑正確
- [ ] 配置文件格式正確（JSON 有效）
- [ ] 環境變數 `N8N_API_URL` 已設定
- [ ] 環境變數 `N8N_API_KEY` 已設定

### 連接檢查
- [ ] n8n 服務正在運行（本地或雲端）
- [ ] 可以訪問 n8n URL（瀏覽器測試）
- [ ] API Key 有效且未過期
- [ ] 網絡連接正常（雲端 n8n）

### 功能檢查
- [ ] 重啟 Cursor 後 MCP 服務器正常啟動
- [ ] 日誌顯示 "n8n API: configured"
- [ ] 可以使用 n8n MCP 工具（例如：`list_workflows`）

---

## 🚨 常見錯誤

### 錯誤 1：`n8n API is not configured`

**原因**：環境變數未正確傳遞

**解決**：
1. 確認 MCP 配置中的 `env` 區塊格式正確
2. 重啟 Cursor
3. 檢查環境變數名稱是否正確（`N8N_API_URL`、`N8N_API_KEY`）

### 錯誤 2：`Connection refused` 或 `ECONNREFUSED`

**原因**：n8n 服務未運行或 URL 錯誤

**解決**：
1. 檢查本地 n8n 是否運行：`lsof -i :5678`
2. 確認 API URL 正確（不要包含 `/api` 路徑）
3. 測試連接：`curl http://localhost:5678/healthz`

### 錯誤 3：`401 Unauthorized`

**原因**：API Key 無效或過期

**解決**：
1. 在 n8n 中重新生成 API Key
2. 更新 MCP 配置
3. 重啟 Cursor

### 錯誤 4：`404 Not Found`

**原因**：API URL 錯誤或 n8n 版本不支援 API

**解決**：
1. 確認 n8n 版本 >= 1.0.0（支援 REST API）
2. 確認 URL 格式：`http://localhost:5678`（不含 `/api`）
3. 檢查 n8n 是否啟用 API（Settings → API）

---

## 📚 參考資料

### n8n 官方文件
- [n8n API 文件](https://docs.n8n.io/api/)
- [n8n MCP 節點](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.mcp/)

### n8n-mcp 套件
- [npm: n8n-mcp](https://www.npmjs.com/package/n8n-mcp)
- 最新版本：`2.22.18`（2025-01-16）

### 相關文件
- [n8n 連接 NetSuite 指南](./n8n-netsuite-connection-guide.md)
- [n8n 工作流範例](./n8n-workflow-example.md)

---

## 💡 最佳實踐

### 1. 使用雲端 n8n（生產環境）
- ✅ 更穩定，不依賴本地服務
- ✅ 可以從任何地方訪問
- ✅ 自動備份和持久化

### 2. 使用本地 n8n（開發環境）
- ✅ 快速迭代和測試
- ✅ 不需要網絡連接
- ✅ 可以離線開發

### 3. 定期更新
- ✅ 每週檢查 n8n-mcp 更新
- ✅ 保持 n8n 版本最新
- ✅ 定期輪換 API Key

### 4. 備份配置
- ✅ 將 MCP 配置加入版本控制（注意：不要提交 API Key）
- ✅ 使用環境變數管理敏感資訊
- ✅ 記錄 API Key 的建立日期和過期時間

---

**文檔維護**: 隨著 n8n-mcp 更新，請持續更新此文件。  
**最後更新**: 2025-01-16  
**版本**: 1.0










