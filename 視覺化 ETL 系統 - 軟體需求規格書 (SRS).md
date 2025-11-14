# 視覺化 ETL 系統 - 軟體需求規格書 (SRS)

## 1.0 簡介

### 1.1 專案目的

本專案旨在開發一個基於 Web 的視覺化數據整合 (ETL) 平台。此平台將克隆 Informatica PowerCenter 的核心設計理念（如影片所示），允許用戶通過圖形化介面 (GUI) 定義數據源 (Sources)、數據目標 (Targets)，並設計數據轉換映射 (Mappings) 和可執行的工作流 (Workflows)。

### 1.2 系統範圍

本系統將專注於實現以下核心模組：

1.  **倉庫管理 (Repository)**：用於組織專案資料夾和資產。
2.  **設計師 (Designer)**：用於視覺化建立數據映射 (Mapping)。
3.  **工作流管理器 (Workflow Manager)**：用於編排和配置 Mappings 為可執行的 Sessions/Workflows。
4.  **工作流監視器 (Workflow Monitor)**：用於追蹤工作流的執行狀態和日誌。

### 1.3 技術棧

* **前端 (Frontend)**：Next.js (App Router)
* **視覺化畫布 (Canvas)**：React Flow (或類似的 JS 庫)
* **後端 API (Backend API)**：Next.js (Route Handlers)
* **資料庫 & 元數據倉庫 (Database & Repository)**：Supabase (PostgreSQL)
* **用戶認證 (Auth)**：Supabase Auth
* **ETL 執行引擎 (Execution Engine)**：n8n (通過 API 進行無頭 (headless) 調用)

---

## 2.0 系統架構

本系統採用三層分離架構：

1.  **Next.js (應用層)**：
    * 負責所有 UI 渲染，包括管理儀表板、React Flow 畫布、屬性面板和監視器。
    * 其後端 (Route Handlers) 作為中介，處理來自前端的請求。
    * **職責**：
        * 從 Supabase 讀取/寫入元數據（Mappings, Workflows 的 JSON 定義）。
        * 在用戶觸發「執行」時，將儲存的 Mapping/Workflow JSON **翻譯**成 n8n 可執行的 JSON 格式。
        * 通過 API 異步調用 n8n 服務來執行 ETL 任務。
        * 接收來自 n8n 的 Webhook 回調以更新任務狀態。

2.  **Supabase (數據層)**：
    * 作為系統的「倉庫 (Repository)」。
    * **職責**：
        * 儲存所有元數據，包括 `users`, `projects`, `folders`, `db_connections`。
        * 儲存 `mappings` 和 `workflows` 的 JSON 定義（React Flow 狀態）。
        * 儲存 `execution_logs`（執行日誌）和 `execution_statistics`（源/目標行數統計）。

3.  **n8n (執行層)**：
    * 作為後台的「整合服務 (Integration Service)」。
    * **職責**：
        * 不儲存任何 Mapping/Workflow 定義。
        * 僅通過 API 接收一個完整的 workflow JSON 並立即執行它。
        * 在執行開始、成功或失敗時，通過 Webhook 將狀態和統計數據回傳給 Next.js 後端。

### 2.1 核心執行流程

1.  **設計時 (Design-Time)**：用戶在 Next.js UI 上拖放節點。點擊「保存」時，Next.js 將 React Flow 的畫布狀態 (JSON) 儲存到 Supabase 的 `mappings` 表中。
2.  **執行時 (Run-Time)**：
    a.  用戶在 Next.js UI 中點擊「開始執行 Workflow」。
    b.  Next.js 後端 API 啟動。
    c.  API 從 Supabase 讀取 `workflow.definition_json` 和 `mapping.definition_json`。
    d.  **翻譯服務 (Translation Service)**：一個關鍵模組，將這兩個 JSON 轉換為一個 n8n workflow JSON。此步驟會將 `Joiner` 轉換為 n8n 的 `Merge` 節點，`Aggregator` 轉換為 `Summarize` 節點，並注入在 Workflow Manager 中配置的實際文件路徑和資料庫連接訊息。
    e.  Next.js 後端調用 n8n 的 `/api/v1/workflows/execute` 端點，並傳送翻譯後的 JSON。
    f.  Next.js 後端在 Supabase 的 `execution_logs` 表中創建一條 "running" 狀態的記錄。
    g.  n8n 執行任務，並在完成時（成功/失敗）調用 Next.js 提供的 Webhook URL。
    h.  Webhook 更新 `execution_logs` 表中的記錄為 "success" 或 "failed"，並寫入統計數據。
    i.  Workflow Monitor 介面（輪詢 Supabase）自動顯示更新後的狀態。

---

## 3.0 功能需求 (Functional Requirements)

### 3.1 模組一：倉庫管理器 (Repository / Project)

* `[ ]` **FR-3.1.1**：用戶登入後，應在側邊欄看到一個樹狀結構的「倉庫導航器」。
* `[ ]` **FR-3.1.2**：用戶可以創建、重命名和刪除「資料夾 (Folders)」來組織資產。
* `[ ]` **FR-3.1.3**：每個資料夾應自動分類顯示其包含的 `Sources`, `Targets`, `Mappings`, `Workflows`。

### 3.2 模組二：設計師 - 數據源 (Source Analyzer)

* `[ ]` **FR-3.2.1**：用戶可以「從資料庫導入」數據源。
    * `[ ]` **FR-3.2.1.1**：提供一個表單，讓用戶輸入資料庫連接訊息（主機、用戶、密碼、資料庫、類型）。此訊息應加密儲存在 `db_connections` 表中。
    * `[ ]S` **FR-3.2.1.2**：連接成功後，用戶可以選擇一個 Table，系統將讀取其 Schema (欄位名, 數據類型) 並存入 `data_sources.schema_json`。
* `[ ]` **FR-3.2.2**：用戶可以「從文件導入」數據源 (Flat File)。
    * `[ ]` **FR-3.2.2.1**：提供上傳 CSV/JSON 檔案的功能。
    * `[ ]` **FR-3.2.2.2**：系統應自動解析文件標頭以生成 Schema，並允許用戶手動調整（例如，指定分隔符、標頭行）。

### 3.3 模組三：設計師 - 數據目標 (Target Designer)

* `[ ]` **FR-3.3.1**：用戶可以手動定義一個新的「數據目標」。
* `[ ]` **FR-3.3.2**：用戶應能定義目標的欄位名稱和數據類型。
* `[ ]` **FR-3.3.3**：用戶應能指定目標類型（例如：新資料庫表、現有表、CSV 文件）。

### 3.4 模組四：設計師 - 映射 (Mapping Designer)

* `[ ]` **FR-3.4.1**：用戶可以創建一個新的「Mapping」，這將打開一個基於 React Flow 的視覺化畫布。
* `[ ]` **FR-3.4.2**：用戶應能從倉庫導航器中拖放 `Sources` 和 `Targets` 到畫布上。
* `[ ]` **FR-3.4.3**：系統必須提供一個「轉換 (Transformations)」組件面板。
* `[ ]` **FR-3.4.4**：**Source Qualifier (源限定符)**：
    * `[ ]` **FR-3.4.4.1**：當 `Source` 被拖入畫布時，必須自動附加一個 `Source Qualifier` 節點。
* `[ ]` **FR-3.4.5**：**Joiner (連接器)**：
    * `[ ]` **FR-3.4.5.1**：用戶可以拖入一個 `Joiner` 節點。
    * `[ ]` **FR-3.4.5.2**：用戶必須能將兩個或多個上游節點的輸出連接到 `Joiner`。
    * `[ ]` **FR-3.4.5.3**：雙擊 `Joiner` 節點應彈出屬性視窗。
    * `[ ]` **FR-3.4.5.4**：屬性視窗必須允許用戶定義 `Join Type` (Inner, Left, Right, Full) 和 `Join Condition`（例如 `src1.product_id = src2.product_id`）。
* `[ ]` **FR-3.4.6**：**Aggregator (聚合器)**：
    * `[ ]` **FR-3.4.6.1**：用戶可以拖入一個 `Aggregator` 節點。
    * `[ ]` **FR-3.4.6.2**：屬性視窗必須允許用戶勾選 `Group By` 欄位。
    * `[ ]` **FR-3.4.6.3**：屬性視窗必須允許用戶創建新的輸出欄位，並使用聚合函數（SUM, COUNT, AVG, MAX, MIN）。
* `[ ]` **FR-3.4.7**：**連接 (Linking)**：用戶必須能夠通過拖拽，將一個節點的輸出埠（欄位）連接到下一個節點的輸入埠（欄位）。
* `[ ]` **FR-3.4.8**：**保存 (Save)**：
    * `[ ]` **FR-3.4.8.1**：用戶保存 Mapping 時 (Ctrl+S 或點擊按鈕)，系統必須將 React Flow 的畫布狀態（節點、邊、位置、屬性配置）序列化為 JSON，並儲存到 `mappings.definition_json`。
    * `[ ]` **FR-3.4.8.2**：保存時應觸發驗證，底部輸出面板應顯示 "Mapping is valid" 或錯誤列表。

### 3.5 模組五：工作流管理器 (Workflow Manager)

* `[ ]` **FR-3.5.1**：用戶可以創建一個新的「Workflow」，這將打開一個新的 React Flow 畫布。
* `[ ]` **FR-3.5.2**：畫布應自動包含一個 `Start` 節點。
* `[ ]` **FR-3.5.3**：用戶應能從面板拖入一個 `Session` 節點。
* `[ ]` **FR-3.5.4**：創建 `Session` 節點時，系統必須提示用戶關聯一個已存在的 `Mapping`。
* `[ ]` **FR-3.5.5**：用戶必須能將 `Start` 節點連接到 `Session` 節點，以定義執行順序。
* `[ ]` **FR-3.5.6**：**Session 屬性配置 (關鍵)**：
    * `[ ]` **FR-3.5.6.1**：用戶雙擊 `Session` 節點必須打開一個配置彈窗。
    * `[ ]` **FR-3.5.6.2**：此彈窗必須顯示該 `Session` 關聯的 `Mapping` 中的所有 `Sources` 和 `Targets`。
    * `[ ]` **FR-3.5.6.3**：對於 **資料庫源/目標**，用戶必須能從 `db_connections` 列表中選擇一個已定義的「連接」。
    * `[ ]` **FR-3.5.6.4**：對於 **文件源**，用戶必須能指定 `Source File Path`（n8n 服務器可訪問的路徑或 URL）。
    * `[ ]` **FR-3.5.6.5**：對於 **文件目標**，用戶必須能指定 `Target File Path` 和 `Filename`，並能勾選「包含標頭 (Output field names)」。
* `[ ]` **FR-3.5.7**：**執行 (Execution)**：用戶應能右鍵點擊 Workflow 畫布並選擇 "Start Workflow"。

### 3.6 模組六：工作流監視器 (Workflow Monitor)

* `[ ]` **FR-3.6.1**：用戶應能打開「監視器」頁面，該頁面從 `execution_logs` 表中讀取數據。
* `[ ]` **FR-3.6.2**：頁面應顯示所有已執行或正在執行的任務列表，包含 `Workflow Name`, `Status` (Running, Succeeded, Failed), `Start Time`, `End Time`, `Duration`。
* `[ ]` **FR-3.6.3**：點擊一個已完成的任務，用戶應能查看「運行時統計 (Source/Target Statistics)」。
* `[ ]` **FR-3.6.4**：統計數據必須顯示每個 `Source` 讀取的總行數和每個 `Target` 寫入的總行數（例如：`SQ_customer: 10000 rows`, `TGT_final: 9945 rows`）。

---

## 4.0 數據模型 (Supabase Schema)

以下是在 Supabase 中所需的最小數據表定義。

### `folders`
用於組織資產的樹狀結構。
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | 資料夾唯一 ID |
| `created_at` | `timestamp` | Not Null | 創建時間 |
| `name` | `text` | Not Null | 資料夾名稱 |
| `parent_folder_id` | `uuid` | Foreign Key (folders.id) | 父資料夾 ID (null 為根目錄) |
| `user_id` | `uuid` | Foreign Key (auth.users.id) | 所屬用戶 |

### `db_connections`
儲存加密的資料庫連接訊息。
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | 連接 ID |
| `name` | `text` | Not Null | 連接名稱 |
| `type` | `text` | Not Null | 類型 (e.g., 'postgres', 'mysql') |
| `connection_string_encrypted` | `text` | Not Null | 加密後的連接字串 |
| `user_id` | `uuid` | Foreign Key (auth.users.id) | 所屬用戶 |

### `data_sources`
定義數據源的元數據。
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | 數據源 ID |
| `name` | `text` | Not Null | 數據源名稱 (e.g., 'src_customer') |
| `type` | `text` | Not Null | 'db' 或 'csv' |
| `schema_json` | `jsonb` | Not Null | 描述欄位和類型的 JSON |
| `folder_id` | `uuid` | Foreign Key (folders.id) | 所屬資料夾 |

### `data_targets`
定義數據目標的元數據。
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | 數據目標 ID |
| `name` | `text` | Not Null | 數據目標名稱 (e.g., 'tgt_final') |
| `type` | `text` | Not Null | 'db' 或 'csv' |
| `schema_json` | `jsonb` | Not Null | 描述欄位和類型的 JSON |
| `folder_id` | `uuid` | Foreign Key (folders.id) | 所屬資料夾 |

### `mappings`
儲存 Mapping Designer 的視覺化定義。
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Mapping ID |
| `name` | `text` | Not Null | Mapping 名稱 (e.g., 'm_live') |
| `definition_json` | `jsonb` | | 儲存 React Flow 節點和邊的 JSON |
| `is_valid` | `boolean` | Default: false | 最後一次保存時是否驗證通過 |
| `folder_id` | `uuid` | Foreign Key (folders.id) | 所屬資料夾 |

### `workflows`
儲存 Workflow Manager 的視覺化定義和 Session 配置。
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Workflow ID |
| `name` | `text` | Not Null | Workflow 名稱 (e.g., 'wf_m_live') |
| `definition_json` | `jsonb` | | 儲存 React Flow 和 Session 配置的 JSON |
| `folder_id` | `uuid` | Foreign Key (folders.id) | 所屬資料夾 |

### `execution_logs`
記錄所有 Workflow 的執行歷史和結果。
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | 執行日誌 ID |
| `workflow_id` | `uuid` | Foreign Key (workflows.id) | 執行的 Workflow |
| `status` | `text` | Not Null | 'running', 'succeeded', 'failed' |
| `start_time` | `timestamp` | Not Null | 開始時間 |
| `end_time` | `timestamp` | | 結束時間 |
| `run_by_user_id` | `uuid` | Foreign Key (auth.users.id) | 觸發者 |
| `statistics_json` | `jsonb` | | 儲存源/目標行數統計 |
| `error_message` | `text` | | 如果 'failed'，儲存錯誤訊息 |

---