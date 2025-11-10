import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 Tax Code 的 Country 欄位
 * 根據 NetSuite UI，Tax Codes 列表有明確的 Country 欄位
 * 嘗試使用不同的 API 方法來取得 country 資訊
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();

    console.log('開始測試 Tax Code Country 欄位...');

    const results: any = {
      timestamp: new Date().toISOString(),
      methods: {},
    };

    // 方法 1: 使用 List API 查詢 salestaxitem
    console.log('測試方法 1: List API...');
    try {
      const listResult = await netsuite.getRecordList('salestaxitem', {
        fetchAll: false,
        limit: 5,
      });
      
      const firstItem = listResult.items?.[0];
      const allKeys = firstItem ? Object.keys(firstItem) : [];
      const countryRelatedKeys = allKeys.filter(key => 
        key.toLowerCase().includes('country') ||
        key.toLowerCase().includes('nation') ||
        key.toLowerCase().includes('region')
      );

      results.methods.list = {
        success: true,
        count: listResult.items?.length || 0,
        sample: firstItem,
        allKeys: allKeys,
        countryRelatedKeys: countryRelatedKeys,
        hasCountry: firstItem && ('country' in firstItem || 'Country' in firstItem),
        countryValue: firstItem?.country || firstItem?.Country || null,
      };
    } catch (error: any) {
      results.methods.list = {
        success: false,
        error: error.message,
        message: 'List API 失敗',
      };
    }

    // 方法 2: 使用 Search API 查詢 salestaxitem
    console.log('測試方法 2: Search API...');
    try {
      const searchBody = {
        basic: [], // 空查詢 = 查詢所有記錄
      };

      const searchResult = await netsuite.request(
        '/services/rest/record/v1/salestaxitem/search',
        'POST',
        searchBody
      );

      const items = searchResult.items || [];
      const firstItem = items[0];
      const allKeys = firstItem ? Object.keys(firstItem) : [];
      const countryRelatedKeys = allKeys.filter(key => 
        key.toLowerCase().includes('country') ||
        key.toLowerCase().includes('nation') ||
        key.toLowerCase().includes('region')
      );

      results.methods.search = {
        success: true,
        count: items.length,
        sample: firstItem,
        allKeys: allKeys,
        countryRelatedKeys: countryRelatedKeys,
        hasCountry: firstItem && ('country' in firstItem || 'Country' in firstItem),
        countryValue: firstItem?.country || firstItem?.Country || null,
      };
    } catch (error: any) {
      results.methods.search = {
        success: false,
        error: error.message,
        message: 'Search API 失敗',
      };
    }

    // 方法 3: 使用 SuiteQL 查詢，然後用 REST API 取得詳細資料
    // 嘗試在 REST API 請求中加入 expandSubResources 或 fields 參數
    console.log('測試方法 3: SuiteQL + REST API (with expand)...');
    try {
      // 先從 SuiteQL 取得一些 ID
      const suiteqlResult = await netsuite.executeSuiteQL(`
        SELECT id, itemid
        FROM salestaxitem
        WHERE ROWNUM <= 5
        ORDER BY id
      `);

      if (suiteqlResult.items && suiteqlResult.items.length > 0) {
        const firstItem = suiteqlResult.items[0];
        
        // 嘗試使用不同的 URL 參數來取得完整資料
        const testUrls = [
          `/services/rest/record/v1/salestaxitem/${firstItem.id}`,
          `/services/rest/record/v1/salestaxitem/${firstItem.id}?expandSubResources=true`,
          `/services/rest/record/v1/salestaxitem/${firstItem.id}?fields=*`,
        ];

        const detailResults: any[] = [];
        for (const url of testUrls) {
          try {
            const detail = await netsuite.request(url, 'GET');
            const allKeys = Object.keys(detail);
            const countryRelatedKeys = allKeys.filter(key => 
              key.toLowerCase().includes('country') ||
              key.toLowerCase().includes('nation') ||
              key.toLowerCase().includes('region')
            );

            detailResults.push({
              url: url,
              success: true,
              allKeys: allKeys,
              countryRelatedKeys: countryRelatedKeys,
              hasCountry: 'country' in detail || 'Country' in detail,
              countryValue: detail.country || detail.Country || null,
              sample: detail,
            });
          } catch (error: any) {
            detailResults.push({
              url: url,
              success: false,
              error: error.message,
            });
          }
        }

        results.methods.restApiWithParams = {
          success: true,
          suiteqlId: firstItem.id,
          suiteqlItemid: firstItem.itemid,
          detailResults: detailResults,
        };
      }
    } catch (error: any) {
      results.methods.restApiWithParams = {
        success: false,
        error: error.message,
        message: 'SuiteQL + REST API 失敗',
      };
    }

    return NextResponse.json({
      success: true,
      results: results,
      summary: {
        listApiHasCountry: results.methods.list?.hasCountry || false,
        searchApiHasCountry: results.methods.search?.hasCountry || false,
        restApiHasCountry: results.methods.restApiWithParams?.detailResults?.some((r: any) => r.hasCountry) || false,
      },
    });
  } catch (error: any) {
    console.error('測試 Tax Code Country 欄位錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '未知錯誤',
      },
      { status: 500 }
    );
  }
}

