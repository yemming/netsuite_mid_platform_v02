import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 檢查 NetSuite 中所有可用的 Item Record Types
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
      itemTypes: {},
    };

    // 已知的 item 類型列表
    const possibleItemTypes = [
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

    // 測試每個可能的類型
    for (const itemType of possibleItemTypes) {
      try {
        console.log(`測試 ${itemType}...`);
        const result = await netsuite.getRecordList(itemType, {
          fetchAll: false,
          limit: 10,
        });
        
        results.itemTypes[itemType] = {
          exists: true,
          count: result.items?.length || 0,
          hasMore: result.hasMore || false,
          sample: result.items?.[0] || null,
          message: `成功取得 ${result.items?.length || 0} 筆資料`,
        };
      } catch (error: any) {
        const errorMessage = error.message || error.toString();
        // 檢查是否為 404 錯誤（record type 不存在）
        if (errorMessage.includes('404') || errorMessage.includes('does not exist') || errorMessage.includes('Not Found')) {
          results.itemTypes[itemType] = {
            exists: false,
            error: 'Record type 不存在',
          };
        } else {
          results.itemTypes[itemType] = {
            exists: true, // 可能是權限問題，但 record type 存在
            error: errorMessage,
            message: '查詢失敗（可能是權限問題）',
          };
        }
      }
    }

    // 統計
    const existingTypes = Object.entries(results.itemTypes)
      .filter(([_, info]: [string, any]) => info.exists === true)
      .map(([type, _]) => type);
    
    const totalCount = existingTypes.reduce((sum, type) => {
      return sum + (results.itemTypes[type].count || 0);
    }, 0);

    results.summary = {
      existingTypes: existingTypes,
      totalTypesFound: existingTypes.length,
      totalItemsFound: totalCount,
      note: '此測試只查詢前 10 筆，實際數量可能更多',
    };

    return NextResponse.json({
      success: true,
      message: `找到 ${existingTypes.length} 個可用的 Item Record Types`,
      results,
    });
  } catch (error: any) {
    console.error('檢查 Item Types 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '檢查失敗',
        message: error.message || '檢查 Item Types 時發生錯誤',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}

