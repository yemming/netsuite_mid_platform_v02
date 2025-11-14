# 軟體需求文件 (SRD): FSM-Clone (現場服務管理系統克隆版)

## 1. 專案概述

**專案目標:** 使用 Next.js (App Router) 作為前端框架，打造一個 NetSuite 現場服務管理 (FSM) 系統的克隆版。此系統旨在管理從「案件生成」到「現場服務」再到「帳務結算」的完整閉環。

**技術棧 (前端):**
* **框架:** Next.js (App Router)
* **語言:** TypeScript
* **UI:** Tailwind CSS (或 shadcn/ui)
* **狀態管理:** Zustand / React Context (視複雜度而定)
* **資料獲取:** SWR / React Query

**系統架構:** 本文件專注於前端需求。前端將透過 RESTful 或 GraphQL API 與後端服務器進行通信。

---

## 2. 使用者角色 (User Personas)

1.  **調度員 (Dispatcher):** (桌面端使用者)
    * **職責:** 監控所有工單、即時追蹤技術人員位置、分配與重新排程任務、確保 SLA。
    * **主要介面:** 調度儀表板 (Gantt 圖、地圖)。

2.  **現場技術人員 (Field Technician):** (行動端使用者)
    * **職責:** 接收工單、導航至客戶地點、更新工單狀態、回報工時與用料、獲取客戶簽名。
    * **主要介面:** 行動 Web App (PWA)。

3.  **後勤/管理員 (Admin / Back-office):** (桌面端使用者)
    * **職責:** 管理客戶資料、服務合約、庫存、審核已完工單並產生發票。
    * **主要介面:** 後台管理介面。

---

## 3. 核心資料模型 (Core Data Models)

(前端需要理解的資料結構)

* **`User`**: { `id`, `name`, `email`, `role` ('dispatcher', 'technician', 'admin'), `skills` (Array), `status` ('online', 'offline') }
* **`Customer`**: { `id`, `name`, `address`, `contactInfo` }
* **`Asset`**: { `id`, `name`, `serialNumber`, `customerId`, `installDate` }
* **`Case`**: { `id`, `title`, `description`, `customerId`, `assetId`, `status` ('open', 'closed') }
* **`WorkOrder`**: { `id`, `caseId`, `status` ('pending', 'scheduled', 'dispatched', 'in_progress', 'completed', 'billed'), `technicianId`, `scheduledStartTime`, `scheduledEndTime`, `actualStartTime`, `actualEndTime` }
* **`ServiceReport`**: { `id`, `workOrderId`, `summaryNotes`, `partsUsed` (Array), `hoursLogged`, `customerSignature` (Image URL) }
* **`InventoryItem`**: { `id`, `partNumber`, `name`, `description` }
* **`TechnicianStock`**: { `id`, `technicianId`, `itemId`, `quantity` } (技術人員車上的庫存)

---

## 4. 功能需求 (Functional Requirements)

### 模組 1: 排程與調度 (Dispatcher Portal)

**頁面: `/dashboard/dispatch`**

#### Feature 1.1: 綜合調度儀表板 (Gantt + Map View)

* **使用者故事:** "作為一個調度員，我希望在一個畫面上看到所有技術人員的時間表 (Gantt 圖) 和他們目前的即時位置 (地圖)，以便我能最有效率地分配緊急工單。"
* **UI 組件:**
    * **`Layout`:** 畫面應分為左右 (或上下) 兩部分：Gantt 圖和地圖。
    * **`GanttChart` (甘特圖):**
        * **Rows:** `Technician` 列表 (顯示 `User.name`, `User.avatar`)。
        * **Columns:** 時間軸 (例如：每 30 分鐘一格)。
        * **Items:** `WorkOrderCard` (可拖動的卡片)，顯示 `WorkOrder.id`, `Customer.name`, `status` (用顏色區分)。
        * **功能:** 支援水平滾動、縮放 (日/週視圖)、拖放 (Drag-and-Drop) 來指派或調整工單。
    * **`MapView` (地圖):**
        * 使用 `react-map-gl` (Mapbox) 或 `google-maps-react`。
        * **`TechnicianMarker`:** 顯示所有 `status` 為 'online' 的 `Technician` 即時位置 (需 WebSocket 支援)。
        * **`WorkOrderMarker`:** 顯示「未指派」工單的 `Customer.address` 位置。
        * **功能:** 點擊 Marker 顯示詳細資訊 (InfoPopup)。

#### Feature 1.2: 工單池 (Unassigned Pool)

* **使用者故事:** "作為一個調度員，我需要一個清晰的列表來顯示所有『待排程』的工單，並能根據優先級或 SLA 進行排序。"
* **UI 組件:**
    * **`WorkOrderTable`:**
        * 顯示所有 `WorkOrder.status` == 'pending' 的工單。
        * **Columns:** ID, 客戶, 概要, 優先級, SLA 到期時間。
        * **功能:** 可排序、可過濾。支援「拖曳」到 Gantt 圖上進行指派。

#### Feature 1.3: 智慧排程建議

* **使用者故事:** "當我選擇一個『待排程』工單時，我希望系統能彈出一個視窗，建議我 3 個最適合的技術人員 (基於技能、當前位置、空檔)。"
* **UI 組件:**
    * **`SuggestionModal`:**
        * 在點擊工單池中的「建議」按鈕時觸發。
        * 顯示建議的 `Technician` 列表 (含理由：e.g., "最近", "有空", "技能相符")。
        * 提供「一鍵指派」按鈕。

---

### 模組 2: 行動現場服務 (Technician PWA)

**頁面: `/mobile` (專為移動端優化)**

#### Feature 2.1: 我的任務 (My Tasks)

* **使用者故事:** "作為一個技術人員，我打開 App/PWA 時，需要立刻看到今天所有分配給我的工單列表，並按時間排序。"
* **UI 組件:**
    * **`TaskListScreen` (登入後首頁):**
        * **`DateTabs`:** (昨天, 今天, 明天)。
        * **`TaskList`:** 垂直滾動的列表。
        * **`TaskCard`:** 顯示 `scheduledStartTime`, `Customer.name`, `Customer.address`, `WorkOrder.status`。
        * **功能:** 點擊卡片進入 `WorkOrderDetailScreen`。

#### Feature 2.2: 工單詳情與執行

* **使用者故事:** "當我點擊一個任務時，我需要看到所有詳細資訊，包括客戶聯繫方式、地址、問題描述、資產歷史，並能一鍵開始導航。"
* **UI 組件:**
    * **`WorkOrderDetailScreen`:**
        * **`Header`:** 顯示工單 ID 和狀態。
        * **`StatusUpdateButton`:** 核心按鈕組 (e.g., "出發", "抵達", "開始工作", "完工")。
        * **`CustomerInfo`:** 顯示 `Customer.name`, `Customer.contactInfo` (可點擊撥打)。
        * **`Address`:** 顯示 `Customer.address`，並有「開始導航」按鈕 (調用 Google/Apple Maps)。
        * **`AssetHistory`:** 顯示相關 `Asset` 的過往維修記錄 (Accordion)。

#### Feature 2.3: 服務報告與客戶簽核

* **使用者故事:** "當我完成工作後，我需要填寫我做了什麼、用了哪些零件、花了多少工時，並讓客戶在我的手機/平板上簽名確認。"
* *UI 組件:*
    * **`ServiceReportForm` (在 `WorkOrderDetailScreen` 點擊 "完工" 後出現):**
        * **`HoursLoggedInput`:** 數字輸入框。
        * **`PartsUsedInput`:** 一個動態表單 (Dynamic Formset)，允許技術人員搜索 `InventoryItem` (從他車上的庫存 `TechnicianStock`) 並填寫用量。
        * **`SummaryNotes`:** `textarea` 供填寫工作總結。
        * **`SignaturePad`:**
            * 使用 `react-signature-canvas` 或類似組件。
            * 允許客戶在上面簽名。
            * 提供「清除」和「儲存」按鈕 (儲存為 Base64 或圖片 URL)。
        * **`SubmitButton`:** 提交報告，並將 `WorkOrder.status` 更新為 'completed'。

---

### 模組 3: 後勤管理 (Admin Portal)

**頁面: `/admin` (桌面端佈局)**

#### Feature 3.1: 案件管理 (Case Management)

* **使用者故事:** "作為管理員，我需要一個地方查看所有客服建立的 `Case`，並能手動將一個 `Case` 轉換為 `WorkOrder`。"
* **UI 組件:**
    * **`CaseTable`:**
        * 標準 CRUD 表格 (e.g., 使用 `shadcn/ui Data Table` 或 `ag-grid`)。
        * **Columns:** ID, 客戶, 狀態, 描述。
        * **Actions:** 編輯, 刪除, **"轉為工單"**。
    * **`CaseToWorkOrderModal`:**
        * 點擊「轉為工單」時觸發。
        * 自動帶入 `Case` 資訊，允許管理員補充額外資訊 (如優先級)，然後創建 `WorkOrder` (使其進入 `Feature 1.2` 的工單池)。

#### Feature 3.2: 庫存管理

* **使用者故事:** "作為管理員，我需要能追蹤中央倉庫和每個技術人員車上的庫存 (`TechnicianStock`)，並能執行庫存轉移。"
* **UI 組件:**
    * **`InventoryDashboard`:**
        * 顯示總庫存和各倉庫 (含車輛) 庫存的表格。
    * **`InventoryTransferForm`:**
        * 允許從「中央倉」轉移 `InventoryItem` 到 `TechnicianStock`。

---

## 5. 非功能性需求 (NFRs)

1.  **離線支援 (Offline Mode):**
    * **需求:** `Technician PWA` 必須支援離線工作。技術人員在沒有訊號的地下室也應能查看工單詳情、填寫服務報告。
    * **實現:** 使用 Service Workers 和 `IndexedDB` (或 `localStorage`) 緩存 `WorkOrder` 數據。資料在恢復連線時自動同步回後端。

2.  **即時更新 (Real-time Updates):**
    * **需求:** `Dispatcher Portal` 上的 `MapView` 和 `GanttChart` 必須即時反應技術人員的位置和工單狀態。
    * **實現:** 前端需能處理來自後端的 `WebSockets` 或 `Server-Sent Events (SSE)` 推送。

3.  **響應式設計 (Responsive Design):**
    * `Dispatcher Portal` 和 `Admin Portal` 專為桌面端優化 (min-width: 1280px)。
    * `Technician PWA` 專為行動端優化 (max-width: 768px)。