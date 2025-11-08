import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試單一記錄查詢
 * 用於確認 record type 是否存在，以及查看實際的資料結構
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recordType, recordId } = body;

    if (!recordType || !recordId) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少參數',
          message: '需要提供 recordType 和 recordId',
        },
        { status: 400 }
      );
    }

    const netsuite = getNetSuiteAPIClient();

    try {
      // 嘗試查詢單一記錄
      const record = await netsuite.getRecord(recordType, recordId);

      return NextResponse.json({
        success: true,
        recordType,
        recordId,
        record,
        fields: Object.keys(record),
        message: '成功取得記錄',
      });
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          recordType,
          recordId,
          error: error.message,
          message: '查詢記錄失敗',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: '請求處理失敗',
        message: error.message || '處理請求時發生錯誤',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '請使用 POST 方法，提供 recordType 和 recordId',
    example: {
      method: 'POST',
      body: {
        recordType: 'accountingperiod',
        recordId: '1',
      },
    },
  });
}

