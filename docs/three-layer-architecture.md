# 三層架構設計說明

## 📋 概述

新的架構設計分為三層，實現完全自動化的 NetSuite 資料同步流程，無需手動配置每套 ERP 系統。

## 🏗️ 架構圖

```
┌─────────────────────────────────────────────────────────┐
│  第一層：掃描 NetSuite 表                                │
│  - 使用 Metadata API 取得所有 record types              │
│  - 使用 SuiteQL 驗證每個表是否可查詢                    │
│  - 自動更新 table_mapping_config                        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  第二層：欄位映射管理                                    │
│  - 為每個表掃描 NetSuite 欄位                           │
│  - 自動生成欄位映射建議                                  │
│  - 確認並啟用欄位映射                                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  第三層：N8N 同步管理                                    │
│  - 使用已配置的欄位映射                                  │
│  - 觸發 n8n workflow 執行同步                            │
│  - 監控同步狀態和日誌                                    │
└─────────────────────────────────────────────────────────┘
```

## 🔵 第一層：掃描 NetSuite 表

### 功能說明

自動掃描 NetSuite 中所有可用的表，無需手動配置。

### 實作方式

1. **Metadata API 掃描**
   - 呼叫 `/services/rest/record/v1/metadata-catalog`
   - 取得所有可用的 record types

2. **SuiteQL 驗證**
   - 對每個 record type，嘗試執行 `SELECT COUNT(*) FROM table`
   - 驗證表是否存在且可查詢
   - 取得記錄數統計

3. **自動更新配置**
   - 將掃描結果更新到 `table_mapping_config` 表
   - 自動生成：
     - `mapping_key`（從 record type 轉換）
     - `supabase_table_name`（加上 `ns_` 前綴）
     - `label`（中文標籤）
     - `priority`（優先級）
     - `sync_order`（同步順序）

### API 端點

- **POST** `/api/scan-netsuite-tables`
  - 掃描所有 NetSuite 表
  - 返回掃描結果和更新統計

### UI 位置

在「欄位映射管理」頁面頂部，藍色卡片區塊。

## 🟢 第二層：欄位映射管理

### 功能說明

為每個表掃描並配置 NetSuite 欄位到 Supabase 欄位的映射關係。

### 實作方式

1. **選擇表**
   - 從第一層掃描出的表中選擇
   - 點擊「掃描」按鈕

2. **掃描欄位**
   - 使用 Metadata API 或 SuiteQL 查詢取得欄位資訊
   - 自動生成映射建議

3. **確認映射**
   - 檢查自動生成的映射
   - 調整欄位名稱、型別、轉換規則（如需要）
   - 啟用選中的欄位

### API 端點

- **POST** `/api/detect-schema-changes`
  - 掃描指定表的欄位
  - 生成映射建議

- **GET** `/api/detect-schema-changes?includeActive=false`
  - 查詢待確認的欄位

- **PUT** `/api/field-mapping`
  - 啟用或更新欄位映射

### UI 位置

在「欄位映射管理」頁面，綠色卡片區塊。

## 🟡 第三層：N8N 同步管理

### 功能說明

使用已配置的欄位映射，觸發 n8n workflow 執行資料同步。

### 實作方式

1. **選擇表**
   - 從已配置欄位映射的表中選擇
   - 點擊「同步」按鈕

2. **觸發同步**
   - 呼叫 n8n webhook
   - 傳遞表映射配置和欄位映射配置

3. **監控狀態**
   - 查看同步日誌
   - 檢查同步狀態和錯誤

### API 端點

- **POST** `/api/trigger-n8n-sync`
  - 觸發 n8n workflow 執行同步

- **GET** `/api/trigger-n8n-sync`
  - 查詢最近的同步日誌

### UI 位置

在「n8n 同步管理」頁面。

## 🔄 完整流程範例

### 場景：設定新的 NetSuite 環境

1. **第一層：掃描表**
   ```
   1. 前往「欄位映射管理」頁面
   2. 點擊「掃描所有表」按鈕
   3. 系統自動：
      - 從 NetSuite Metadata API 取得所有 record types
      - 用 SuiteQL 驗證每個表
      - 更新 table_mapping_config 表
   4. 結果：發現 50 個可用的表
   ```

2. **第二層：映射欄位**
   ```
   1. 在「欄位映射管理」頁面看到所有可用的表
   2. 選擇「公司別」表，點擊「掃描」
   3. 系統自動：
      - 掃描 NetSuite 欄位
      - 生成映射建議（id → netsuite_internal_id）
      - 加入待確認列表
   4. 確認並啟用欄位映射
   5. 重複步驟 2-4 處理其他表
   ```

3. **第三層：同步資料**
   ```
   1. 前往「n8n 同步管理」頁面
   2. 看到所有已配置欄位映射的表
   3. 選擇「公司別」表，點擊「同步」
   4. n8n workflow 使用欄位映射配置執行同步
   5. 查看同步日誌確認結果
   ```

## ✨ 優勢

### 1. 完全自動化
- ✅ 無需手動配置每套 NetSuite 的表
- ✅ 自動發現所有可用的表
- ✅ 自動生成欄位映射建議

### 2. 通用性
- ✅ 適用於任何 NetSuite 環境
- ✅ 自動適應不同的表結構
- ✅ 支援客制欄位和標準欄位

### 3. 可擴展性
- ✅ 新增表只需重新掃描
- ✅ 新增欄位只需重新掃描欄位
- ✅ 無需修改程式碼

### 4. 可維護性
- ✅ 配置集中管理（資料庫）
- ✅ 清晰的流程分層
- ✅ 完整的日誌和狀態追蹤

## 📝 資料庫表結構

### table_mapping_config
儲存表映射配置：
- `mapping_key`: 映射鍵（例如：subsidiaries）
- `netsuite_table`: NetSuite SuiteQL 表名
- `supabase_table_name`: Supabase 表名
- `label`: 中文標籤
- `is_enabled`: 是否啟用

### field_mapping_config
儲存欄位映射配置：
- `mapping_key`: 關聯到表映射
- `netsuite_field_name`: NetSuite 欄位名
- `supabase_column_name`: Supabase 欄位名
- `transformation_rule`: 轉換規則（JSONB）
- `is_active`: 是否啟用

## 🔧 技術細節

### Metadata API
```typescript
GET /services/rest/record/v1/metadata-catalog
```
返回所有可用的 record types。

### SuiteQL 驗證
```sql
SELECT COUNT(*) as count FROM {table_name}
```
驗證表是否存在且可查詢。

### 欄位掃描
使用 Metadata API 或 SuiteQL 查詢取得欄位資訊：
- Metadata API: `/services/rest/record/v1/metadata-catalog/{recordType}`
- SuiteQL: `SELECT * FROM {table} WHERE ROWNUM <= 1`

## 🚀 未來擴展

1. **增量同步**
   - 基於 `lastmodifieddate` 欄位
   - 只同步變更的記錄

2. **自動化排程**
   - 定期掃描新表
   - 定期掃描新欄位
   - 自動觸發同步

3. **智能映射**
   - 使用 AI 建議欄位映射
   - 自動識別欄位型別和轉換規則

4. **多環境支援**
   - 支援多個 NetSuite 環境
   - 環境間配置複製

## 📚 相關文件

- `docs/field-mapping-setup-guide.md` - 欄位映射設定指南
- `docs/n8n-backup-implementation-summary.md` - N8N 備份實作摘要
- `NetSuite中臺建置完全指南.md` - 完整建置指南

