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

// ==================== B2B 業務管理系統型別定義 ====================

// BANT 評估（IBM 打單方法論）
export interface BANTAssessment {
  budget: {
    score: number; // 0-5 分
    amount?: number; // 預算金額
    confirmed: boolean; // 是否確認有預算
    notes?: string; // 備註
  };
  authority: {
    score: number; // 0-5 分
    decisionMaker: string; // 決策者姓名
    role?: string; // 職位
    confirmed: boolean; // 是否確認有決策權
    notes?: string;
  };
  need: {
    score: number; // 0-5 分
    painPoints: string[]; // 痛點
    requirements: string; // 需求描述
    urgency: 'low' | 'medium' | 'high' | 'critical'; // 緊急程度
    notes?: string;
  };
  timeline: {
    score: number; // 0-5 分
    expectedCloseDate?: string; // 預期成交日期
    projectStartDate?: string; // 專案開始日期
    confirmed: boolean; // 是否確認時間表
    notes?: string;
  };
  overallScore: number; // 總分 (0-20)
  assessmentDate: string; // 評估日期
  assessedBy?: string; // 評估人
}

// 客戶（Account）
export interface Account {
  id: string;
  name: string; // 公司名稱
  industry?: string; // 產業
  website?: string; // 網站
  phone?: string; // 電話
  email?: string; // 郵箱
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  annualRevenue?: number; // 年營收
  employeeCount?: number; // 員工人數
  description?: string; // 描述
  ownerId?: string; // 負責人 ID
  ownerName?: string; // 負責人姓名
  createdAt: string;
  updatedAt: string;
  tags?: string[]; // 標籤
}

// 聯絡人（Contact）
export interface Contact {
  id: string;
  accountId: string; // 所屬客戶 ID
  accountName?: string; // 所屬客戶名稱（關聯顯示用）
  firstName: string;
  lastName: string;
  fullName: string; // 完整姓名
  title?: string; // 職稱
  email?: string;
  phone?: string;
  mobile?: string;
  department?: string; // 部門
  isPrimary: boolean; // 是否主要聯絡人
  isDecisionMaker: boolean; // 是否決策者
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 商機階段（Salesforce 方法論）
export type OpportunityStage = 
  | 'prospecting' // 潛在客戶
  | 'qualification' // 資格確認
  | 'needs-analysis' // 需求分析
  | 'value-proposition' // 價值主張
  | 'id-decision-makers' // 識別決策者
  | 'perception-analysis' // 感知分析
  | 'proposal-price-quote' // 提案/報價
  | 'negotiation-review' // 談判/審查
  | 'closed-won' // 成交
  | 'closed-lost'; // 失單

// 商機（Opportunity）
export interface Opportunity {
  id: string;
  name: string; // 商機名稱
  accountId: string; // 客戶 ID
  accountName?: string; // 客戶名稱（關聯顯示用）
  contactId?: string; // 主要聯絡人 ID
  contactName?: string; // 主要聯絡人姓名
  stage: OpportunityStage; // 階段
  amount: number; // 金額
  probability: number; // 成交機率 (%)
  expectedCloseDate?: string; // 預期成交日期
  actualCloseDate?: string; // 實際成交日期
  type?: 'new-business' | 'existing-business' | 'renewal'; // 商機類型
  leadSource?: string; // 線索來源
  description?: string; // 描述
  bant?: BANTAssessment; // BANT 評估
  ownerId?: string; // 負責人 ID
  ownerName?: string; // 負責人姓名
  nextStep?: string; // 下一步行動
  competitor?: string; // 競爭對手
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

// 報價單（Quote）
export interface Quote {
  id: string;
  quoteNumber: string; // 報價單號
  opportunityId: string; // 關聯商機 ID
  opportunityName?: string; // 商機名稱（關聯顯示用）
  accountId: string; // 客戶 ID
  accountName?: string; // 客戶名稱
  contactId?: string; // 聯絡人 ID
  contactName?: string; // 聯絡人姓名
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'; // 狀態
  validUntil?: string; // 有效期限
  subtotal: number; // 小計
  tax: number; // 稅額
  total: number; // 總計
  currency: string; // 幣別
  terms?: string; // 付款條件
  notes?: string; // 備註
  items: QuoteItem[]; // 報價項目
  ownerId?: string; // 負責人 ID
  ownerName?: string; // 負責人姓名
  createdAt: string;
  updatedAt: string;
}

// 報價單項目
export interface QuoteItem {
  id: string;
  productName: string; // 產品名稱
  description?: string; // 描述
  quantity: number; // 數量
  unitPrice: number; // 單價
  discount?: number; // 折扣 (%)
  total: number; // 小計
}

// 訂單（Order）
export interface Order {
  id: string;
  orderNumber: string; // 訂單編號
  quoteId?: string; // 關聯報價單 ID
  quoteNumber?: string; // 報價單號（關聯顯示用）
  opportunityId?: string; // 關聯商機 ID
  opportunityName?: string; // 商機名稱
  accountId: string; // 客戶 ID
  accountName?: string; // 客戶名稱
  contactId?: string; // 聯絡人 ID
  contactName?: string; // 聯絡人姓名
  status: 'draft' | 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled'; // 狀態
  orderDate: string; // 訂單日期
  expectedDeliveryDate?: string; // 預期交貨日期
  actualDeliveryDate?: string; // 實際交貨日期
  subtotal: number; // 小計
  tax: number; // 稅額
  total: number; // 總計
  currency: string; // 幣別
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  terms?: string; // 付款條件
  notes?: string; // 備註
  items: OrderItem[]; // 訂單項目
  ownerId?: string; // 負責人 ID
  ownerName?: string; // 負責人姓名
  createdAt: string;
  updatedAt: string;
}

// 訂單項目
export interface OrderItem {
  id: string;
  productName: string; // 產品名稱
  productId?: string; // 產品 ID
  description?: string; // 描述
  quantity: number; // 數量
  unitPrice: number; // 單價
  discount?: number; // 折扣 (%)
  total: number; // 小計
}

