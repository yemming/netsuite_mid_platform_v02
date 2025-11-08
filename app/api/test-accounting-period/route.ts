import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 Accounting Period 查詢
 * 用於診斷權限問題或 API 方法問題
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
      methods: {},
    };

    // 方法 1: 嘗試直接 List API
    console.log('測試方法 1: 直接 List API...');
    try {
      const listResult = await netsuite.getRecordList('accountingperiod', {
        fetchAll: false,
        limit: 5,
      });
      results.methods.list = {
        success: true,
        count: listResult.items?.length || 0,
        sample: listResult.items?.[0] || null,
        message: '✅ List API 成功',
      };
    } catch (error: any) {
      results.methods.list = {
        success: false,
        error: error.message,
        status: error.status,
        message: '❌ List API 失敗',
      };
    }

    // 方法 2: 嘗試 Search API（空查詢）
    console.log('測試方法 2: Search API（空查詢）...');
    try {
      const searchBody = {
        basic: [], // 空查詢 = 查詢所有記錄
      };

      const searchResult = await netsuite.request(
        '/services/rest/record/v1/accountingperiod/search',
        'POST',
        searchBody
      );

      results.methods.search = {
        success: true,
        count: searchResult.items?.length || 0,
        sample: searchResult.items?.[0] || null,
        message: '✅ Search API 成功',
      };
    } catch (error: any) {
      results.methods.search = {
        success: false,
        error: error.message,
        status: error.status,
        message: '❌ Search API 失敗',
      };
    }

    // 方法 3: 嘗試取得單一記錄（如果有已知 ID）
    console.log('測試方法 3: 取得單一記錄...');
    try {
      // 先從 metadata catalog 確認 record type 存在
      const catalog = await netsuite.getMetadataCatalog();
      const accountingPeriodType = catalog.items?.find(
        (item: any) => item.name?.toLowerCase() === 'accountingperiod'
      );

      if (accountingPeriodType) {
        results.metadata = {
          found: true,
          name: accountingPeriodType.name,
          links: accountingPeriodType.links,
        };

        // 如果有已知的 ID，可以測試單一記錄查詢
        // 這裡先不測試，因為不知道實際 ID
      } else {
        results.metadata = {
          found: false,
          message: '⚠️ 在 metadata catalog 中找不到 accountingperiod',
        };
      }
    } catch (error: any) {
      results.metadata = {
        error: error.message,
        message: '❌ 取得 metadata 失敗',
      };
    }

    // 方法 4: 檢查權限相關的端點
    console.log('檢查權限相關資訊...');
    try {
      // 嘗試存取一個已知的 record type 來確認 API 連線正常
      const testResult = await netsuite.getRecordList('subsidiary', {
        fetchAll: false,
        limit: 1,
      });

      results.permission_check = {
        api_connection: '✅ API 連線正常',
        can_access_other_records: testResult.items?.length > 0,
        message: '可以存取其他 record types，問題可能特定於 accountingperiod',
      };
    } catch (error: any) {
      results.permission_check = {
        api_connection: '❌ API 連線有問題',
        error: error.message,
      };
    }

    // 總結
    const successfulMethods = Object.values(results.methods).filter(
      (m: any) => m.success
    );
    
    const recommendedMethodKey = successfulMethods.length > 0 
      ? Object.keys(results.methods).find(
          (key) => (results.methods as any)[key].success
        )
      : 'none';
    
    results.summary = {
      total_methods: Object.keys(results.methods).length,
      successful_methods: successfulMethods.length,
      recommended_method: recommendedMethodKey,
      recommendation: successfulMethods.length > 0
        ? `✅ 建議使用 ${recommendedMethodKey} 方法`
        : '❌ 所有方法都失敗，請檢查：1) NetSuite 權限設定 2) Record type 名稱是否正確 3) NetSuite 版本是否支援',
    };

    return NextResponse.json({
      success: successfulMethods.length > 0,
      message: successfulMethods.length > 0 
        ? '至少有一種方法成功'
        : '所有方法都失敗，請檢查權限',
      results,
    });
  } catch (error: any) {
    console.error('測試 Accounting Period 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '測試失敗',
        message: error.message || '測試 Accounting Period 時發生錯誤',
        details: error,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '請使用 POST 方法測試 Accounting Period 查詢',
    endpoint: '/api/test-accounting-period',
    method: 'POST',
    description: '此端點會測試多種查詢 Accounting Period 的方法，幫助診斷權限或 API 問題',
  });
}

