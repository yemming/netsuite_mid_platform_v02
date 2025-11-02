import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, format } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // 驗證 NetSuite 環境變數
    const requiredEnvVars = [
      'NETSUITE_ACCOUNT_ID',
      'NETSUITE_CONSUMER_KEY',
      'NETSUITE_CONSUMER_SECRET',
      'NETSUITE_TOKEN_ID',
      'NETSUITE_TOKEN_SECRET',
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      console.error('Missing NetSuite environment variables:', missingVars);
      return NextResponse.json(
        { 
          error: `NetSuite 環境變數未設定: ${missingVars.join(', ')}` 
        },
        { status: 500 }
      );
    }

    const startTime = Date.now();
    let result;
    let timeTaken;

    try {
      const netsuite = getNetSuiteAPIClient();
      result = await netsuite.executeSuiteQL(query);
      timeTaken = Date.now() - startTime;
    } catch (netsuiteError: any) {
      console.error('NetSuite API Error:', netsuiteError);
      timeTaken = Date.now() - startTime;
      
      const errorMessage = netsuiteError.message || 
                          netsuiteError.toString() || 
                          '執行 SuiteQL 查詢時發生錯誤';
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    const rows = result.items || [];
    const rowCount = rows.length;

    // 處理 CSV 格式
    if (format === 'CSV') {
      const headers = Object.keys(rows[0] || {});
      const csvRows = [];
      
      // Add headers
      csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));
      
      // Add data rows
      for (const row of rows) {
        const values = headers.map(header => {
          let value = row[header];
          if (value === null || value === undefined) {
            value = '';
          } else if (typeof value === 'object') {
            value = JSON.stringify(value);
          } else {
            value = String(value);
          }
          return `"${value.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      }
      
      const csvData = csvRows.join('\n');
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="suiteql_results_${Date.now()}.csv"`,
        },
      });
    }

    // 預設返回 JSON（Table 格式）
    return NextResponse.json({
      rows,
      rowCount,
      timeTaken,
      hasMore: result.hasMore || false,
    });
  } catch (error: any) {
    console.error('SuiteQL Query Error:', error);
    
    let errorMessage = '執行查詢時發生錯誤';
    if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

