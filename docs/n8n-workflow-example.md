這個頁面的設計來看。# n8n 工作流範例：NetSuite 資料同步

## 單表同步工作流範例

### 工作流結構

```
1. Webhook Trigger
   ↓
2. 讀取欄位映射配置（HTTP Request → Next.js API）
   ↓
3. 從 NetSuite 查詢資料（HTTP Request → NetSuite SuiteQL API）
   ↓
4. 資料轉換（Code Node：使用動態轉換函數）
   ↓
5. 批次寫入 Supabase（PostgreSQL Node：Upsert）
   ↓
6. 記錄同步日誌（PostgreSQL Node：Insert to sync_logs）
   ↓
7. 回傳結果（Respond to Webhook）
```

### 詳細配置

#### 1. Webhook Trigger

**設定**：
- **HTTP Method**: POST
- **Path**: `/webhook/sync-{table-name}`（例如：`/webhook/sync-customers`）
- **Response Mode**: Respond When Last Node Finishes

**Body 參數**：
```json
{
  "mappingKey": "customers",
  "syncType": "full" // 或 "incremental"
}
```

#### 2. 讀取欄位映射配置

**Node 類型**: HTTP Request

**設定**：
- **Method**: GET
- **URL**: `{{ $env.NEXT_PUBLIC_SUPABASE_URL }}/api/field-mapping?mappingKey={{ $json.mappingKey }}`
- **Authentication**: Bearer Token（使用 Supabase Anon Key）

**輸出範例**：
```json
{
  "success": true,
  "data": {
    "fields": [
      {
        "netsuite_field_name": "id",
        "supabase_column_name": "netsuite_internal_id",
        "supabase_column_type": "integer",
        "transformation_rule": {}
      },
      {
        "netsuite_field_name": "isinactive",
        "supabase_column_name": "is_active",
        "supabase_column_type": "boolean",
        "transformation_rule": {
          "type": "boolean",
          "true_value": "F",
          "false_value": "T"
        }
      }
    ]
  }
}
```

#### 3. 從 NetSuite 查詢資料

**Node 類型**: HTTP Request

**設定**：
- **Method**: POST
- **URL**: `https://{{ $env.NETSUITE_ACCOUNT_ID }}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql`
- **Authentication**: OAuth 1.0a（需要在 n8n Credentials 中設定）
- **Headers**:
  - `Content-Type`: `application/json`
  - `Prefer`: `transient`
- **Body**:
```json
{
  "q": "SELECT * FROM customer ORDER BY id"
}
```

**OAuth 1.0a 設定**（在 n8n Credentials 中）：
- **Consumer Key**: `{{ $env.NETSUITE_CONSUMER_KEY }}`
- **Consumer Secret**: `{{ $env.NETSUITE_CONSUMER_SECRET }}`
- **Access Token**: `{{ $env.NETSUITE_TOKEN_ID }}`
- **Access Token Secret**: `{{ $env.NETSUITE_TOKEN_SECRET }}`
- **Signature Method**: HMAC-SHA256
- **Realm**: `{{ $env.NETSUITE_ACCOUNT_ID }}`

#### 4. 資料轉換（Code Node）

**Node 類型**: Code

**Language**: JavaScript

**Code**:
```javascript
// 取得欄位映射配置（從步驟 2）
const fieldMappings = $('讀取欄位映射配置').first().json.data.fields;

// 取得 NetSuite 資料（從步驟 3）
const netsuiteRecords = $('從 NetSuite 查詢資料').first().json.items || [];

// 同步時間戳記
const syncTimestamp = new Date().toISOString();

// 轉換函數
function transformRecord(netsuiteRecord, fieldMappings, syncTimestamp) {
  const result = {
    sync_timestamp: syncTimestamp,
    updated_at: syncTimestamp,
  };

  fieldMappings.forEach((mapping) => {
    const netsuiteValue = netsuiteRecord[mapping.netsuite_field_name];
    let transformedValue = netsuiteValue;

    // 處理 null/undefined
    if (transformedValue === null || transformedValue === undefined) {
      transformedValue = null;
    } else {
      // 根據轉換規則處理
      const rule = mapping.transformation_rule || {};
      
      if (rule.type === 'boolean') {
        transformedValue = transformedValue === rule.true_value || transformedValue === 'T';
      } else if (rule.type === 'integer') {
        transformedValue = parseInt(String(transformedValue), 10) || null;
      } else if (rule.type === 'number' || rule.type === 'numeric') {
        transformedValue = parseFloat(String(transformedValue)) || null;
      } else if (rule.type === 'date' || rule.type === 'timestamp') {
        const date = new Date(transformedValue);
        transformedValue = isNaN(date.getTime()) ? null : date.toISOString();
      } else if (mapping.supabase_column_type === 'boolean') {
        transformedValue = transformedValue === 'T' || transformedValue === true || transformedValue === '1';
      } else if (mapping.supabase_column_type === 'integer' || mapping.supabase_column_type === 'bigint') {
        transformedValue = parseInt(String(transformedValue), 10) || null;
      } else if (mapping.supabase_column_type === 'numeric') {
        transformedValue = parseFloat(String(transformedValue)) || null;
      } else {
        transformedValue = String(transformedValue);
      }
    }

    if (transformedValue !== undefined) {
      result[mapping.supabase_column_name] = transformedValue;
    }
  });

  return result;
}

// 轉換所有記錄
const transformedRecords = netsuiteRecords.map(record => 
  transformRecord(record, fieldMappings, syncTimestamp)
);

// 返回結果
return transformedRecords.map(record => ({ json: record }));
```

#### 5. 批次寫入 Supabase

**Node 類型**: PostgreSQL

**設定**：
- **Operation**: Execute Query
- **Query**:
```sql
INSERT INTO ns_entities_customers (
  {{ $json.keys().join(', ') }}
)
VALUES (
  {{ $json.values().map(v => typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v || 'NULL').join(', ') }}
)
ON CONFLICT (netsuite_internal_id) 
DO UPDATE SET
  {{ Object.keys($json).filter(k => k !== 'netsuite_internal_id').map(k => `${k} = EXCLUDED.${k}`).join(', ') }},
  updated_at = NOW();
```

**或使用 Supabase REST API**（更簡單）：

**Node 類型**: HTTP Request

**設定**：
- **Method**: POST
- **URL**: `{{ $env.NEXT_PUBLIC_SUPABASE_URL }}/rest/v1/ns_entities_customers`
- **Headers**:
  - `apikey`: `{{ $env.NEXT_PUBLIC_SUPABASE_ANON_KEY }}`
  - `Authorization`: `Bearer {{ $env.NEXT_PUBLIC_SUPABASE_ANON_KEY }}`
  - `Content-Type`: `application/json`
  - `Prefer`: `resolution=merge-duplicates`
- **Body**: `{{ $json }}`

**批次處理**（使用 Split in Batches Node）：
- 在「資料轉換」和「寫入 Supabase」之間加入 **Split in Batches** Node
- **Batch Size**: 1000

#### 6. 記錄同步日誌

**Node 類型**: PostgreSQL 或 HTTP Request

**設定**：
- **Table**: `sync_logs`
- **Operation**: Insert
- **Data**:
```json
{
  "table_name": "ns_entities_customers",
  "sync_type": "full",
  "sync_status": "success",
  "records_processed": {{ $('從 NetSuite 查詢資料').first().json.items.length }},
  "records_inserted": {{ $('批次寫入 Supabase').all().length }},
  "sync_started_at": "{{ $('Webhook Trigger').first().json.headers['x-timestamp'] }}",
  "sync_completed_at": "{{ new Date().toISOString() }}"
}
```

#### 7. 回傳結果

**Node 類型**: Respond to Webhook

**設定**：
- **Response Code**: 200
- **Response Body**:
```json
{
  "success": true,
  "message": "同步完成",
  "data": {
    "recordsProcessed": {{ $('從 NetSuite 查詢資料').first().json.items.length }},
    "recordsInserted": {{ $('批次寫入 Supabase').all().length }},
    "syncTimestamp": "{{ new Date().toISOString() }}"
  }
}
```

## 批次同步工作流範例

### 工作流結構

```
1. Cron Trigger（每天凌晨 2 點執行）
   ↓
2. 讀取 table_mapping_config（HTTP Request → Next.js API）
   ↓
3. 過濾啟用的表（Filter Node）
   ↓
4. 並行執行單表同步（Execute Workflow Node × N）
   ↓
5. 彙總結果（Aggregate Node）
   ↓
6. 發送通知（Email/Slack Node）
```

### 詳細配置

#### 1. Cron Trigger

**設定**：
- **Trigger Times**: `0 2 * * *`（每天凌晨 2 點）

#### 2. 讀取表映射配置

**Node 類型**: HTTP Request

**URL**: `{{ $env.NEXT_PUBLIC_SUPABASE_URL }}/api/table-mapping`

#### 3. 過濾啟用的表

**Node 類型**: Filter

**Conditions**:
- `is_enabled` = `true`

#### 4. 並行執行單表同步

**Node 類型**: Execute Workflow

**設定**：
- **Workflow**: 單表同步工作流（上面定義的）
- **Input Data**: `{{ $json }}`（傳遞 mapping_key）

**注意**：n8n 的 Execute Workflow Node 預設是順序執行，要並行執行需要使用 **Split in Batches** 或 **Wait** Node 的並行模式。

## 欄位變更偵測工作流

### 工作流結構

```
1. Cron Trigger（每天執行一次）
   ↓
2. 讀取 table_mapping_config（取得要掃描的表清單）
   ↓
3. 對每個表執行 Schema 掃描（Loop Over Items）
   ↓
4. 呼叫 Next.js API 偵測新欄位
   ↓
5. 如果有新欄位，發送通知
```

### 詳細配置

#### 1. Cron Trigger

**設定**：
- **Trigger Times**: `0 3 * * *`（每天凌晨 3 點）

#### 2. 讀取表映射配置

**Node 類型**: HTTP Request

**URL**: `{{ $env.NEXT_PUBLIC_SUPABASE_URL }}/api/table-mapping`

#### 3. Loop Over Items

**Node 類型**: Loop Over Items

**設定**：
- **Field to Loop Over**: `data`（從步驟 2 的輸出）

#### 4. 偵測新欄位

**Node 類型**: HTTP Request

**設定**：
- **Method**: POST
- **URL**: `{{ $env.NEXT_PUBLIC_SUPABASE_URL }}/api/detect-schema-changes`
- **Body**:
```json
{
  "mappingKey": "{{ $json.mapping_key }}"
}
```

#### 5. 發送通知

**Node 類型**: IF Node

**條件**: `{{ $json.data.newFields > 0 }}`

**True 分支**: 發送 Email/Slack 通知
**False 分支**: 結束

## 環境變數設定

在 n8n 中設定以下環境變數：

```env
# NetSuite
NETSUITE_ACCOUNT_ID=your_account_id
NETSUITE_CONSUMER_KEY=your_consumer_key
NETSUITE_CONSUMER_SECRET=your_consumer_secret
NETSUITE_TOKEN_ID=your_token_id
NETSUITE_TOKEN_SECRET=your_token_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Next.js API（如果需要）
NEXT_PUBLIC_API_URL=https://your-nextjs-app.com
```

## 注意事項

1. **OAuth 1.0a 認證**：n8n 的 HTTP Request Node 支援 OAuth 1.0a，但需要正確設定 Realm
2. **批次處理**：大表（> 10000 筆）建議使用 Split in Batches Node 分批處理
3. **錯誤處理**：使用 n8n 的 Error Trigger 或 Try-Catch 模式處理錯誤
4. **重試機制**：在 Node 設定中啟用 Retry（最多 3 次）
5. **執行歷史**：n8n 會自動記錄每次執行的詳細日誌，可在 n8n UI 中查看

