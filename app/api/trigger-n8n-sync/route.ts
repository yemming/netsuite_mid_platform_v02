import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * 觸發 n8n 同步工作流
 * 
 * 此 API 用於從 Next.js 前端觸發 n8n 工作流執行同步任務
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mappingKey, syncType = 'full', webhookId } = body;

    if (!mappingKey && !webhookId) {
      return NextResponse.json(
        {
          success: false,
          error: '請提供 mappingKey 或 webhookId',
        },
        { status: 400 }
      );
    }

    const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'n8n Webhook URL 未設定',
          message: '請在環境變數中設定 NEXT_PUBLIC_N8N_WEBHOOK_URL',
        },
        { status: 500 }
      );
    }

    // 如果提供了 mappingKey，需要查詢對應的 webhookId
    let targetWebhookId = webhookId;

    if (mappingKey && !webhookId) {
      // 從 table_mapping_config 取得 webhookId（如果有的話）
      // 或者使用預設的命名規則：sync-{mappingKey}
      targetWebhookId = `sync-${mappingKey}`;
    }

    // 構建 webhook URL
    const webhookUrl = `${n8nWebhookUrl}/webhook/${targetWebhookId}`;

    // 準備請求 body
    const requestBody = {
      mappingKey,
      syncType,
      timestamp: new Date().toISOString(),
      source: 'nextjs-frontend',
    };

    // 呼叫 n8n Webhook
    const startTime = Date.now();
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const duration = Date.now() - startTime;
    const responseData = await response.json().catch(() => response.text());

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'n8n Webhook 調用失敗',
          details: {
            statusCode: response.status,
            response: responseData,
            duration: `${duration}ms`,
          },
        },
        { status: response.status }
      );
    }

    // 記錄同步觸發（可選）
    const supabase = await createClient();
    try {
      await supabase.from('sync_logs').insert({
        table_name: mappingKey ? `ns_${mappingKey}` : 'unknown',
        sync_type: syncType,
        sync_status: 'pending',
        sync_started_at: new Date().toISOString(),
      });
    } catch (logError) {
      // 記錄失敗不影響主要流程
      console.warn('記錄同步日誌失敗:', logError);
    }

    return NextResponse.json({
      success: true,
      message: '同步任務已觸發',
      data: {
        webhookUrl,
        response: responseData,
        duration: `${duration}ms`,
      },
    });
  } catch (error: any) {
    console.error('觸發 n8n 同步錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '伺服器錯誤',
        message: error.message || '未知錯誤',
      },
      { status: 500 }
    );
  }
}

/**
 * GET：查詢 n8n 工作流狀態
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get('webhookId');

    if (!webhookId) {
      return NextResponse.json(
        {
          success: false,
          error: '請提供 webhookId',
        },
        { status: 400 }
      );
    }

    // 從 Supabase 查詢最近的同步日誌
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .order('sync_started_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: '查詢同步日誌失敗',
          details: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        recentSyncs: data || [],
      },
    });
  } catch (error: any) {
    console.error('查詢 n8n 工作流狀態錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '伺服器錯誤',
        message: error.message || '未知錯誤',
      },
      { status: 500 }
    );
  }
}

