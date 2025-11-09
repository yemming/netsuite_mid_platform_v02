import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試所有 Item 類型的實際數量
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
      itemTypes: {},
    };

    // 所有可能的 item 類型
    const itemTypes = [
      'inventoryitem',
      'noninventoryresaleitem',
      'kititem',
      'assemblyitem',
      'giftcertificateitem',
      'giftcertificate',
      'downloaditem',
      'markupitem',
      'paymentitem',
    ];

    let totalCount = 0;

    for (const itemType of itemTypes) {
      try {
        console.log(`查詢 ${itemType} 的實際數量...`);
        
        // 使用 List API 分頁查詢取得所有資料
        const allItems: any[] = [];
        let offset = 0;
        const limit = 100;
        let hasMore = true;
        let pageCount = 0;

        while (hasMore && pageCount < 20) { // 最多查詢 20 頁
          pageCount++;
          
          const pageResult = await netsuite.getRecordList(itemType, {
            fetchAll: false,
            limit: limit,
            offset: offset,
          });

          if (pageResult.items && pageResult.items.length > 0) {
            allItems.push(...pageResult.items);
            offset += pageResult.items.length;
            hasMore = pageResult.hasMore || false;
            
            // 如果取得 limit 筆但 hasMore=false，繼續查詢確認
            if (!hasMore && pageResult.items.length === limit) {
              hasMore = true;
            }
          } else {
            hasMore = false;
          }
        }

        results.itemTypes[itemType] = {
          success: true,
          count: allItems.length,
          pageCount: pageCount,
          message: `成功取得 ${allItems.length} 筆`,
        };
        
        totalCount += allItems.length;
      } catch (error: any) {
        results.itemTypes[itemType] = {
          success: false,
          error: error.message || error.toString(),
          message: '查詢失敗',
        };
      }
    }

    results.summary = {
      totalItems: totalCount,
      itemTypesFound: Object.values(results.itemTypes).filter((r: any) => r.success).length,
    };

    return NextResponse.json({
      success: true,
      message: `總共找到 ${totalCount} 筆 Item 資料`,
      results,
    });
  } catch (error: any) {
    console.error('測試 Item 類型數量錯誤:', error);
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

