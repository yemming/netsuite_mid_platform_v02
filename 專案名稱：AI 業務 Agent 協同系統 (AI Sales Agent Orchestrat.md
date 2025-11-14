# 專案名稱：AI 業務 Agent 協同系統 (AI Sales Agent Orchestration System)

## 1. 系統概述 (System Overview)

本專案旨在打造一個「人機協作」的自動化業務回覆系統。系統的目標是，在收到潛在客戶的表單詢問後，自動化執行客戶背景研究、草擬高度客製化的回覆郵件，並提交給內部業務人員進行「人工審核」。業務人員可以一鍵批准發送，或提出修改意見讓 AI 迭代修正，直到滿意為止。

## 2. 系統架構與角色 (Architecture & Actors)

### 2.1 高層架構 (High-Level Architecture)

* **前端 (Frontend):** Next.js 應用
    * `src/app/public/lead-form`: 供潛在客戶填寫的公開表單頁面。
    * `src/app/admin/dashboard`: 供內部人員審核的儀表板。
* **後端工作流 (Backend Workflow):** n8n (或 Next.js API Routes + LangGraph.js)
    * 負責編排(Orchestrate)所有 AI Agent、工具使用和業務邏輯。
* **外部服務 (External Services):**
    * **Google Search API** (例如 SerpApi): 用於公司背景研究。
    * **向量資料庫 (Vector DB)**: 儲存公司過去的「成功案例 (Project Database)」。
    * **郵件服務 (Email Service)**: (例如 Gmail/Resend) 用於發送審核信與客戶信。
    * **資料庫 (Database)**: (例如 Supabase/Google Sheets) 用於日誌記錄和儲存草稿。
    * **會議排程 (Scheduling)**: (例如 Kcal/Calendly) 用於生成會議連結。

### 2.2 系統角色 (Actors)

1.  **`Potential_Customer` (潛在客戶):** 填寫表單的外部使用者。
2.  **`Sales_Operator` (內部業務):** 負責最終審核和批准郵件的「Human-in-the-Loop」。
3.  **`AI_Agent_System` (本系統):** 負責執行所有自動化流程的後端。

## 3. 資料模型 (Data Models)

```json
// 1. Lead (來自客戶表單)
{
  "lead_id": "uuid",
  "customer_name": "string",
  "customer_email": "string",
  "company_name": "string",
  "requirements_text": "string",
  "submitted_at": "timestamp"
}

// 2. CompanyResearch (由 Agent 1 產生)
{
  "lead_id": "uuid",
  "core_business": "string",
  "products_services": "string",
  "value_proposition": "string",
  "ideal_customer_profile": "string",
  "raw_search_data": "json"
}

// 3. EmailDraft (系統的核心物件)
{
  "draft_id": "uuid",
  "lead_id": "uuid",
  "status": "pending_review | approved | modifying",
  "current_version": "integer",
  "versions": [
    {
      "version": 1,
      "subject": "string",
      "body": "string",
      "created_at": "timestamp"
    },
    {
      "version": 2,
      "subject": "string",
      "body": "string",
      "created_at": "timestamp",
      "revision_feedback": "string (來自 Sales_Operator 的指令)"
    }
  ]
}
````

## 4\. 功能需求 (Functional Requirements) - User Stories

### Epic 1: 潛在客戶導入與背景研究

  * **User Story 1.1 (Customer):**
      * **As a** `Potential_Customer`,
      * **I want to** access a web form (`/public/lead-form`),
      * **So that** I can submit my name, email, company, and project requirements.
  * **User Story 1.2 (System):**
      * **As the** `AI_Agent_System`,
      * **When** a new lead form is submitted,
      * **I must** save the data as a `Lead` object in the database and trigger the "Lead Processing Workflow".
  * **User Story 1.3 (System - AI Agent 1):**
      * **As the** `AI_Agent_System` (Agent 1: Researcher),
      * **I must** receive the `company_name` as input.
      * **I must** use the **Google Search Tool (SerpApi)** to find information about that company.
      * **I must** analyze the search results and generate a `CompanyResearch` JSON object containing: "核心業務", "產品服務", "價值主張", "理想客戶輪廓".
      * **I must** pass this JSON object to the next step.

### Epic 2: AI 草稿撰寫

  * **User Story 2.1 (System - AI Agent 2):**
      * **As the** `AI_Agent_System` (Agent 2: Sales Expert),
      * **I must** receive the `Lead` object and the `CompanyResearch` object as input.
      * **I must** use the **Vector DB (Project Database) Tool** to search for relevant past success stories.
      * **I must** generate a highly personalized `EmailDraft` (subject, body) that:
        1.  回應客戶的 `requirements_text`。
        2.  巧妙地引用 `CompanyResearch` 中的洞察。
        3.  引用相關的「成功案例」來建立信任。
        4.  包含一個 `Kcal/Calendly` 會議連結。
      * **I must** save this as `EmailDraft` (version 1) with status `pending_review`.

### Epic 3: 人工審核介面 (Next.js Dashboard)

  * **User Story 3.1 (Sales Operator):**
      * **As a** `Sales_Operator`,
      * **I want to** see a dashboard (`/admin/dashboard`) displaying a list of all `EmailDraft`s with status `pending_review`.
  * **User Story 3.2 (Sales Operator):**
      * **As a** `Sales_Operator`,
      * **I want to** click on a pending draft to view its details.
      * **The detail view must** show:
        1.  `Lead` information (Who is this customer?).
        2.  `CompanyResearch` (What did Agent 1 find?).
        3.  The AI-generated `EmailDraft` (Subject and Body) in an editable text area.
  * **User Story 3.3 (Sales Operator - Approve):**
      * **As a** `Sales_Operator`,
      * **I want** an "Approve & Send" button.
      * **When clicked,** the system should trigger the "Final Execution" workflow.
  * **User Story 3.4 (Sales Operator - Revise):**
      * **As a** `Sales_Operator`,
      * **I want** a "Request Revision" button.
      * **When clicked,** it should show a text box where I can type my feedback (e.g., "信件太長了，精簡一點", "加上我們在嘉義警局的實際數字").
      * **When I submit feedback,** the system should trigger the "Revision Workflow".

### Epic 4: AI 迭代修正工作流 (The Loop)

  * **User Story 4.1 (System - Classifier):**
      * **As the** `AI_Agent_System`,
      * **When** I receive a request from the HITL dashboard,
      * **I must** first classify the intent as either `APPROVE` or `MODIFY`.
  * **User Story 4.2 (System - AI Agent 3):**
      * **As the** `AI_Agent_System` (Agent 3: Reviser),
      * **If** the intent is `MODIFY`,
      * **I must** receive the `revision_feedback` (e.g., "精簡一點") and the `EmailDraft` (version 1) as input.
      * **I must** rewrite the draft based on the feedback.
      * **I must** save this as a *new version* (version 2) in the `EmailDraft` object and set the status *back* to `pending_review`.
  * **User Story 4.3 (Sales Operator):**
      * **As a** `Sales_Operator`,
      * **I want to** see the revised draft (version 2) appear on my dashboard for a *second* review,
      * **So that** I can approve it or request further revisions (creating version 3, etc.).

### Epic 5: 最終執行與結案

  * **User Story 5.1 (System):**
      * **As the** `AI_Agent_System`,
      * **If** the intent is `APPROVE`,
      * **I must** take the *latest approved version* of the `EmailDraft`.
      * **I must** use the **Email Service** to send this email to the `Potential_Customer` (customer\_email).
  * **User Story 5.2 (System):**
      * **As the** `AI_Agent_System`,
      * **After** the email is sent,
      * **I must** update the `EmailDraft` status to `approved` and log the final sent content to the database for archiving.

## 5\. 核心工作流程圖 (Process Flow - Mermaid)

這是在 n8n 或 LangGraph 中需要實現的核心邏輯。

```mermaid
graph TD
    subgraph "Phase 1: Capture & Research"
        A[Start: New Lead Form] --> B{Save Lead to DB};
        B --> C[Agent 1: Researcher];
        C -- Company Name --> D[Tool: Google Search];
        D --> C;
        C -- Research JSON --> E;
    end

    subgraph "Phase 2: Draft Generation"
        E[Agent 2: Sales Expert] -- Lead + Research --> F[Tool: Vector DB (Cases)];
        F --> E;
        E -- Draft v1 --> G{Save Draft v1 (Status: pending_review)};
    end

    subgraph "Phase 3 & 4: Human-in-the-Loop (HITL)"
        G --> H[Show on Next.js Dashboard];
        H --> I{Sales Operator Review};
        I -- "Approve" --> L[Intent: APPROVE];
        I -- "Request Revision" --> J[Agent 3: Reviser];
        J -- Feedback + Draft v1 --> K{Save Draft v2 (Status: pending_review)};
        K --> H;
    end

    subgraph "Phase 5: Execution"
        L --> M[Send Email to Customer];
        M --> N[Log Final Email (Status: approved)];
        N --> O[End];
    end
```

-----

```
```