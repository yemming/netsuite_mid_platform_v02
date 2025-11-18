import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * NetSuite 催款 Email OCR 處理 API
 * 作為代理，避免 CORS 問題
 * POST /api/netsuite-collection-email/ocr
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    // 統一使用 'data' 作為欄位名稱（與 webhook 一致）
    const file = formData.get('data') as File;

    if (!file) {
      return NextResponse.json(
        { error: '請提供 PDF 檔案' },
        { status: 400 }
      );
    }

    // 驗證檔案類型
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: '僅支援 PDF 檔案' },
        { status: 400 }
      );
    }

    // 從資料庫取得 N8N Webhook URL
    const supabase = await createClient();
    const { data: setting, error: settingError } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'n8n_webhook_url_ocr')
      .single();

    if (settingError || !setting?.setting_value) {
      console.error('取得 N8N Webhook URL 設定錯誤:', settingError);
      return NextResponse.json(
        { error: '無法取得 N8N Webhook URL 設定，請檢查系統設定' },
        { status: 500 }
      );
    }

    const webhookUrl = setting.setting_value;

    // 建立新的 FormData 轉發到 webhook
    // 統一使用 'data' 作為欄位名稱（Edit 和 Online 模式都使用 data）
    const webhookFormData = new FormData();
    webhookFormData.append('data', file);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: webhookFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook 錯誤:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      // 嘗試解析錯誤 JSON
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      return NextResponse.json(
        { 
          error: `OCR 處理失敗: ${errorData.message || response.statusText}`,
          details: errorData,
          status: response.status,
        },
        { status: response.status }
      );
    }

    // 解析回傳的 JSON
    const responseData = await response.json();
    
    // 記錄回傳的原始資料（用於調試）
    console.log('Webhook 回傳的原始資料:', JSON.stringify(responseData, null, 2));
    
    let extractedJson: any = null;
    
    try {
      // 處理新的回傳格式：可能是陣列格式
      if (Array.isArray(responseData) && responseData.length > 0) {
        // 如果是陣列，取第一個元素
        const firstItem = responseData[0];
        
        // 檢查是否有 success 欄位（新格式）
        if (firstItem.success !== undefined) {
          // 新格式：使用實際的資料欄位（不是 _raw_json）
          extractedJson = {
            ...firstItem,
            // 保留驗證資訊
            quality_grade: firstItem.quality_grade,
            validation_errors: firstItem.validation_errors || [],
            validation_warnings: firstItem.validation_warnings || [],
            // 標準化欄位名稱（向後相容）
            invoice_number: firstItem.invoice_number,
            due_date: firstItem.due_date,
            is_overdue: firstItem.is_overdue,
            overdue_warning_msg: firstItem.overdue_msg || firstItem.overdue_warning_msg || '',
            exchange_rate_source: firstItem.rate_source || firstItem.exchange_rate_source,
            exchange_rate: firstItem.exchange_rate,
            currency: firstItem.currency,
            total_amount_usd: firstItem.total_usd,
            amount_a_total_twd: firstItem.amount_a_twd,
            split_80_percent_usd: firstItem.split_80_usd,
            amount_b_80_percent_twd: firstItem.amount_b_twd,
            split_20_percent_tax_usd: firstItem.split_20_usd,
            amount_c_20_percent_twd: firstItem.amount_c_twd,
            // Email 主旨
            email_subject: firstItem.email_subject || '',
          };
        } else {
          // 如果沒有 success 欄位，直接使用
          extractedJson = firstItem;
        }
      } else if (responseData.content?.parts?.[0]?.text) {
        // 處理舊格式：JSON 在 content.parts[0].text 中，且被包在 markdown code block 中
        const textContent = responseData.content.parts[0].text;
        
        // 提取 markdown code block 中的 JSON
        const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        
        if (jsonMatch && jsonMatch[1]) {
          extractedJson = JSON.parse(jsonMatch[1].trim());
        } else {
          extractedJson = JSON.parse(textContent.trim());
        }
      } else {
        // 如果沒有特殊結構，直接使用回傳的資料
        extractedJson = responseData;
      }
    } catch (parseError) {
      console.error('JSON 解析錯誤:', parseError);
      extractedJson = responseData;
    }
    
    // 記錄提取後的 JSON（用於調試）
    console.log('提取後的 JSON:', JSON.stringify(extractedJson, null, 2));
    
    return NextResponse.json(extractedJson);
  } catch (error) {
    console.error('OCR API 錯誤:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'OCR 處理失敗',
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}

