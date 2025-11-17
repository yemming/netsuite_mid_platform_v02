# n8n 連接 NetSuite 指南

## 連接方式比較

### 方案 A：n8n 直接連接 NetSuite（推薦）

**優點**：
- ✅ 減少中間層，效能最佳
- ✅ 不佔用 Next.js 資源
- ✅ 可以充分利用 n8n 的並行處理能力

**缺點**：
- ❌ 需要在 n8n 中配置 OAuth 1.0a（較複雜）
- ❌ NetSuite 認證資訊需要在 n8n 中管理

**適用場景**：
- 大量資料同步
- 需要高頻率同步
- 需要並行處理多個表

### 方案 B：n8n → Next.js API → NetSuite

**優點**：
- ✅ 重用現有程式碼（`lib/netsuite-client.ts`）
- ✅ 認證集中管理（只需在 Next.js 中配置）
- ✅ 易於除錯（可以在 Next.js 中加日誌）

**缺點**：
- ❌ 多一層延遲
- ❌ Next.js 仍需處理請求（可能影響前端效能）
- ❌ 無法充分利用 n8n 的並行處理

**適用場景**：
- 小量資料同步
- 需要重用現有程式碼
- 認證管理複雜

### 方案 C：使用 NetSuite MCP（不適用於 n8n）

**說明**：
- MCP (Model Context Protocol) 是 Cursor AI 的專用協議
- n8n 不支援 MCP
- 此方案僅適用於 Cursor AI 環境

## 推薦方案：方案 A（n8n 直接連接）

### 實作步驟

#### 1. 在 n8n 中建立 OAuth 1.0a Credential

1. 進入 n8n → **Credentials** → **New Credential**
2. 選擇 **OAuth 1.0 API**
3. 填寫以下資訊：

```
Consumer Key: {{ $env.NETSUITE_CONSUMER_KEY }}
Consumer Secret: {{ $env.NETSUITE_CONSUMER_SECRET }}
Access Token: {{ $env.NETSUITE_TOKEN_ID }}
Access Token Secret: {{ $env.NETSUITE_TOKEN_SECRET }}
Signature Method: HMAC-SHA256
```

4. **重要**：NetSuite 需要額外的 Realm 參數，需要在 HTTP Request Node 中手動加入

#### 2. 建立 HTTP Request Node 連接 NetSuite

**設定範例**：

**Node 類型**: HTTP Request

**設定**：
- **Method**: POST
- **URL**: `https://{{ $env.NETSUITE_ACCOUNT_ID }}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql`
- **Authentication**: OAuth 1.0 API（選擇上面建立的 Credential）
- **Headers**:
  ```
  Content-Type: application/json
  Prefer: transient
  ```
- **Body**:
  ```json
  {
    "q": "SELECT * FROM customer LIMIT 10"
  }
  ```

**注意**：NetSuite 的 OAuth 1.0a 需要在 Authorization header 中加入 Realm，但 n8n 的 OAuth 1.0 API Credential 可能不支援。如果遇到認證錯誤，需要使用 **Code Node** 手動生成 OAuth 簽名。

#### 3. 手動生成 OAuth 簽名（如果 Credential 不支援 Realm）

如果 n8n 的 OAuth 1.0 API Credential 無法正確處理 NetSuite 的 Realm，可以使用 **Code Node** 手動生成簽名：

**Node 類型**: Code

**Language**: JavaScript

**Code**:
```javascript
const crypto = require('crypto');

// OAuth 1.0a 參數
const consumerKey = $env.NETSUITE_CONSUMER_KEY;
const consumerSecret = $env.NETSUITE_CONSUMER_SECRET;
const tokenId = $env.NETSUITE_TOKEN_ID;
const tokenSecret = $env.NETSUITE_TOKEN_SECRET;
const accountId = $env.NETSUITE_ACCOUNT_ID;

// 請求資訊
const method = 'POST';
const url = `https://${accountId.toLowerCase()}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql`;

// 生成 OAuth 參數
const oauthParams = {
  oauth_consumer_key: consumerKey,
  oauth_token: tokenId,
  oauth_signature_method: 'HMAC-SHA256',
  oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
  oauth_nonce: crypto.randomBytes(16).toString('hex'),
  oauth_version: '1.0',
};

// 生成簽名
const parameterString = Object.keys(oauthParams)
  .sort()
  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
  .join('&');

const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(parameterString)}`;
const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
const signature = crypto.createHmac('sha256', signingKey).update(signatureBaseString).digest('base64');

// 生成 Authorization header
const authHeader = `OAuth ${Object.keys(oauthParams)
  .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
  .join(', ')}, oauth_signature="${encodeURIComponent(signature)}", realm="${accountId.toUpperCase()}"`;

return {
  json: {
    authorization: authHeader,
    url: url,
  },
};
```

然後在 HTTP Request Node 中使用：
- **Authorization**: Custom Auth
- **Header Name**: `Authorization`
- **Header Value**: `{{ $('Code Node').first().json.authorization }}`

### 方案 B：透過 Next.js API（備用方案）

如果方案 A 太複雜，可以使用方案 B：

**Node 類型**: HTTP Request

**設定**：
- **Method**: POST
- **URL**: `{{ $env.NEXT_PUBLIC_API_URL }}/api/sync-customers`
- **Authentication**: None（或使用 API Key）
- **Body**: 
  ```json
  {
    "syncType": "full"
  }
  ```

**優點**：
- 簡單，不需要處理 OAuth
- 重用現有程式碼

**缺點**：
- 效能較差（多一層）
- Next.js 需要處理請求

## 測試連接

### 測試 SuiteQL 查詢

建立一個簡單的工作流：

```
1. HTTP Request Node（連接 NetSuite）
   ↓
2. Code Node（處理回應）
   ↓
3. 輸出結果
```

**HTTP Request Node 設定**：
- **Method**: POST
- **URL**: `https://{{ $env.NETSUITE_ACCOUNT_ID }}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql`
- **Body**:
  ```json
  {
    "q": "SELECT id, name FROM subsidiary LIMIT 5"
  }
  ```

**預期回應**：
```json
{
  "items": [
    { "id": "1", "name": "Main Subsidiary" },
    ...
  ],
  "count": 5,
  "hasMore": false
}
```

### 測試 REST API 查詢

**HTTP Request Node 設定**：
- **Method**: GET
- **URL**: `https://{{ $env.NETSUITE_ACCOUNT_ID }}.suitetalk.api.netsuite.com/services/rest/record/v1/customer?limit=5`

**預期回應**：
```json
{
  "items": [
    { "id": "123", "links": [...] },
    ...
  ],
  "count": 5,
  "hasMore": false
}
```

## 常見問題

### Q1: OAuth 認證失敗

**錯誤訊息**：`401 Unauthorized` 或 `Invalid signature`

**解決方案**：
1. 檢查 Consumer Key/Secret 和 Token ID/Secret 是否正確
2. 確認 Account ID 格式正確（全大寫）
3. 確認 Realm 參數已加入 Authorization header
4. 檢查時間戳記是否在有效範圍內（NetSuite 允許 ±5 分鐘）

### Q2: SuiteQL 查詢失敗

**錯誤訊息**：`400 Bad Request` 或 `Invalid query`

**解決方案**：
1. 確認 SuiteQL 語法正確（使用 NetSuite 的 SuiteQL 語法，不是標準 SQL）
2. 確認欄位名稱正確（使用小寫）
3. 確認表名正確（例如：`customer` 不是 `customers`）

### Q3: 限流問題

**錯誤訊息**：`429 Too Many Requests`

**解決方案**：
1. 在 HTTP Request Node 中加入 **Wait** Node，設定請求間隔（例如：每秒 1 次）
2. 使用 **Split in Batches** Node 分批處理
3. 實作重試機制（n8n 內建支援）

## 最佳實踐

1. **使用環境變數**：將 NetSuite 認證資訊存放在 n8n 環境變數中，不要硬編碼
2. **錯誤處理**：使用 n8n 的 **Error Trigger** 或 **Try-Catch** 模式處理錯誤
3. **重試機制**：在 HTTP Request Node 中啟用 Retry（最多 3 次）
4. **批次處理**：大表使用 **Split in Batches** Node 分批處理
5. **日誌記錄**：使用 **Set** Node 記錄執行狀態，方便除錯

