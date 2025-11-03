import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL_SYNC_DB;

    if (!webhookUrl) {
      return NextResponse.json(
        { 
          error: 'N8N Webhook URL 未設定',
          message: '請在環境變數中設定 NEXT_PUBLIC_N8N_WEBHOOK_URL_SYNC_DB'
        },
        { status: 500 }
      );
    }

    // 呼叫 N8N Webhook
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 秒超時

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync_netsuite_to_supabase',
          timestamp: new Date().toISOString(),
          source: 'settings_page',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { 
            error: 'N8N Webhook 執行失敗',
            message: errorText || `HTTP ${response.status}: ${response.statusText}`,
            status: response.status
          },
          { status: response.status }
        );
      }

      const responseData = await response.json().catch(() => {
        // 如果回應不是 JSON，返回文字內容
        return { message: '同步請求已發送' };
      });

      return NextResponse.json({
        success: true,
        message: '同步請求已成功發送到 N8N',
        data: responseData,
        timestamp: new Date().toISOString(),
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { 
            error: '請求超時',
            message: 'N8N Webhook 回應時間超過 60 秒，請檢查 N8N 工作流程狀態'
          },
          { status: 504 }
        );
      }

      return NextResponse.json(
        { 
          error: '無法連接到 N8N Webhook',
          message: fetchError.message || '網路連線錯誤'
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('同步 NetSuite 到 Supabase 錯誤:', error);
    return NextResponse.json(
      { 
        error: '伺服器錯誤',
        message: error.message || '未知錯誤'
      },
      { status: 500 }
    );
  }
}

