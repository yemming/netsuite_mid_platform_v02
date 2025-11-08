import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試直接使用 request 方法查詢 Manufacturing Routing
 * 不使用 getRecordList，直接打 URL
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 方法 1: 直接使用 request 方法，不帶任何參數
    console.log('測試方法 1: 直接 GET /manufacturingrouting/...');
    try {
      const directResult = await netsuite.request(
        '/services/rest/record/v1/manufacturingrouting/',
        'GET'
      );
      
      results.directGet = {
        success: true,
        data: directResult,
        count: directResult.items?.length || 0,
        items: directResult.items || [],
      };
    } catch (error: any) {
      results.directGet = {
        success: false,
        error: error.message,
      };
    }

    // 方法 2: 使用 getRecordList（目前的實作）
    console.log('測試方法 2: 使用 getRecordList...');
    try {
      const listResult = await netsuite.getRecordList('manufacturingrouting', {
        fetchAll: false,
        limit: 100,
      });
      
      results.getRecordList = {
        success: true,
        count: listResult.items?.length || 0,
        items: listResult.items || [],
      };
    } catch (error: any) {
      results.getRecordList = {
        success: false,
        error: error.message,
      };
    }

    // 方法 3: 使用 request 方法，帶 limit 參數
    console.log('測試方法 3: GET /manufacturingrouting/?limit=100...');
    try {
      const limitResult = await netsuite.request(
        '/services/rest/record/v1/manufacturingrouting/',
        'GET',
        undefined,
        { limit: '100' }
      );
      
      results.withLimit = {
        success: true,
        data: limitResult,
        count: limitResult.items?.length || 0,
        items: limitResult.items || [],
      };
    } catch (error: any) {
      results.withLimit = {
        success: false,
        error: error.message,
      };
    }

    // 方法 4: 比較兩種方法的差異
    if (results.directGet?.success && results.getRecordList?.success) {
      results.comparison = {
        directGet_count: results.directGet.count,
        getRecordList_count: results.getRecordList.count,
        items_match: JSON.stringify(results.directGet.items) === JSON.stringify(results.getRecordList.items),
      };
    }

    return NextResponse.json({
      success: results.directGet?.success || results.getRecordList?.success || false,
      message: results.directGet?.success
        ? `直接 GET 成功：找到 ${results.directGet.count} 個 Routing`
        : results.getRecordList?.success
        ? `getRecordList 成功：找到 ${results.getRecordList.count} 個 Routing`
        : '兩種方法都失敗',
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
    message: '請使用 POST 方法測試直接查詢 Manufacturing Routing',
    endpoint: '/api/test-routing-direct',
    method: 'POST',
  });
}

