# REST API 測試結果與發現

## 測試結果

### 1. Record Type 存在性檢查

通過 `/api/check-record-types` 確認：

✅ **accountingperiod** - 存在於 metadata catalog  
✅ **bom** - 存在於 metadata catalog  
❌ **workcenter** - 不存在於 metadata catalog

### 2. API 查詢測試結果

#### Accounting Period
- **錯誤**: `Record 'accountingperiod' was not found`
- **原因**: NetSuite REST API 的列表查詢（GET `/services/rest/record/v1/accountingperiod`）似乎不支援直接查詢所有記錄
- **可能原因**: 需要特定的權限或需要使用不同的查詢方式

#### BOM
- **錯誤**: `Record 'bom' was not found`
- **原因**: 與 Accounting Period 相同，列表查詢不支援

#### Work Center
- **錯誤**: `Record type 'workcenter' does not exist`
- **原因**: 此 record type 不存在於當前環境
- **可能原因**: 
  - 環境未啟用製造功能
  - Record type 名稱不同（可能需要查看 metadata catalog 中的其他名稱）

## 問題分析

根據 NetSuite REST API 的行為，某些 record types 可能：

1. **不支援列表查詢**：只能通過已知的 ID 查詢單一記錄
2. **需要特殊權限**：某些 record types 需要特定的角色權限
3. **需要使用 SuiteQL**：雖然對照表說 SuiteQL 找不到，但可能表名不同
4. **需要使用不同的 API 端點**：可能需要使用特定的端點

## 建議的解決方案

### 方案 1: 使用已知 ID 查詢

如果知道某些記錄的 ID，可以逐一查詢：

```typescript
// 例如：已知 Accounting Period ID 為 1
const period = await netsuite.getRecord('accountingperiod', '1');
```

### 方案 2: 使用 SuiteQL（但表名可能不同）

根據 NetSuite 文檔，某些資料可能在其他表中：

- Accounting Period 可能在 `accountingbook` 或其他相關表中
- BOM 可能在 `assemblyitem` 的相關資料中
- Work Center 可能需要啟用製造功能模組

### 方案 3: 使用 NetSuite Saved Search

可以建立 Saved Search，然後通過 API 查詢 Saved Search 的結果。

### 方案 4: 檢查 NetSuite 設定

1. 確認角色權限是否包含這些 record types 的讀取權限
2. 確認是否啟用了相關的功能模組（如製造功能）
3. 確認環境類型（Production vs Sandbox）

## 下一步行動

1. **檢查 NetSuite 環境設定**
   - 確認角色權限
   - 確認功能模組是否啟用

2. **嘗試使用 SuiteQL 查詢相關表**
   - 查詢 `accountingbook` 表
   - 查詢 `assemblyitem` 表（查看 BOM 相關資料）
   - 查詢是否有 `manufacturing` 相關的表

3. **查看 NetSuite REST API 文檔**
   - 確認這些 record types 的正確查詢方式
   - 查看是否需要特殊的查詢參數

4. **建立 Saved Search**
   - 在 NetSuite UI 中建立 Saved Search
   - 通過 API 查詢 Saved Search 結果

## 測試腳本

已建立以下測試腳本：

- `/api/test-rest-api-sync` - 測試 REST API 連線和資料結構
- `/api/check-record-types` - 檢查可用的 record types
- `/api/test-single-record` - 測試單一記錄查詢（需要提供 recordId）

## 結論

目前的實作已準備好，但需要：
1. 確認 NetSuite 環境設定
2. 找到正確的查詢方式或替代方案
3. 根據實際的資料結構調整欄位映射

一旦找到正確的查詢方式，同步 API 就可以正常運作了。

