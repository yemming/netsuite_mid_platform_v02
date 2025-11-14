/**
 * CRM 系統資料型別定義
 * 根據 AI 業務 Agent 協同系統文檔定義
 */

// Lead (來自客戶表單)
export interface Lead {
  lead_id: string;
  customer_name: string;
  customer_email: string;
  company_name: string;
  requirements_text: string;
  submitted_at: string;
}

// CompanyResearch (由 Agent 1 產生)
export interface CompanyResearch {
  lead_id: string;
  core_business: string;
  products_services: string;
  value_proposition: string;
  ideal_customer_profile: string;
  raw_search_data?: Record<string, unknown>;
}

// EmailDraft Version
export interface EmailDraftVersion {
  version: number;
  subject: string;
  body: string;
  created_at: string;
  revision_feedback?: string;
}

// EmailDraft (系統的核心物件)
export interface EmailDraft {
  draft_id: string;
  lead_id: string;
  status: 'pending_review' | 'approved' | 'modifying';
  current_version: number;
  versions: EmailDraftVersion[];
  // 關聯資料（用於顯示）
  lead?: Lead;
  company_research?: CompanyResearch;
}

// 表單提交資料
export interface LeadFormData {
  customer_name: string;
  customer_email: string;
  company_name: string;
  requirements_text: string;
}

// 修訂回饋
export interface RevisionFeedback {
  feedback: string;
}

