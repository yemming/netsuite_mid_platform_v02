# 專案：克隆版 o9 需求規劃平台 - 系統需求規格書 (SRS)

**文件版本：** 1.1 (已包含視覺規格)
**日期：** 2025-11-14
**專案目標：** 打造一個基於 NextJS, Supabase, n8n 的 Web 應用，精確克隆 o9 平台在參考影片和截圖中展示的核心需求規劃功能，包括探索性數據分析、預測準確性分析及共識預測協作。

**目標 AI：** 此文件旨在提供足夠的細節，供開發者或 AI 程式設計助手（如 Gemini, Claude, GPT-4o）直接用於生成代碼和系統架構。

---

## 1. 系統總覽

### 1.1 核心模組
本系統分為三大核心模組：
1.  **M1: 探索性數據分析 (EDA)** - 識別歷史數據的異常並歸因。
2.  **M2: 預測分析駕駛艙 (Analysis Cockpit)** - 評估和修正統計預測的合理性。
3.  **M3: 需求假設與預測層 (Demand Assumptions)** - 結構化地管理和疊加業務調整。

### 1.2 技術棧 (Tech Stack)
* **前端 (Frontend):** Next.js (App Router)
* **後端 & 數據庫 (Backend & DB):** Supabase (PostgreSQL, Auth, Realtime, Functions)
* **自動化/運算 (Automation/Compute):** n8n (用於後台批次處理、EDA 運算、預測模型運行)

---

## 2. 模組一 (M1): 探索性數據分析 (EDA)

### 2.1 模組目標
自動評估歷史需求數據，找出異常的波峰和波谷，並將其與已知（如假期、促銷）或未知事件連結，幫助分析師理解需求驅動因素。

### 2.2 功能需求 (Functional Requirements)

* **FR-1.1 (自動分析):** 系統必須能夠透過 n8n 工作流定時（如每日凌晨）觸發 EDA 分析腳本。
* **FR-1.2 (異常標記):** EDA 腳本必須能識別並標記至少四種異常類型：`POTENTIAL_STOCKOUT` (潛在缺貨), `HOLIDAY_IMPACT` (假期影響), `PROMO_IMPACT` (促銷影響), `UNKNOWN_SPIKE` (未知波峰), `UNKNOWN_DIP` (未知波谷)。
* **FR-1.3 (總覽儀表板):** NextJS 必須提供一個「EDA 總覽儀表板」畫面 (S1.1)，以表格形式展示所有被分析的「交叉點」(Intersections，例如 產品+地點)。
* **FR-1.4 (表格功能):** S1.1 的表格必須支援對所有欄位（特別是異常標記 Flag）的「客戶端過濾」(Filtering) 和「排序」(Sorting)。
* **FR-1.5 (數據下鑽):** S1.1 表格的每一行必須有一個「下鑽」操作（如點擊鍊條圖標或行本身），導航至該交叉點的「詳細視圖」 (S1.2)。
* **FR-1.6 (詳細視圖-圖表):** S1.2 必須包含一個交互式時間序列折線圖 (S1.2.1)，顯示該交叉點的「實際歷史數據」(Actuals)。
* **FR-1.7 (圖表交互):** S1.2.1 圖表必須能在對應的時間點上，高亮顯示 FR-1.2 中標記的異常時段。
* **FR-1.8 (事件歸因):** S1.2 必須提供一個機制（如按鈕觸發彈窗 S1.3），允許用戶將一個「未知波峰」手動關聯到一個已知的「事件」或「假期」。

### 2.3 User Stories
* **As a** 需求規劃師, **I want to** 查看一個儀表板，快速過濾出所有被系統標記為「潛在缺貨」的產品-地點組合, **so that I can** 優先處理高風險項目。
* **As a** 需求規劃師, **I want to** 點擊一個項目並下鑽到它的歷史數據圖表, **so that I can** 視覺化地確認系統標記的異常時段。
* **As a** 需求規劃師, **I want to** 在詳細視圖中，將一個標記為「未知」的銷售波峰手動歸因為「聖誕節促銷」, **so that I can** 修正數據並提高未來預測的準確性。

### 2.4 建議數據模型 (Supabase Schema)

* **table: `historical_actuals`**
    * `id` (uuid, pk)
    * `intersection_id` (uuid, fk to `intersections`)
    * `date` (date)
    * `quantity` (numeric)
* **table: `intersections`** (e.g., "Product A @ Store B")
    * `id` (uuid, pk)
    * `name` (text)
    * `product_sku` (text)
    * `location_code` (text)
* **table: `eda_analysis_results`**
    * `id` (uuid, pk)
    * `intersection_id` (uuid, fk to `intersections`)
    * `start_date` (date)
    * `end_date` (date)
    * `flag_type` (enum: `POTENTIAL_STOCKOUT`, `HOLIDAY_IMPACT`, `UNKNOWN_SPIKE`, ...)
    * `status` (enum: `SYSTEM_DETECTED`, `USER_VERIFIED`, `USER_REJECTED`)
    * `notes` (text)
    * `linked_event_id` (uuid, fk to `events`, nullable)
* **table: `events`** (e.g., 假期, 促銷)
    * `id` (uuid, pk)
    * `name` (text)
    * `start_date` (date)
    * `end_date` (date)

### 2.5 自動化流程 (n8n Workflow)
* **Workflow: `Run_Daily_EDA_Analysis`**
    1.  **Trigger:** Cron (每日 01:00)。
    2.  **Node (Supabase):** 讀取 `historical_actuals` 和 `intersections`。
    3.  **Node (Code/Python):** 執行 EDA 腳本。
        * `loop` 遍歷每個 `intersection`。
        * `logic` 分析 `historical_actuals` 數據，找出異常點 (FR-1.2)。
    4.  **Node (Supabase):** 將結果 `UPSERT` 到 `eda_analysis_results` 表中。

---

## 3. 模組二 (M2): 預測分析駕駛艙

### 3.1 模組目標
自動評估系統生成的「統計預測」的合理性，主動向規劃師突顯「違規」或「次優」的預測結果，以便及時修正。

### 3.2 功能需求 (Functional Requirements)

* **FR-2.1 (預測生成):** 系統必須能透過 n8n 工作流運行多種統計預測模型（如 ARIMA, Prophet），並生成基礎預測值。
* **FR-2.2 (違規檢測):** n8n 工作流在生成預測後，必須立即運行一個「違規檢測」腳本。
* **FR-2.3 (違規類型):** 檢測腳本必須能標記至少五種違規：`TREND_VIOLATION` (趨勢違規), `LEVEL_VIOLATION` (水平違規), `RANGE_VIOLATION` (範圍違規), `SEASONALITY_VIOLATION` (季節性違規), `STRAIGHT_LINE_VIOLATION` (直線違規)。
* **FR-2.4 (告警儀表板):** NextJS 必須提供一個「違規告警儀表板」 (S2.1)，以可過濾、可排序的表格顯示所有偵測到的違規。
* **FR-2.5 (違規詳情):** S2.1 必須支援下鑽到「違規詳情視圖」 (S2.2)。
* **FR-2.6 (詳情圖表):** S2.2 必須包含一個圖表組件，**疊加**顯示「歷史數據」(藍線) 和「系統預測」(紅線)，並在圖表上明確視覺化違規之處（例如，繪製兩條相反的趨D勢線）。
* **FR-2.7 (算法洞察):** 系統必須提供一個「算法洞察駕駛艙」 (S2.3)，分析並顯示哪個算法（模型）產生的違規次數最多，或最少被選為最佳模型。
* **FR-2.8 (算法管理):** 系統必須提供一個「算法設定頁面」 (S2.4)，允許管理員「停用」或「啟用」特定算法，或調整其參數。

### 2.3 User Stories
* **As a** 規劃師, **I want to** 查看一個儀表板，過濾出所有「趨勢違規」（歷史向上、預測向下）的項目, **so that I can** 快速定位並修正最不合理的預測。
* **As a** 規劃師, **I want to** 看到「算法洞察」, **so that I can** 識別出哪個預測模型在我的數據集上表現最差，並考慮停用它。

### 2.4 建議數據模型 (Supabase Schema)

* **table: `forecast_runs`** (一次預測運行的主檔)
    * `id` (uuid, pk)
    * `run_at` (timestamp)
    * `status` (enum: `RUNNING`, `COMPLETED`, `FAILED`)
* **table: `forecast_results`**
    * `id` (uuid, pk)
    * `run_id` (uuid, fk to `forecast_runs`)
    * `intersection_id` (uuid, fk to `intersections`)
    * `date` (date)
    * `predicted_quantity` (numeric)
    * `best_model_used` (text)
* **table: `forecast_violations`**
    * `id` (uuid, pk)
    * `run_id` (uuid, fk to `forecast_runs`)
    * `intersection_id` (uuid, fk to `intersections`)
    * `violation_type` (enum: `TREND_VIOLATION`, `LEVEL_VIOLATION`, ...)
    * `details` (jsonb)
* **table: `model_settings`**
    * `id` (uuid, pk)
    * `model_name` (text, unique)
    * `is_active` (boolean, default: true)
    * `parameters` (jsonb)

### 2.5 自動化流程 (n8n Workflow)
* **Workflow: `Run_Statistical_Forecast_and_Check`**
    1.  **Trigger:** Webhook (由 Supabase Function 或用戶在 NextJS 點擊觸發)。
    2.  **Node (Supabase):** 讀取 `model_settings` (僅 `is_active=true` 的模型) 和 `historical_actuals`。
    3.  **Node (Supabase):** 創建一筆新的 `forecast_runs` 紀錄，狀態為 `RUNNING`。
    4.  **Node (Code/Python):** 運行預測模型 (FR-2.1)，將結果寫入 `forecast_results`。
    5.  **Node (Code/Python):** 運行違規檢測 (FR-2.2, FR-2.3)，將結果寫入 `forecast_violations`。
    6.  **Node (Supabase):** 更新 `forecast_runs` 狀態為 `COMPLETED`。

---

## 4. 模組三 (M3): 需求假設與預測層

### 4.1 模組目標
為「共識預測」提供一個結構化框架。讓業務、行銷等不同團隊能以「假設」的形式提交他們的預測調整，並以「圖層」的方式清晰地疊加在基礎預測之上。

### 4.2 功能需求 (Functional Requirements)

* **FR-3.1 (假設創建):** 系統必須允許用戶（基於 Supabase Auth 角色）創建「需求假設」 (S3.1)。
* **FR-3.2 (假設元數據):** 每個假設必須包含「主檔頭」信息：名稱、創建者、狀態 (`DRAFT`, `SUBMITTED`, `REJECTED`, `CANCELLED`)。
* **FR-3.3 (假設明細):** 每個假設必須包含一個「明細輸入網格」，允許用戶輸入調整：`intersection_id`, `start_date`, `end_date`, `adjustment_quantity` (e.g., +500 或 -100)。
* **FR-3.4 (層級分配):** (進階) 系統應支援在「匯總層級」（如 國家/品類）創建假設，並自動按比例分配到下層的 `intersection`。
* **FR-3.5 (審批工作流):** 系統必須支持基於角色的審批流。
    * **Role (Sales/Marketing):** 只能創建 `DRAFT` 假設，必須由 `Planner` 提交。
    * **Role (Planner):** 可以創建並直接 `SUBMIT` 自己的假設。
* **FR-3.6 (假設操作):** S3.1 必須提供 "Submit", "Copy", "Reject", "Cancel" 按鈕來管理假設的生命週期 (FR-3.2 的狀態)。
* **FR-3.7 (預測圖層):** 系統必須將所有「已提交」(SUBMITTED) 的假設，根據其來源（如角色或類型）組織成獨立的「圖層」。
* **FR-3.8 (共識可視化):** 系統必須提供一個「預測圖層儀表板」 (S3.2)，使用「堆疊面積圖」或「瀑布圖」來可視化。
* **FR-3.9 (圖層疊加):** S3.2 的圖表必須以 `forecast_results` (統計預測) 為基底，然後依次疊加上
    各個「調整圖層」(來自 `demand_assumptions`)，最頂層的線代表「共識預測」。

### 2.3 User Stories
* **As a** 行銷經理, **I want to** 創建一個「新品上市」的假設，在未來三個月為 A 產品增加 10,000 單位預測, **so that I can** 將此市場信息傳達給規劃團隊。
* **As a** 規劃師, **I want to** 審核行銷經理提交的假設，並點擊「提交」, **so that** 該假設能被納入官方的共識預測中。
* **As a** 規劃總監, **I want to** 查看一個堆疊圖表, **so that I can** 清楚地看到最終的「共識預測」是由多少「統計預測」和多少「業務調整」組成的。

### 2.4 建議數據模型 (Supabase Schema)

* **table: `demand_assumptions`** (主檔頭)
    * `id` (uuid, pk)
    * `name` (text)
    * `created_by` (uuid, fk to `auth.users`)
    * `status` (enum: `DRAFT`, `SUBMITTED`, `REJECTTED`, `CANCELLED`)
    * `assumption_layer_type` (text, e.g., "Marketing", "Sales", "Planner_Adj")
* **table: `assumption_details`** (明細)
    * `id` (uuid, pk)
    * `assumption_id` (uuid, fk to `demand_assumptions`)
    * `intersection_id` (uuid, fk to `intersections`)
    * `date` (date)
    * `adjustment_quantity` (numeric)
* **(View): `consensus_forecast_view`** (用於驅動 S3.2 圖表的 SQL 視圖)
    * `date`
    * `intersection_id`
    * `statistical_forecast` (from `forecast_results`)
    * `marketing_adjustment` (sum from `assumption_details` where type='Marketing')
    * `sales_adjustment` (sum from `assumption_details` where type='Sales')
    * `consensus_forecast` (sum of all layers)

### 2.5 自動化流程 (n8n Workflow)
* **Workflow: `Notify_on_New_Assumption_Draft`**
    1.  **Trigger:** Supabase (監聽 `demand_assumptions` 表的 `INSERT` 且 `status='DRAFT'`)。
    2.  **Node (Supabase):** 獲取創建者和相關規劃師的 Email。
    3.  **Node (Email/Slack):** 發送通知：「有新的需求假設需要您審核」。

---

## 5. UI/UX 視覺規格 (已填寫)

本章節基於用戶提供的截圖 (`CleanShot ... .jpg`) 進行詳細的視覺分析。

### 5.1 總體風格
* **整體外觀：** 專業、數據密集型的儀表板風格。
* **主題：** **暗黑模式 (Dark Mode)**。背景為非常深的灰色（近黑色，`#1F1F1F` 或 `#121212` 左右）。
* **主色調：**
    * **文字：** 淺灰色 (e.g., `#E0E0E0`)。
    * **可交互元素/高亮：** 亮藍色 (e.g., `#3B82F6` 或 o9 品牌藍)，用於 Tab 標籤、可點擊的連結（如 S1.1 的 "Alcohol"）、選中的表格行（如 S2.3 和 S3.1）。
* **強調色 (圖表)：**
    * **歷史/實際：** 桃紅色/粉紅色 (e.g., `#EC4899`)。在另一視圖中為亮橘色 (e.g., `#F97316`)。
    * **預測：** 紅色虛線 或 白色虛線。
    * **瀑布圖：** 多種顏色，包括藍色、綠色、粉色、橘色、黃色、紫色等。
* **字體：** 看起來是無襯線字體 (Sans-serif)，如 `Inter`, `Roboto`, 或 `Helvetica Neue`。
* **圖標庫：** 使用簡潔的線條圖標 (Line Icons)，如 Material Icons 或類似風格。

### 5.2 畫面 S1.1: EDA 總覽儀表板
* **參考圖片：** `...16.32.12@2x.jpg`
* **佈局：** 上下分欄。上半部為 S1.2 圖表，下半部為 S1.1 總覽表格。
* **表格樣式 (Summary Table)：**
    * 標準 Data Grid，深色背景，淺色文字。
    * 表頭 (Header) 背景色比表格行略亮。
    * **異常標記 (Flags) 樣式：**
        * `Total Spikes`: 數值欄位。
        * `Holiday Spikes / Promo Spikes`: **進度條 (Progress Bar) 樣式**。`100%` 顯示為綠色 (`#22C55E`) 填滿的條。`0%` 顯示為灰色空條。
* **下鑽圖標 (F1.5) 樣式：** 截圖中未明確顯示「鍊條」圖標，但表格第一列的 "Actions" 下方有 `...` (更多操作) 圖標，且第一列 "Segment Item" (`Alcohol`) 顯示為藍色連結，暗示點擊此處可下鑽。

### 5.3 畫面 S1.2: 交叉點詳細視圖
* **參考圖片：** `...16.32.12@2x.jpg`
* **佈局：** 位於 S1.1 表格的上半部。
* **S1.2.1 圖表樣式 ("Review Actuals")：**
    * **折線圖顏色：** `Actual` (實際數據) 顯示為**粉紅色實線** (`#EC4899` 左右)。
    * **異常高亮樣式：**
        * `Spikes` (波峰): 橘色垂直實線 (`#F97316`)。
        * `Dips` (波谷): 綠色垂直實線 (`#22C55E`)。
        * `Potential Stockout Period`: **灰色垂直條狀區域** (`#4B5563`)。
        * 圖表頂部有圖例 (Legend) 標示：「Spikes Flag」「Holiday Flag」等。

### 5.4 畫面 S2.3: 算法洞察駕駛艙 (S2.1 在此)
* **參考圖片：** `...16.31.39@2x.jpg` (此畫面即 S2.3，同時也作為 S2.1 告警儀表板的基礎)
* **佈局：** 全螢幕的 Data Grid。
* **表格樣式 ("Algo Insights")：**
    * `Stat Algorithm` 欄位：部分演算法名稱（如 "BestFit Algorithm", "Growth AFA"）顯示為**紅色文字** (`#EF4444`)，可能表示表現不佳或有告警。
    * `Run Count`: 數值欄位。
    * `BestFit Percent`: 百分比欄位。
    * `Violation` 相關欄位：均為百分比。
    * **高亮：** 選中的行 (Row) 具有**亮藍色背景**。

### 5.5 畫面 S2.2: 違規詳情視圖
* **參考圖片 (主要)：** `...16.31.18@2x.jpg`
* **參考圖片 (概念)：** `...16.30.53@2x.jpg`
* **佈局：** 上半部為圖表，下半部為 Data Grid (Beeftit Summary / Forecast Alerts)。
* **圖表樣式 (關鍵)：**
    * **歷史數據線條：** `Actual` (實際) 為**粉紅色實線**。在概念圖中為**橘色垂直柱狀圖**。
    * **系統預測線條：** `System Fcst` (系統預測) 為**紅色虛線**。在概念圖中為**白色虛線**。
    * **違規視覺化 (Trend Violation)：** 系統繪製一條**白色實線** (`#FFFFFF`) 作為歷史數據的「趨勢線」，顯示整體向上。而 `System Fcst` (紅色虛線) 明顯向下，形成強烈對比，這就是「趨勢違規」的視覺化。
* **表格樣式 (Forecast Alerts)：**
    * `Alerts` 欄位：使用**紅色三角形驚嘆號圖標** (`▲!`) 來標記告警。

### 5.6 畫面 S3.1: 需求假設主視圖
* **參考圖片：** `...16.32.35@2x.jpg`
* **佈局：** 上下分欄。上半部為「Summary」(主檔頭)，下半部為「Details」(明細輸入網格)。
* **主檔頭 (Header) 樣式 (Summary Table)：**
    * Data Grid 顯示假設主檔。
    * `Status` 欄位：顯示假設狀態，如 "Submitted To Forecast", "In Forecast"。
    * **高亮：** 選中的行 (DA-4) 具有**亮藍色背景**。
* **明細網格 (Grid) 樣式 (Details Table)：**
    * 一個可編輯的表格。
    * **時間欄位：** 按時間分桶 (e.g., `M09-23`, `M10-23`)。
    * **時間欄位表頭：** 具有**黃色/金色背景** (`#FCD34D` 左右的顏色)，與一般表頭的灰色背景做區分。

### 5.7 畫面 S3.2: 預測圖層儀表板
* **參考圖片：** `...16.32.45@2x.jpg`
* **佈局：** 上下分欄。上半部為圖表，下半部為「Breakdown」(明細網格)。
* **圖表類型 (關鍵)：** **瀑布圖 (Waterfall Chart)**。Tab 標籤 "Waterfall" 為選中狀態。
* **圖層顏色 (瀑布圖)：**
    * `Stat Fcst` (統計預測 - 基礎): **亮藍色**。
    * `Stat Fcst Final`: **綠色**。
    * `Adjustment 1`: **粉紅色**。
    * `Adjustment 2`: **橘色**。
    * `Adjustment 3`: **青色/藍綠色**。
    * `Adjustment 4`: **黃色**。
    * `Adjustment 5`: **紫色**。
    * `Consensus Fcst` (共識預測 - 最終): **深藍色/靛藍色**。
* **明細網格 (Breakdown Table)：**
    * **行：** 顯示瀑布圖的各個圖層名稱 (`Stat Fcst`, `Marketing Fcst`, `Fcst Adjustment 1`...)。
    * **時間欄位表頭：** 同樣具有**黃色/金色背景** (`#FCD34D` 左右的顏色)。
    * **數值顯示：** 負數調整使用**括號** `()` 表示，例如 `(291)`。