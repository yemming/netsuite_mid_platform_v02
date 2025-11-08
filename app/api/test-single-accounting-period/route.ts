import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試取得單一 Accounting Period 的詳細資料
 * 用於查看實際的欄位結構
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const periodId = body.periodId || '18'; // 預設使用 ID 18

    const netsuite = getNetSuiteAPIClient();

    try {
      // 取得單一記錄的詳細資訊
      const record = await netsuite.getRecord('accountingperiod', periodId);

      return NextResponse.json({
        success: true,
        periodId,
        record,
        fields: Object.keys(record),
        fieldTypes: Object.keys(record).reduce((acc: any, key) => {
          acc[key] = typeof record[key];
          return acc;
        }, {}),
        message: '成功取得 Accounting Period 詳細資料',
      });
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          periodId,
          error: error.message,
          message: '取得記錄詳細資料失敗',
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
    message: '請使用 POST 方法，提供 periodId（可選，預設為 18）',
    example: {
      method: 'POST',
      body: {
        periodId: '18',
      },
    },
  });
}

