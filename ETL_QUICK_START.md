# NetSuite 風格 Visual ETL - 快速入門 🚀

> **5 分鐘學會使用 Visual ETL 工具！**

---

## 🎯 什麼是 Visual ETL？

這是一個像 **NetSuite Import Assistant** 一樣專業的資料匯入工具，讓你用拖拉的方式就能完成 CSV 到資料庫的匯入，不用寫任何 SQL！

---

## 📍 如何開啟

1. 登入系統後，點擊左側選單的 **「ETL 視覺化匯入」**（有 NEW 標籤）
2. 或直接訪問：`http://localhost:3000/dashboard/etl-import`

---

## 🎬 使用流程（4 步驟）

### 步驟 1️⃣: 上傳 CSV

1. 點擊「**選擇檔案**」
2. 選擇你的 CSV 檔案
3. 系統自動解析欄位和資料型別 ✅

**提示**：確保 CSV 第一行是欄位名稱（Header）

---

### 步驟 2️⃣: 建立映射

#### 設定目標表
- **目標表名稱**：輸入要匯入到哪個表（例如：`sales_orders`）
- **主鍵欄位**（可選）：如果表已存在，填入主鍵以啟用更新模式

#### 拖拉建立映射
有**兩種方式**建立映射：

**方式 A - 拖拉（推薦）**：
1. 從**左欄**拖曳 CSV 欄位
2. 從**右欄**拖曳目標欄位
3. 同時放到**中欄**
4. 🎉 映射建立完成！

**方式 B - 點擊**：
1. 點選左欄的 CSV 欄位
2. 點選右欄的目標欄位
3. 自動建立映射

#### 設定轉換規則（可選）
點擊中欄的**箭頭圖示（<=>）**，可以設定：

- 📋 **Direct Map**：直接複製（預設）
- 🔧 **Default Value**：設定預設值（例如：欄位為空時填「未設定」）
- 🔍 **VLOOKUP**：查表（例如：用 ID 查 Name）
- 📊 **Aggregate**：聚合函數（SUM, AVG, COUNT...）
- ⚡ **SQL Expression**：自訂表達式（例如：`CONCAT(A, B)`）

**小技巧**：
- ✅ 已映射的欄位會變灰，不會重複選取
- ❌ 點擊右側的「X」可以刪除映射
- 🔵 有轉換規則的箭頭會變藍色

點擊「**下一步：生成 SQL**」

---

### 步驟 3️⃣: 檢視 SQL

系統自動產生 SQL 語句，有兩種模式：

**模式 A - CREATE TABLE**（表不存在）：
```sql
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT,
  amount NUMERIC(18, 2),
  ...
);
```

**模式 B - UPSERT**（表已存在）：
```sql
INSERT INTO sales_orders (customer_name, amount)
VALUES ($1, $2)
ON CONFLICT (external_id) 
DO UPDATE SET customer_name = EXCLUDED.customer_name;
```

**選項**：
- 🔍 **檢視 SQL**：確認語句正確
- 💾 **下載 SQL**：儲存 SQL 檔案
- ✏️ **返回修改**：回到步驟 2 調整映射
- ▶️ **執行匯入**：開始匯入資料

點擊「**執行匯入**」

---

### 步驟 4️⃣: 完成！

系統會：
1. 轉換 CSV 資料（根據你的轉換規則）
2. 建立或更新資料表
3. 匯入所有資料

顯示「**匯入成功！已匯入 XXX 筆資料**」🎉

**接下來**：
- 再匯入一次：處理下一個 CSV
- 返回儀表板：查看匯入的資料

---

## 💡 實用範例

### 範例 1: 簡單的客戶資料匯入

**CSV 內容**：
```csv
customer_name,email,phone
公司 A,company_a@example.com,0912345678
公司 B,company_b@example.com,0923456789
```

**步驟**：
1. 上傳 CSV
2. 目標表：`customers`
3. 映射：
   - `customer_name` → `name`（Direct Map）
   - `email` → `email`（Direct Map）
   - `phone` → `phone`（Direct Map）
4. 執行 ✅

---

### 範例 2: 使用預設值

**需求**：若 `status` 欄位為空，自動填入 `"Pending"`

**步驟**：
1. 建立映射：`status` → `status`
2. 點擊箭頭（<=>）
3. 選擇「**Default Value**」
4. 輸入預設值：`Pending`
5. 儲存 ✅

---

### 範例 3: VLOOKUP 查表

**需求**：CSV 裡是 `subsidiary_id`（數字），但我要存 `subsidiary_name`（文字）

**步驟**：
1. 建立映射：`subsidiary_id` → `subsidiary_name`
2. 點擊箭頭（<=>）
3. 選擇「**VLOOKUP**」
4. 設定：
   - 查表名稱：`ns_subsidiary`
   - 查詢鍵：`id`
   - 返回欄位：`full_name`
5. 儲存 ✅

這樣系統會自動去 `ns_subsidiary` 表查詢對應的名稱！

---

### 範例 4: SQL 表達式

**需求**：組合 `first_name` 和 `last_name` 成 `full_name`

**步驟**：
1. 建立映射：`first_name` → `full_name`
2. 點擊箭頭（<=>）
3. 選擇「**SQL Expression**」
4. 輸入表達式：
   ```sql
   CONCAT(${value}, ' ', last_name)
   ```
5. 儲存 ✅

---

## ⚠️ 常見問題

### Q: 上傳失敗？
- ✅ 確認檔案是 `.csv` 格式
- ✅ 確認檔案不超過 10MB
- ✅ 確認檔案編碼是 UTF-8

### Q: 型別推斷錯誤？
- ✅ 確保 CSV 至少有 3 筆資料
- ✅ 點擊箭頭手動調整型別

### Q: UPSERT 不生效？
- ✅ 確認有設定「主鍵欄位」
- ✅ 確認目標表已經有主鍵或唯一約束

### Q: VLOOKUP 找不到資料？
- ✅ 確認查表名稱正確
- ✅ 確認查詢鍵型別一致（都是數字或都是文字）
- ✅ 先用 SuiteQL 查詢測試是否有資料

---

## 📋 CSV 檔案準備清單

✅ **必須做到**：
- [ ] 第一行是欄位名稱（Header）
- [ ] 欄位名稱用英文和底線（例如：`customer_name`）
- [ ] 日期格式統一（建議：`YYYY-MM-DD`）

✅ **建議做到**：
- [ ] Boolean 用 `T`/`F` 或 `true`/`false`
- [ ] 數字不要有逗號或貨幣符號（`1000` 不是 `$1,000`）
- [ ] 沒有空白的 Header

---

## 🎓 進階技巧

### 技巧 1: 快速映射
如果欄位名稱一模一樣，可以：
1. 按住 `Ctrl`（Mac: `Cmd`）
2. 依序點選左欄和右欄的欄位
3. 自動批次建立映射

### 技巧 2: 範本儲存（未來功能）
未來版本會支援儲存映射範本，下次匯入相同格式的 CSV 可直接套用！

### 技巧 3: 檢視統計資訊
左欄、中欄、右欄底部都有統計資訊：
- 左欄：總欄位、已映射欄位
- 中欄：總映射數、有轉換規則的映射數
- 右欄：可用表、總欄位數

---

## 📚 相關文件

- 📖 [完整使用指南](./docs/ETL_VISUAL_MAPPER_GUIDE.md) - 超詳細的功能說明
- 📘 [NetSuite中臺建置完全指南](./NetSuite中臺建置完全指南.md) - 專案整體架構（第 13 章）
- 📝 [原始需求文件](./NS_CSV_ETL工具克隆版.md) - 開發規格

---

## 🆘 需要幫助？

- 💬 聯絡開發團隊
- 📧 提交 Issue
- 📖 查看完整文件

---

**祝你匯入順利！** 🎉

如果這個工具幫到你，別忘了給開發團隊一個讚！👍

