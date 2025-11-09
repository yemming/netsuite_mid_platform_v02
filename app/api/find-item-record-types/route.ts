import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 找出所有 itemtype 對應的 REST API record type
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
      mapping: {},
    };

    // 從 SuiteQL 取得所有 itemtype
    const suiteqlResult = await netsuite.executeSuiteQL(`
      SELECT DISTINCT itemtype
      FROM item
      ORDER BY itemtype
    `);

    const itemTypes = suiteqlResult.items?.map((item: any) => item.itemtype) || [];
    results.suiteqlItemTypes = itemTypes;

    // 可能的 REST API record type 映射
    const possibleMappings: Record<string, string[]> = {
      'InvtPart': ['inventoryitem', 'inventory'],
      'NonInvtPart': ['noninventoryitem', 'noninventoryresaleitem', 'noninventorypart', 'noninventory'],
      'Service': ['serviceitem', 'service'],
      'Assembly': ['assemblyitem', 'assembly'],
      'GiftCert': ['giftcertificateitem', 'giftcertificate'],
      'Markup': ['markupitem', 'markup'],
      'Discount': ['discountitem', 'discount'],
      'Group': ['kititem', 'kit', 'groupitem', 'group'],
    };

    // 測試每個 itemtype 對應的 REST API record type
    for (const itemType of itemTypes) {
      const possibleTypes = possibleMappings[itemType] || [itemType.toLowerCase()];
      results.mapping[itemType] = {
        possibleTypes: possibleTypes,
        found: [],
      };

      for (const restType of possibleTypes) {
        try {
          // 嘗試查詢，看是否能取得資料
          const result = await netsuite.getRecordList(restType, {
            fetchAll: false,
            limit: 10,
          });

          if (result.items && result.items.length > 0) {
            // 檢查這些 items 的 itemtype 是否匹配
            const matchingItems = result.items.filter((item: any) => {
              const itemItemType = item.itemType || item.itemtype || '';
              return itemItemType === itemType || itemItemType.toLowerCase() === itemType.toLowerCase();
            });

            if (matchingItems.length > 0) {
              results.mapping[itemType].found.push({
                restType: restType,
                count: matchingItems.length,
                sample: matchingItems[0],
              });
            }
          }
        } catch (error: any) {
          // 忽略錯誤，繼續測試下一個
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Item Type 映射查詢完成',
      results,
    });
  } catch (error: any) {
    console.error('查詢 Item Type 映射錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '查詢失敗',
        message: error.message || '查詢時發生錯誤',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}

