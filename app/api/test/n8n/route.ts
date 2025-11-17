/**
 * n8n Webhook 測試 API
 * 
 * GET /api/test/n8n
 * 
 * 測試項目：
 * 1. n8n 服務可達性
 * 2. Webhook 調用
 * 3. 回應處理
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const n8nUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    
    if (!n8nUrl) {
      return NextResponse.json({
        status: 'error',
        message: 'n8n Webhook URL 未設定',
        tips: [
          '請在 Zeabur 環境變數中設定 NEXT_PUBLIC_N8N_WEBHOOK_URL',
          '格式: https://n8n-<service-id>.zeabur.app',
        ]
      }, { status: 500 });
    }
    
    // 測試 n8n 健康狀態（如果有公開的 API）
    const healthCheck = await fetch(`${n8nUrl}/healthz`, {
      method: 'GET',
    }).catch(() => null);
    
    return NextResponse.json({
      status: 'success',
      message: 'n8n 配置檢查完成',
      data: {
        webhookUrl: n8nUrl,
        healthCheck: healthCheck?.ok ? '✅ n8n 服務正常' : '⚠️  無法訪問 n8n 健康檢查端點',
      },
      tips: [
        '要測試 Webhook，請使用 POST /api/test/n8n',
        '需要先在 n8n 中建立 Webhook 工作流',
      ]
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'n8n 測試失敗',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

/**
 * POST /api/test/n8n
 * 
 * 測試調用 n8n Webhook
 * 
 * Body:
 * {
 *   "webhookId": "your-webhook-id",  // n8n Webhook 的 ID
 *   "data": { ... }                   // 要發送的資料
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookId, data = {} } = body;
    
    if (!webhookId) {
      return NextResponse.json({
        status: 'error',
        message: '請提供 webhookId',
        example: {
          webhookId: 'abc-def-ghi',
          data: { test: 'data' }
        }
      }, { status: 400 });
    }
    
    const n8nUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    
    if (!n8nUrl) {
      return NextResponse.json({
        status: 'error',
        message: 'n8n Webhook URL 未設定',
      }, { status: 500 });
    }
    
    // 調用 n8n Webhook
    const webhookUrl = `${n8nUrl}/webhook/${webhookId}`;
    
    const startTime = Date.now();
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        source: 'netsuite-platform',
        timestamp: new Date().toISOString(),
      }),
    });
    const duration = Date.now() - startTime;
    
    const responseData = await response.json().catch(() => response.text());
    
    return NextResponse.json({
      status: response.ok ? 'success' : 'error',
      message: response.ok ? 'n8n Webhook 調用成功' : 'n8n Webhook 調用失敗',
      data: {
        webhookUrl,
        statusCode: response.status,
        duration: `${duration}ms`,
        response: responseData,
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'n8n Webhook 調用失敗',
      error: error instanceof Error ? error.message : String(error),
      tips: [
        '檢查 n8n 中的 Webhook 是否已啟用',
        '確認 Webhook ID 是否正確',
        '檢查 n8n 服務是否正在運行',
      ]
    }, { status: 500 });
  }
}

