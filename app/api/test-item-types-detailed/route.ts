import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 詳細檢查所有可能的 Item 類型和數量
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
      itemTypes: {},
    };

    // 使用 SuiteQL 查詢所有 item 的 itemtype
    console.log('使用 SuiteQL 查詢所有 item 的 itemtype...');
    try {
      const suiteqlResult = await netsuite.executeSuiteQL(`
        SELECT itemtype, COUNT(*) as count
        FROM item
        GROUP BY itemtype
      `);
      
      results.suiteqlItemTypes = {
        success: true,
        items: suiteqlResult.items || [],
        message: 'SuiteQL 查詢所有 itemtype',
      };
    } catch (error: any) {
      results.suiteqlItemTypes = {
        success: false,
        error: error.message || error.toString(),
      };
    }

    // 測試所有可能的 REST API record types
    const possibleTypes = [
      'inventoryitem',
      'noninventoryitem',
      'noninventoryresaleitem',
      'noninventorypart',
      'serviceitem',
      'service',
      'kititem',
      'kit',
      'assemblyitem',
      'assembly',
      'giftcertificateitem',
      'giftcertificate',
      'downloaditem',
      'download',
      'markupitem',
      'markup',
      'otherchargeitem',
      'othercharge',
      'paymentitem',
      'payment',
      'subscription',
      'item',
    ];

    for (const itemType of possibleTypes) {
      try {
        const result = await netsuite.getRecordList(itemType, {
          fetchAll: false,
          limit: 5,
        });
        
        if (result.items && result.items.length > 0) {
          // 如果成功取得資料，查詢總數
          let totalCount = result.items.length;
          let hasMore = result.hasMore;
          let offset = result.items.length;
          
          // 如果 hasMore，繼續查詢
          while (hasMore && offset < 200) { // 最多查詢到 200 筆
            const nextResult = await netsuite.getRecordList(itemType, {
              fetchAll: false,
              limit: 100,
              offset: offset,
            });
            
            if (nextResult.items && nextResult.items.length > 0) {
              totalCount += nextResult.items.length;
              offset += nextResult.items.length;
              hasMore = nextResult.hasMore || false;
              
              if (!hasMore && nextResult.items.length === 100) {
                hasMore = true; // 強制繼續
              }
            } else {
              hasMore = false;
            }
          }
          
          results.itemTypes[itemType] = {
            exists: true,
            count: totalCount,
            message: `成功取得 ${totalCount} 筆`,
          };
        } else {
          results.itemTypes[itemType] = {
            exists: true,
            count: 0,
            message: 'Record type 存在但無資料',
          };
        }
      } catch (error: any) {
        const errorMessage = error.message || error.toString();
        if (errorMessage.includes('404') || errorMessage.includes('does not exist') || errorMessage.includes('Not Found')) {
          results.itemTypes[itemType] = {
            exists: false,
            error: 'Record type 不存在',
          };
        } else {
          results.itemTypes[itemType] = {
            exists: true, // 可能是權限問題
            error: errorMessage,
            message: '查詢失敗（可能是權限問題）',
          };
        }
      }
    }

    // 統計
    const existingTypes = Object.entries(results.itemTypes)
      .filter(([_, info]: [string, any]) => info.exists === true && info.count > 0)
      .map(([type, info]: [string, any]) => ({ type, count: info.count }));
    
    const totalFromREST = existingTypes.reduce((sum, item) => sum + item.count, 0);

    results.summary = {
      suiteqlTotal: results.suiteqlItemTypes?.items?.reduce((sum: number, item: any) => sum + parseInt(item.count || 0), 0) || 0,
      restAPITotal: totalFromREST,
      difference: (results.suiteqlItemTypes?.items?.reduce((sum: number, item: any) => sum + parseInt(item.count || 0), 0) || 0) - totalFromREST,
      existingTypes: existingTypes,
    };

    return NextResponse.json({
      success: true,
      message: `SuiteQL 總數: ${results.summary.suiteqlTotal}, REST API 總數: ${results.summary.restAPITotal}, 差異: ${results.summary.difference}`,
      results,
    });
  } catch (error: any) {
    console.error('測試 Item 類型詳細資訊錯誤:', error);
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

