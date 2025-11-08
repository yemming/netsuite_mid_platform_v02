import { NextResponse } from 'next/server';

// 簡單的內存存儲（生產環境建議使用 Redis 或數據庫）
const ocrResults = new Map<string, {
  status: 'processing' | 'completed' | 'error';
  data?: any;
  error?: string;
  timestamp: number;
}>();

// 清理過期的結果（超過 10 分鐘）
setInterval(() => {
  const now = Date.now();
  for (const [jobId, result] of ocrResults.entries()) {
    if (now - result.timestamp > 10 * 60 * 1000) {
      ocrResults.delete(jobId);
    }
  }
}, 5 * 60 * 1000); // 每 5 分鐘清理一次

// 接收 N8N 的回調
export async function POST(request: Request) {
  try {
    // 嘗試從 headers 或 body 中獲取 jobId
    const headers = request.headers;
    let jobId = headers.get('X-Job-Id') || headers.get('x-job-id');
    
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // 如果 body 不是 JSON，嘗試從 headers 獲取
    }

    // 處理新格式：body 可能是數組格式 [ { output: {...}, success: true, ... } ]
    let result: any = null;
    const error = Array.isArray(body) ? null : (body.error || null);

    // 如果 body 本身是數組（新格式），直接使用
    if (Array.isArray(body) && body.length > 0) {
      result = body;
      // 從數組中提取 jobId（如果有的話）
      if (!jobId && body[0] && body[0].jobId) {
        jobId = body[0].jobId;
      }
    } else if (body && typeof body === 'object') {
      // 優先使用 body 中的 jobId，如果沒有則使用 header
      jobId = body.jobId || jobId;
      result = body.result || body.data;
      
      // 如果沒有明確的 result，但 body 有內容（排除 jobId），也視為結果
      if (!result && Object.keys(body).length > 0 && !body.jobId) {
        result = body;
      }
    }

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId 是必需的（可通過 X-Job-Id header 或 body.jobId 傳遞）' },
        { status: 400 }
      );
    }

    if (error) {
      ocrResults.set(jobId, {
        status: 'error',
        error: typeof error === 'string' ? error : JSON.stringify(error),
        timestamp: Date.now(),
      });
      return NextResponse.json({ success: true, message: '錯誤已記錄', jobId });
    }

    if (result) {
      ocrResults.set(jobId, {
        status: 'completed',
        data: result,
        timestamp: Date.now(),
      });
      return NextResponse.json({ success: true, message: '結果已保存', jobId });
    }

    return NextResponse.json(
      { error: 'result 或 error 是必需的' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('OCR 回調處理錯誤:', error);
    return NextResponse.json(
      { error: `處理回調時發生錯誤: ${error.message}` },
      { status: 500 }
    );
  }
}

// 查詢 OCR 結果
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId 是必需的' },
        { status: 400 }
      );
    }

    const result = ocrResults.get(jobId);

    if (!result) {
      return NextResponse.json(
        { status: 'not_found', message: '找不到該任務的結果' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('查詢 OCR 結果錯誤:', error);
    return NextResponse.json(
      { error: `查詢結果時發生錯誤: ${error.message}` },
      { status: 500 }
    );
  }
}

