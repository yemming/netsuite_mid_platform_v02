# Manufacturing Routing API 查詢問題說明

## 現況

根據測試結果，發現一個有趣的狀況：

### ✅ 成功項目
- ✅ `manufacturingrouting` 在 metadata catalog 中存在
- ✅ metadata schema 可以取得
- ✅ NetSuite UI 中可以看到此記錄類型

### ❌ 失敗項目
- ❌ SuiteQL 查詢失敗：`Record 'manufacturingrouting' was not found`
- ❌ REST API List 查詢失敗：`Record 'manufacturingrouting' was not found`
- ❌ REST API Search 查詢失敗：`Method Not Allowed`

## 可能的原因

### 1. 系統中沒有資料
**最可能的原因**：如果系統中沒有建立任何 Manufacturing Routing 記錄，NetSuite 可能會返回 `Record was not found` 錯誤。

**解決方法**：
1. 在 NetSuite UI 中建立至少一個 Manufacturing Routing：
   - 路徑：`Lists > Manufacturing Routing > New`
   - 填寫必要欄位（Name、BOM 等）
   - 保存

2. 建立完成後，再次執行測試 API：
   ```bash
   curl -X POST http://localhost:3000/api/test-manufacturing-routing-suiteql \
     -H "Content-Type: application/json"
   ```

### 2. 透過 BOM 關聯查詢
根據 metadata schema，`ManufacturingRouting` 有一個 `billOfMaterials` 欄位，這表示 BOM 可以關聯到 Routing。

**可能的解決方法**：
- 如果 BOM 記錄中有關聯的 Routing ID，可以：
  1. 先查詢 BOM 記錄
  2. 從 BOM 記錄中取得 `routing` 或相關欄位
  3. 使用該 ID 透過 `getRecord('manufacturingrouting', routingId)` 查詢單一記錄

### 3. 需要特定權限
可能需要額外的權限才能查詢 Manufacturing Routing。

**檢查方法**：
- 在 NetSuite UI 中檢查角色權限
- 確認是否有 "Lists > Manufacturing Routing" 的查看權限

### 4. 只能透過 SuiteScript
雖然 UI 顯示支援 "REST Query API"，但實際上可能需要透過 SuiteScript 來存取。

## 建議的測試步驟

### 步驟 1: 建立測試資料
在 NetSuite UI 中建立一個測試 Manufacturing Routing：

1. **建立 BOM**（如果還沒有）：
   - `Lists > Bills of Materials > New`
   - 填寫必要欄位並保存

2. **建立 Manufacturing Routing**：
   - 路徑：`Lists > Manufacturing Routing > New`
   - **Name**: 例如 `TEST-ROUTING-001`
   - **Bill of Materials**: 選擇剛才建立的 BOM
   - **Routing Steps**: 添加至少一個步驟
   - 保存

### 步驟 2: 再次測試 API
建立完成後，執行：
```bash
curl -X POST http://localhost:3000/api/test-manufacturing-routing-suiteql \
  -H "Content-Type: application/json"
```

### 步驟 3: 如果還是失敗，嘗試透過 BOM 查詢
如果直接查詢還是失敗，嘗試透過 BOM 關聯查詢：

```typescript
// 1. 先查詢 BOM
const bomList = await netsuite.getRecordList('bom', { fetchAll: true });

// 2. 對每個 BOM，取得詳細資訊
for (const bom of bomList.items) {
  const bomDetail = await netsuite.getRecord('bom', bom.id);
  
  // 3. 檢查是否有 routing 相關欄位
  if (bomDetail.routing || bomDetail.manufacturingRouting) {
    const routingId = bomDetail.routing?.id || bomDetail.manufacturingRouting?.id;
    
    // 4. 使用該 ID 查詢 Routing
    if (routingId) {
      const routingDetail = await netsuite.getRecord('manufacturingrouting', routingId);
      console.log('找到 Routing:', routingDetail);
    }
  }
}
```

## 下一步

請先嘗試在 NetSuite UI 中建立一個測試 Manufacturing Routing，然後告訴我結果，我們再繼續測試。

