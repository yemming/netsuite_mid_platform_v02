import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 Manufacturing Routing（使用正確的大小寫）
 * 根據 NetSuite UI，記錄類型 ID 應該是 ManufacturingRouting
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 測試不同的命名方式
    const recordTypeNames = [
      'ManufacturingRouting',  // 根據 UI 顯示的 ID
      'manufacturingrouting',   // 全小寫（之前測試過）
      'manufacturingRouting',  // camelCase
      'manufacturing_routing', // 底線分隔
    ];

    for (const recordTypeName of recordTypeNames) {
      console.log(`測試 ${recordTypeName}...`);
      
      // 方法 1: List API
      try {
        const listResult = await netsuite.getRecordList(recordTypeName, {
          fetchAll: false,
          limit: 3,
        });
        
        results[`list_${recordTypeName}`] = {
          success: true,
          count: listResult.items?.length || 0,
          sample: listResult.items?.[0] || null,
          message: `✅ ${recordTypeName} List API 成功`,
        };

        // 如果有資料，嘗試取得詳細資訊
        if (listResult.items && listResult.items.length > 0) {
          try {
            const detail = await netsuite.getRecord(recordTypeName, listResult.items[0].id);
            results[`list_${recordTypeName}`].detail = {
              fields: Object.keys(detail),
              sample: detail,
            };
          } catch (detailError: any) {
            results[`list_${recordTypeName}`].detailError = detailError.message;
          }
        }
      } catch (error: any) {
        results[`list_${recordTypeName}`] = {
          success: false,
          error: error.message,
          message: `❌ ${recordTypeName} List API 失敗`,
        };
      }

      // 方法 2: 嘗試 Search API（使用 POST 方法）
      try {
        const searchResult = await netsuite.request(
          `/services/rest/record/v1/${recordTypeName}/search`,
          'POST',
          {
            basic: {}, // 空的基本搜尋條件，取得所有記錄
          }
        );
        
        results[`search_${recordTypeName}`] = {
          success: true,
          count: searchResult.items?.length || 0,
          sample: searchResult.items?.[0] || null,
          message: `✅ ${recordTypeName} Search API 成功`,
        };
      } catch (searchError: any) {
        results[`search_${recordTypeName}`] = {
          success: false,
          error: searchError.message,
          message: `❌ ${recordTypeName} Search API 失敗`,
        };
      }
    }

    // 方法 3: 檢查 metadata catalog 中的確切名稱
    try {
      const catalog = await netsuite.getMetadataCatalog();
      const routingItems = catalog.items?.filter((item: any) =>
        item.name?.toLowerCase().includes('routing') ||
        item.name?.toLowerCase().includes('manufacturing')
      ) || [];
      
      results.metadataCatalog = {
        success: true,
        found: routingItems.map((item: any) => ({
          name: item.name,
          links: item.links,
        })),
      };
    } catch (error: any) {
      results.metadataCatalog = {
        success: false,
        error: error.message,
      };
    }

    // 總結
    const successfulTests = Object.values(results).filter(
      (r: any) => r.success === true && r !== results.timestamp && r !== results.metadataCatalog
    ).length;
    
    results.summary = {
      total_tests: recordTypeNames.length * 2, // List + Search
      successful_tests: successfulTests,
      working_record_type: Object.keys(results)
        .filter(k => results[k].success === true && k.startsWith('list_') || k.startsWith('search_'))
        .map(k => k.replace('list_', '').replace('search_', ''))
        .filter((v, i, a) => a.indexOf(v) === i), // 去重
    };

    return NextResponse.json({
      success: successfulTests > 0,
      message: successfulTests > 0 
        ? `找到可用的記錄類型：${results.summary.working_record_type.join(', ')}`
        : '所有測試都失敗，可能需要檢查其他方法',
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
    message: '請使用 POST 方法測試 Manufacturing Routing',
    endpoint: '/api/test-manufacturing-routing-correct',
    method: 'POST',
  });
}

