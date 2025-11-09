import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試不同的 Item 查詢方法
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
    };

    // 測試 1: List API（已知可用，但有限制）
    console.log('測試 1: List API...');
    try {
      const listResult = await netsuite.getRecordList('inventoryitem', {
        fetchAll: false,
        limit: 100,
      });
      results.listAPI = {
        success: true,
        count: listResult.items?.length || 0,
        hasMore: listResult.hasMore || false,
        message: 'List API 成功',
      };
    } catch (error: any) {
      results.listAPI = {
        success: false,
        error: error.message || error.toString(),
        message: 'List API 失敗',
      };
    }

    // 測試 2: Search API - 嘗試不同的端點格式
    console.log('測試 2: Search API - /search 端點...');
    try {
      const searchResult = await netsuite.request(
        '/services/rest/record/v1/inventoryitem/search',
        'POST',
        { basic: [] }
      );
      results.searchEndpoint = {
        success: true,
        count: searchResult.items?.length || 0,
        message: 'Search API /search 端點成功',
      };
    } catch (error: any) {
      results.searchEndpoint = {
        success: false,
        error: error.message || error.toString(),
        message: 'Search API /search 端點失敗',
      };
    }

    // 測試 3: 檢查 metadata catalog 看是否有 search 相關的 links
    console.log('測試 3: 檢查 metadata catalog...');
    try {
      const catalog = await netsuite.getMetadataCatalog();
      const inventoryItemMeta = catalog.items?.find((item: any) => 
        item.name?.toLowerCase() === 'inventoryitem'
      );
      results.metadataCatalog = {
        success: true,
        found: !!inventoryItemMeta,
        links: inventoryItemMeta?.links || [],
        message: 'Metadata catalog 查詢成功',
      };
    } catch (error: any) {
      results.metadataCatalog = {
        success: false,
        error: error.message || error.toString(),
        message: 'Metadata catalog 查詢失敗',
      };
    }

    // 測試 4: 嘗試使用 SuiteQL（雖然沒有價格，但可以確認數量）
    console.log('測試 4: SuiteQL 查詢數量...');
    try {
      const suiteqlResult = await netsuite.executeSuiteQL(`
        SELECT COUNT(*) as total
        FROM item
        WHERE itemtype = 'InvtPart'
      `);
      results.suiteql = {
        success: true,
        count: suiteqlResult.items?.[0]?.total || 0,
        message: 'SuiteQL 查詢成功',
      };
    } catch (error: any) {
      results.suiteql = {
        success: false,
        error: error.message || error.toString(),
        message: 'SuiteQL 查詢失敗',
      };
    }

    // 測試 5: 嘗試使用 List API 但增加 limit 和多次查詢
    console.log('測試 5: List API 多次查詢（模擬分頁）...');
    try {
      const allItems: any[] = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;
      let pageCount = 0;

      while (hasMore && pageCount < 10) { // 最多查詢 10 頁
        pageCount++;
        const pageResult = await netsuite.getRecordList('inventoryitem', {
          fetchAll: false,
          limit: limit,
          offset: offset,
        });

        if (pageResult.items && pageResult.items.length > 0) {
          allItems.push(...pageResult.items);
          offset += pageResult.items.length;
          hasMore = pageResult.hasMore || false;
          console.log(`第 ${pageCount} 頁：取得 ${pageResult.items.length} 筆，累計 ${allItems.length} 筆`);
        } else {
          hasMore = false;
        }

        // 如果沒有更多資料，停止
        if (!hasMore) break;
      }

      results.listAPIPagination = {
        success: true,
        totalCount: allItems.length,
        pageCount: pageCount,
        message: `List API 分頁查詢成功，共 ${allItems.length} 筆`,
      };
    } catch (error: any) {
      results.listAPIPagination = {
        success: false,
        error: error.message || error.toString(),
        message: 'List API 分頁查詢失敗',
      };
    }

    return NextResponse.json({
      success: true,
      message: '測試完成',
      results,
    });
  } catch (error: any) {
    console.error('測試 Item 查詢方法錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '測試失敗',
        message: error.message || '測試時發生錯誤',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}

