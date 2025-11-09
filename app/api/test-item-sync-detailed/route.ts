import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 詳細測試每個 Item 類型的實際查詢數量
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
      itemTypes: {},
    };

    const itemTypes = [
      'inventoryitem',           // 庫存品 (InvtPart) - 應該有 52 筆
      'noninventoryresaleitem',  // 非庫存品（轉售）(NonInvtPart) - 應該有 11 筆
      'serviceresaleitem',       // 服務（轉售）(Service) - 應該有 22 筆
      'assemblyitem',            // 組合品 (Assembly) - 應該有 1 筆
      'giftcertificateitem',     // 禮品卡 (GiftCert) - 應該有 2 筆
      'markupitem',              // 加價項目 (Markup) - 應該有 1 筆
      'discountitem',            // 折扣項目 (Discount) - 應該有 3 筆
      'kititem',                 // 套裝/群組 (Group) - 應該有 3 筆
    ];

    let totalCount = 0;

    for (const itemType of itemTypes) {
      try {
        console.log(`詳細查詢 ${itemType}...`);
        
        const allItems: any[] = [];
        let offset = 0;
        const limit = 100;
        let hasMore = true;
        let pageCount = 0;
        let consecutiveEmptyPages = 0;
        const pageDetails: any[] = [];

        while (hasMore && consecutiveEmptyPages < 3 && pageCount < 50) {
          pageCount++;
          
          try {
            const pageResult = await netsuite.getRecordList(itemType, {
              fetchAll: false,
              limit: limit,
              offset: offset,
            });

            pageDetails.push({
              page: pageCount,
              offset: offset,
              limit: limit,
              itemsReturned: pageResult.items?.length || 0,
              hasMore: pageResult.hasMore || false,
            });

            if (pageResult.items && pageResult.items.length > 0) {
              allItems.push(...pageResult.items);
              offset += pageResult.items.length;
              hasMore = pageResult.hasMore || false;
              consecutiveEmptyPages = 0;
              
              if (!hasMore && pageResult.items.length === limit) {
                hasMore = true;
                consecutiveEmptyPages = -1;
              }
            } else {
              consecutiveEmptyPages++;
              if (consecutiveEmptyPages >= 2) {
                hasMore = false;
              }
            }
          } catch (pageError: any) {
            const errorMessage = pageError.message || pageError.toString() || '';
            pageDetails.push({
              page: pageCount,
              error: errorMessage,
            });
            
            if (errorMessage.includes('400') || errorMessage.includes('404') || errorMessage.includes('out of range')) {
              hasMore = false;
              break;
            }
            consecutiveEmptyPages++;
            if (consecutiveEmptyPages >= 2) {
              hasMore = false;
            }
          }
        }

        results.itemTypes[itemType] = {
          success: true,
          totalCount: allItems.length,
          pageCount: pageCount,
          pageDetails: pageDetails,
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

    // 使用 SuiteQL 驗證實際數量
    try {
      const suiteqlResult = await netsuite.executeSuiteQL(`
        SELECT itemtype, COUNT(*) as count
        FROM item
        GROUP BY itemtype
        ORDER BY count DESC
      `);
      
      results.suiteqlVerification = {
        success: true,
        items: suiteqlResult.items || [],
        total: suiteqlResult.items?.reduce((sum: number, item: any) => sum + parseInt(item.count || 0), 0) || 0,
      };
    } catch (error: any) {
      results.suiteqlVerification = {
        success: false,
        error: error.message || error.toString(),
      };
    }

    results.summary = {
      restAPITotal: totalCount,
      suiteqlTotal: results.suiteqlVerification?.total || 0,
      difference: (results.suiteqlVerification?.total || 0) - totalCount,
    };

    return NextResponse.json({
      success: true,
      message: `REST API 總數: ${totalCount}, SuiteQL 總數: ${results.suiteqlVerification?.total || 0}, 差異: ${results.summary.difference}`,
      results,
    });
  } catch (error: any) {
    console.error('測試 Item 同步詳細資訊錯誤:', error);
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

