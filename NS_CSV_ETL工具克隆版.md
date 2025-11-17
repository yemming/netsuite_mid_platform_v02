# Project Spec: NetSuite-Style Visual ETL & SQL Generator

## 1. 角色設定 (Role Definition)
你是一位精通前端互動設計與後端資料處理的**資深全端工程師 (Senior Full-Stack Developer)**。你的專長是開發 Low-Code/No-Code 工具，特別擅長復刻企業級軟體（Enterprise Software）的使用者介面與複雜的資料流邏輯。

## 2. 專案目標 (Project Objective)
我們要開發一個 **Web 版的視覺化 ETL 映射工具 (Visual ETL Mapper)**。
這個工具的核心目的是簡化資料匯入流程，透過一個高度仿真的介面，讓使用者直覺地完成「資料來源」與「資料目的地」的對應，並自動產生後端的 SQL 語法來建立或更新資料庫。

**關鍵要求 (Critical Requirement)**：
前端介面必須**嚴格復刻 Oracle NetSuite "Import Assistant" 的 Field Mapping 步驟**（參考 NetSuite 的 UI 風格、配色、佈局）。

---

## 3. 核心工作流 (Core Workflow)
系統分為兩個階段：
1.  **Phase 1 - 映射 (Mapping)**：使用者上傳 CSV，透過拖拉介面 (Drag & Drop) 將 CSV 欄位映射到系統欄位。
2.  **Phase 2 - 執行 (Execution)**：
    * 系統解析映射設定 (Mapping JSON)。
    * **檢查目標 Table 是否存在**：
        * 若**不存在**：根據映射結果自動產生 `CREATE TABLE` SQL 語句並執行 `INSERT`。
        * 若**已存在**：根據 Primary Key 產生 `UPSERT` (Insert/Update) 邏輯，或 `ALTER TABLE` 新增欄位。

---

## 4. 前端開發規範 (Frontend Specifications)

### 4.1. 視覺風格 (Visual Style - The "NetSuite Look")
* **佈局**：嚴格的三欄式設計。
    * **左欄 (Source)**：標題 "Your Fields" (顯示 CSV 欄位)。
    * **右欄 (Destination)**：標題 "Target Fields" (顯示資料庫 Schema 樹狀圖)。
    * **中欄 (Mapping Canvas)**：標題 "Field Mapping" (顯示已建立的連結)。
* **配色 (Color Palette)**：
    * **Header 背景**：NetSuite 深藍色 (`#2D4466` 或類似)。
    * **Sub-header/表格頭**：淡藍色漸層 (`#E0E6F0` 到 `#F0F2F5`)。
    * **文字顏色**：深灰 (`#333333`)，字體需使用 Arial/Helvetica，字級偏小 (12px-13px) 以展現高密度資訊。
    * **背景色**：白色或極淺灰。

### 4.2. 互動邏輯 (Interaction Logic)
1.  **拖放行為 (Drag & Drop)**：
    * 使用者從「左欄」拖曳欄位到「中欄」。
    * 使用者從「右欄」拖曳欄位到「中欄」。
    * 當兩邊都拉入同一行時，形成一條映射規則。
2.  **狀態鎖定 (Status Lock)**：
    * **重要**：當左欄的某個 CSV 欄位被拖入中欄並完成映射後，左欄原本的該項目必須**變成灰色 (Grayed out) 且不可再次選取**。這能防止使用者重複映射同一來源欄位。
3.  **刪除映射**：
    * 中欄的每一行右側需有一個小的「X」或垃圾桶圖示，點擊後刪除該行映射，並將左欄對應的欄位恢復為可選狀態。

### 4.3. 核心功能：智慧箭頭 (The Magic Arrow)
在中欄的映射表格中，來源欄位與目標欄位中間必須顯示一個 **雙向箭頭圖示 (<=>)**。
* **觸發**：此箭頭不僅是裝飾，是一個**可點擊的按鈕 (Clickable)**。
* **行為**：點擊箭頭後，開啟一個 **Modal (資料轉換設定視窗)**。
* **Modal 功能選項**：
    * `Direct Map` (預設)：直接複製值。
    * `Default Value`：若來源為空，填入固定值。
    * `VLOOKUP / JOIN`：允許使用者選擇另一個 Table 進行關聯查表 (e.g., Join table B on ID return Name)。
    * `Aggregate`：提供 SUM, COUNT, AVG 等聚合函數。
    * `SQL Expression`：允許輸入簡單的 SQL 邏輯 (如 `CONCAT(A, B)`).
* **UI 回饋**：若該映射設定了特殊邏輯（非預設），箭頭顏色應變更（例如變為藍色）或顯示一個小的設定 icon，提示使用者此處有轉換邏輯。

---

## 5. 後端開發規範 (Backend Specifications)

### 5.1. API 邏輯
* 接收前端傳來的 JSON 物件，結構範例：
    ```json
    {
      "targetTableName": "sales_orders",
      "mappings": [
        { "source": "csv_col_1", "target": "db_col_A", "transform": "direct" },
        { "source": "csv_col_2", "target": "db_col_B", "transform": "vlookup", "lookupConfig": {...} }
      ]
    }
    ```

### 5.2. SQL 生成器 (SQL Generator Engine)
請實作一個 Service 或 Class 專門處理以下邏輯：
1.  **Schema Check**：查詢資料庫 Schema，檢查 `targetTableName` 是否存在。
2.  **Scenario A: Table 不存在 (Create Mode)**
    * 遍歷 `mappings`。
    * 根據 CSV 範例資料自動推斷資料類型 (String -> VARCHAR, Number -> DECIMAL/INT, Date -> TIMESTAMP)。
    * 生成 `CREATE TABLE table_name (...)`。
    * 生成 `INSERT INTO ...` 語句。
3.  **Scenario B: Table 已存在 (Update/Upsert Mode)**
    * 檢查 `mappings` 中是否有定義 Primary Key (或 Unique Key)。
    * 比對現有 Schema，若 Mapping 中有新欄位，生成 `ALTER TABLE ... ADD COLUMN ...`。
    * 使用 `INSERT ... ON CONFLICT UPDATE` (PostgreSQL) 或 `DUPLICATE KEY UPDATE` (MySQL) 邏輯進行資料同步。

---

## 6. 技術棧建議 (Tech Stack Recommendation)
* **Frontend**: React, TypeScript, Tailwind CSS (用於快速刻畫 NetSuite 風格), Zustand (狀態管理), dnd-kit (拖拉套件)。
* **Backend**: Node.js (Express/NestJS) 或 Python (FastAPI)。
* **Database**: PostgreSQL 或 MySQL (生成 SQL 用)。

## 7. 你的任務 (Deliverables)
請根據以上規格，輸出以下內容：
1.  **專案結構**：檔案目錄結構。
2.  **前端核心代碼**：
    * 包含 NetSuite 風格的 CSS/Tailwind Config。
    * `MappingTable` Component (包含拖拉邏輯與狀態鎖定)。
    * `ArrowModal` Component (智慧箭頭的邏輯)。
3.  **後端邏輯代碼**：
    * 負責接收 Mapping JSON 並轉換為 SQL (Create/Upsert) 的核心函數。

請開始編寫代碼，確保 UI 細節還原度高，且邏輯嚴謹。