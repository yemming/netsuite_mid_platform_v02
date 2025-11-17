# NetSuite 資料備份器實作總結

## 已完成項目

### 1. 資料庫結構

#### ✅ field_mapping_config 表
- **檔案**: `create_field_mapping_config.sql`
- **功能**: 管理 NetSuite 欄位到 Supabase 欄位的映射關係
- **關鍵欄位**:
  - `netsuite_field_name`: NetSuite 欄位名稱
  - `supabase_column_name`: Supabase 欄位名稱
  - `transformation_rule`: 轉換規則（JSONB）
  - `is_active`: 是否啟用
  - `is_custom_field`: 是否為客制欄位
  - `detected_at`: 首次偵測時間

### 2. API 端點

#### ✅ 欄位偵測 API
- **路徑**: `/api/detect-schema-changes`
- **功能**: 偵測 NetSuite Schema 變更，自動發現新欄位
- **方法**:
  - `POST`: 掃描指定表的欄位變更
  - `GET`: 查詢待確認的新欄位

#### ✅ 欄位映射管理 API
- **路徑**: `/api/field-mapping`
- **功能**: CRUD 操作欄位映射配置
- **方法**:
  - `GET`: 查詢欄位映射
  - `POST`: 建立欄位映射
  - `PUT`: 更新欄位映射
  - `DELETE`: 刪除欄位映射

#### ✅ 遷移 SQL 生成 API
- **路徑**: `/api/generate-migration`
- **功能**: 根據待確認的新欄位生成 Supabase ALTER TABLE 語句
- **方法**:
  - `POST`: 生成遷移 SQL
  - `PUT`: 執行遷移（目前返回 SQL，需手動執行）

#### ✅ n8n 同步觸發 API
- **路徑**: `/api/trigger-n8n-sync`
- **功能**: 從 Next.js 前端觸發 n8n 工作流執行同步任務
- **方法**:
  - `POST`: 觸發同步
  - `GET`: 查詢同步狀態

### 3. 前端頁面

#### ✅ 欄位映射管理頁面
- **路徑**: `/dashboard/field-mapping`
- **功能**:
  - 顯示待確認的新欄位
  - 批次選擇和啟用欄位
  - 生成並顯示遷移 SQL
  - 掃描新欄位

#### ✅ n8n 同步管理頁面
- **路徑**: `/dashboard/n8n-sync`
- **功能**:
  - 顯示可同步的表列表
  - 觸發單表同步
  - 查看同步日誌
  - 監控同步狀態

### 4. 核心工具函數

#### ✅ 動態欄位轉換工具
- **檔案**: `lib/field-transformation.ts`
- **功能**:
  - `getFieldMappings()`: 取得欄位映射配置
  - `transformRecord()`: 轉換單筆記錄
  - `transformValue()`: 轉換單一欄位值
  - `transformRecords()`: 批次轉換記錄
  - `generateTransformationFunction()`: 生成 n8n Code Node 可用的轉換函數

### 5. 文件

#### ✅ n8n 工作流範例
- **檔案**: `docs/n8n-workflow-example.md`
- **內容**:
  - 單表同步工作流詳細配置
  - 批次同步工作流範例
  - 欄位變更偵測工作流
  - 環境變數設定

#### ✅ n8n 連接 NetSuite 指南
- **檔案**: `docs/n8n-netsuite-connection-guide.md`
- **內容**:
  - 連接方式比較（方案 A/B/C）
  - OAuth 1.0a 配置步驟
  - 測試連接方法
  - 常見問題解決方案

## 使用流程

### 1. 初始設定

1. **執行資料庫遷移**
   ```sql
   -- 在 Supabase SQL Editor 中執行
   \i create_field_mapping_config.sql
   ```

2. **配置環境變數**
   ```env
   NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com
   ```

3. **在 n8n 中建立工作流**
   - 參考 `docs/n8n-workflow-example.md`
   - 配置 NetSuite OAuth 1.0a 認證
   - 設定 Supabase 連接

### 2. 欄位變更處理流程

1. **偵測新欄位**
   - 訪問 `/dashboard/field-mapping`
   - 點擊「掃描新欄位」按鈕
   - 或使用 API: `POST /api/detect-schema-changes`

2. **確認欄位映射**
   - 查看待確認的新欄位列表
   - 檢查建議的 Supabase 欄位名稱和型別
   - 選擇要啟用的欄位

3. **生成遷移 SQL**
   - 點擊「生成遷移 SQL」
   - 複製 SQL 語句
   - 在 Supabase SQL Editor 中執行

4. **啟用欄位映射**
   - 點擊「啟用選中的欄位」
   - 欄位狀態變為 `is_active = true`
   - n8n 工作流會自動使用新的欄位映射

### 3. 同步資料流程

1. **觸發同步**
   - 訪問 `/dashboard/n8n-sync`
   - 選擇要同步的表
   - 點擊「同步」按鈕

2. **監控同步狀態**
   - 查看同步日誌
   - 檢查成功/失敗狀態
   - 查看處理的記錄數

3. **查看同步結果**
   - 在 Supabase 中查詢對應的表
   - 確認資料已正確同步

## 後續步驟

### 需要在 n8n 中實作的工作流

1. **單表同步工作流**
   - 參考 `docs/n8n-workflow-example.md` 中的「單表同步工作流範例」
   - 為每個主檔表建立獨立工作流
   - 配置 Webhook Trigger

2. **批次同步工作流**
   - 參考 `docs/n8n-workflow-example.md` 中的「批次同步工作流範例」
   - 配置 Cron Trigger
   - 實作並行執行

3. **欄位變更偵測工作流**
   - 參考 `docs/n8n-workflow-example.md` 中的「欄位變更偵測工作流」
   - 配置每天執行一次
   - 設定通知機制

### 效能優化建議

1. **批次處理**
   - 大表（> 10000 筆）使用 Split in Batches Node
   - 每批 1000 筆

2. **並行處理**
   - 使用 n8n 的並行執行功能
   - 同時同步多個表

3. **增量同步**
   - 使用 `lastmodifieddate` 欄位過濾
   - 只同步更新的記錄

4. **錯誤重試**
   - 在 HTTP Request Node 中啟用 Retry
   - 最多重試 3 次

## 注意事項

1. **NetSuite OAuth 1.0a 認證**
   - 需要在 n8n 中正確配置 Realm 參數
   - 如果遇到認證問題，參考 `docs/n8n-netsuite-connection-guide.md`

2. **欄位映射配置**
   - 新欄位預設為 `is_active = false`，需要手動啟用
   - 啟用前需先在 Supabase 中執行 ALTER TABLE

3. **資料轉換**
   - 轉換邏輯從 `field_mapping_config` 動態讀取
   - 修改映射配置後，n8n 工作流會自動使用新配置

4. **同步日誌**
   - 所有同步操作都會記錄到 `sync_logs` 表
   - 可在 `/dashboard/n8n-sync` 查看

## 測試建議

1. **測試欄位偵測**
   - 在 NetSuite 中新增一個客制欄位
   - 執行欄位偵測
   - 確認新欄位被正確偵測

2. **測試欄位映射**
   - 確認欄位映射配置正確
   - 測試資料轉換邏輯

3. **測試同步流程**
   - 觸發單表同步
   - 確認資料正確寫入 Supabase
   - 檢查同步日誌

4. **測試錯誤處理**
   - 模擬 NetSuite API 錯誤
   - 確認重試機制正常運作
   - 檢查錯誤日誌

## 相關文件

- [n8n 工作流範例](./n8n-workflow-example.md)
- [n8n 連接 NetSuite 指南](./n8n-netsuite-connection-guide.md)
- [NetSuite 中臺建置完全指南](../NetSuite中臺建置完全指南.md)

