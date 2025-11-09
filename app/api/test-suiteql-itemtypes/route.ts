import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 使用 SuiteQL 查詢所有 item 的 itemtype 和對應的 REST API record type
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 查詢所有 item 的 itemtype 分組統計
    try {
      const suiteqlResult = await netsuite.executeSuiteQL(`
        SELECT itemtype, COUNT(*) as count
        FROM item
        GROUP BY itemtype
        ORDER BY count DESC
      `);
      
      results.suiteqlItemTypes = suiteqlResult.items || [];
    } catch (error: any) {
      // 如果 GROUP BY 不支援，改用其他方式
      try {
        const suiteqlResult2 = await netsuite.executeSuiteQL(`
          SELECT DISTINCT itemtype
          FROM item
        `);
        results.suiteqlItemTypes = suiteqlResult2.items || [];
      } catch (error2: any) {
        results.suiteqlItemTypes = {
          error: error2.message || error2.toString(),
        };
      }
    }

    // 查詢前 100 筆 item 的詳細資訊，看看 itemtype 和可能的 REST API 欄位
    try {
      const sampleQuery = await netsuite.executeSuiteQL(`
        SELECT id, itemid, displayname, itemtype
        FROM item
        WHERE ROWNUM <= 100
      `);
      
      // 按 itemtype 分組
      const groupedByType: Record<string, any[]> = {};
      (sampleQuery.items || []).forEach((item: any) => {
        const itemType = item.itemtype || 'Unknown';
        if (!groupedByType[itemType]) {
          groupedByType[itemType] = [];
        }
        groupedByType[itemType].push({
          id: item.id,
          itemid: item.itemid,
          displayname: item.displayname,
        });
      });
      
      results.sampleItems = {
        total: sampleQuery.items?.length || 0,
        groupedByType: groupedByType,
      };
    } catch (error: any) {
      results.sampleItems = {
        error: error.message || error.toString(),
      };
    }

    // 測試可能的 REST API record types
    const possibleRecordTypes = [
      'noninventoryresaleitem',
      'noninventorypurchaseitem',
      'noninventoryitem',
      'serviceresaleitem',
      'servicepurchaseitem',
      'serviceitem',
      'kititem',
      'groupitem',
      'itemgroup',
    ];

    results.restAPITests = {};
    for (const recordType of possibleRecordTypes) {
      try {
        const result = await netsuite.getRecordList(recordType, {
          fetchAll: false,
          limit: 10,
        });
        
        results.restAPITests[recordType] = {
          exists: true,
          count: result.items?.length || 0,
          hasMore: result.hasMore || false,
          sample: result.items?.[0] || null,
        };
      } catch (error: any) {
        const errorMessage = error.message || error.toString() || '';
        if (errorMessage.includes('404') || errorMessage.includes('does not exist') || errorMessage.includes('Not Found')) {
          results.restAPITests[recordType] = {
            exists: false,
            error: 'Record type 不存在',
          };
        } else {
          results.restAPITests[recordType] = {
            exists: true,
            error: errorMessage,
            message: '查詢失敗（可能是權限問題）',
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'SuiteQL Item Type 查詢完成',
      results,
    });
  } catch (error: any) {
    console.error('測試 SuiteQL Item Types 錯誤:', error);
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

