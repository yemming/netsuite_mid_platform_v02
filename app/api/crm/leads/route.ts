import { NextRequest, NextResponse } from 'next/server';
import type { LeadFormData } from '@/lib/types/crm';

/**
 * POST /api/crm/leads
 * 處理潛在客戶表單提交
 * 
 * TODO: 後續實作時，這裡應該：
 * 1. 驗證表單資料
 * 2. 儲存到 Supabase 資料庫
 * 3. 觸發 n8n 工作流程（Lead Processing Workflow）
 */
export async function POST(request: NextRequest) {
  try {
    const body: LeadFormData = await request.json();

    // 基本驗證
    if (!body.customer_name || !body.customer_email || !body.company_name || !body.requirements_text) {
      return NextResponse.json(
        { error: '缺少必要欄位' },
        { status: 400 }
      );
    }

    // TODO: 實際實作
    // 1. 儲存到 Supabase leads 表
    // 2. 觸發 n8n webhook 啟動工作流程

    // 模擬成功回應
    return NextResponse.json({
      success: true,
      lead_id: `lead-${Date.now()}`,
      message: '表單提交成功，AI 業務團隊將在 24 小時內為您準備客製化回覆',
    });
  } catch (error) {
    console.error('處理表單提交時發生錯誤:', error);
    return NextResponse.json(
      { error: '伺服器錯誤，請稍後再試' },
      { status: 500 }
    );
  }
}

