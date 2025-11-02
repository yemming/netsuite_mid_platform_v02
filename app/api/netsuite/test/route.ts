import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

export async function GET() {
  try {
    // 檢查環境變數
    const requiredVars = [
      'NETSUITE_ACCOUNT_ID',
      'NETSUITE_CONSUMER_KEY',
      'NETSUITE_CONSUMER_SECRET',
      'NETSUITE_TOKEN_ID',
      'NETSUITE_TOKEN_SECRET',
    ];

    const missingVars = requiredVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `環境變數未設定: ${missingVars.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 建立 NetSuite 客戶端並測試連線
    const client = getNetSuiteAPIClient();
    const result = await client.testConnection();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        companyName: result.companyName,
        data: result.data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('NetSuite 連線測試錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'NetSuite 連線測試失敗',
      },
      { status: 500 }
    );
  }
}

