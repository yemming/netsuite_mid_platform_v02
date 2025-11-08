import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 Manufacturing Routing 的各種查詢方式
 * 根據 metadata catalog，記錄類型存在，但可能需要不同的查詢方式
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 方法 1: 檢查 metadata schema
    console.log('檢查 metadata schema...');
    try {
      const schema = await netsuite.request(
        '/services/rest/record/v1/metadata-catalog/manufacturingrouting',
        'GET'
      );
      results.metadataSchema = {
        success: true,
        schema: schema,
      };
    } catch (error: any) {
      results.metadataSchema = {
        success: false,
        error: error.message,
      };
    }

    // 方法 2: 嘗試使用 SuiteQL 查詢
    console.log('嘗試使用 SuiteQL 查詢...');
    const suiteqlQueries = [
      "SELECT * FROM manufacturingrouting FETCH FIRST 5 ROWS ONLY",
      "SELECT id, name, memo FROM manufacturingrouting FETCH FIRST 5 ROWS ONLY",
      "SELECT * FROM manufacturingrouting WHERE isinactive = 'F' FETCH FIRST 5 ROWS ONLY",
    ];

    for (const query of suiteqlQueries) {
      try {
        const suiteqlResult = await netsuite.executeSuiteQL(query, {
          fetchAll: false,
        });
        results[`suiteql_${suiteqlQueries.indexOf(query)}`] = {
          success: true,
          query: query,
          count: suiteqlResult.items?.length || 0,
          sample: suiteqlResult.items?.[0] || null,
          allFields: suiteqlResult.items?.[0] ? Object.keys(suiteqlResult.items[0]) : [],
        };
      } catch (error: any) {
        results[`suiteql_${suiteqlQueries.indexOf(query)}`] = {
          success: false,
          query: query,
          error: error.message,
        };
      }
    }

    // 方法 3: 嘗試直接使用 GET 方法查詢單一記錄（如果有已知 ID）
    // 但我們先不知道 ID，所以先跳過

    // 方法 4: 檢查是否有資料（透過 SuiteQL 先查 ID）
    try {
      const idQuery = "SELECT id FROM manufacturingrouting FETCH FIRST 1 ROWS ONLY";
      const idResult = await netsuite.executeSuiteQL(idQuery, {
        fetchAll: false,
      });
      
      if (idResult.items && idResult.items.length > 0) {
        const firstId = idResult.items[0].id;
        console.log(`找到 ID: ${firstId}，嘗試取得詳細資訊...`);
        
        try {
          const detail = await netsuite.getRecord('manufacturingrouting', firstId.toString());
          results.getRecord = {
            success: true,
            id: firstId,
            fields: Object.keys(detail),
            fullStructure: detail,
          };
        } catch (detailError: any) {
          results.getRecord = {
            success: false,
            id: firstId,
            error: detailError.message,
          };
        }
      } else {
        results.getRecord = {
          success: false,
          message: 'SuiteQL 查詢成功，但系統中沒有 Manufacturing Routing 資料',
        };
      }
    } catch (error: any) {
      results.getRecord = {
        success: false,
        error: error.message,
      };
    }

    // 總結
    const successfulMethods = Object.keys(results).filter(
      k => results[k].success === true && k !== 'timestamp'
    );

    return NextResponse.json({
      success: successfulMethods.length > 0,
      message: successfulMethods.length > 0
        ? `找到可用的查詢方法：${successfulMethods.join(', ')}`
        : '所有查詢方法都失敗',
      results,
    });
  } catch (error: any) {
    console.error('測試錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '測試失敗',
        message: error.message || '測試時發生錯誤',
        details: error,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '請使用 POST 方法測試 Manufacturing Routing（SuiteQL 方式）',
    endpoint: '/api/test-manufacturing-routing-suiteql',
    method: 'POST',
  });
}

