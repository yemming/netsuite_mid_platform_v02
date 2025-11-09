import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 使用 SuiteQL 查詢實際的 Item 數量
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
      suiteql: {},
    };

    // 查詢 1: 所有 items 的總數
    console.log('查詢 1: 所有 items 的總數...');
    try {
      const query1 = await netsuite.executeSuiteQL(`
        SELECT COUNT(*) as total
        FROM item
      `);
      results.suiteql.totalItems = {
        success: true,
        count: query1.items?.[0]?.total || 0,
        message: '所有 items 總數',
      };
    } catch (error: any) {
      results.suiteql.totalItems = {
        success: false,
        error: error.message || error.toString(),
      };
    }

    // 查詢 2: 按 itemtype 分組統計
    console.log('查詢 2: 按 itemtype 分組統計...');
    try {
      const query2 = await netsuite.executeSuiteQL(`
        SELECT itemtype, COUNT(*) as count
        FROM item
        GROUP BY itemtype
        ORDER BY count DESC
      `);
      results.suiteql.byItemType = {
        success: true,
        items: query2.items || [],
        message: '按 itemtype 分組統計',
      };
    } catch (error: any) {
      results.suiteql.byItemType = {
        success: false,
        error: error.message || error.toString(),
      };
    }

    // 查詢 3: 檢查是否有停用的 items
    console.log('查詢 3: 檢查停用的 items...');
    try {
      const query3 = await netsuite.executeSuiteQL(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN isinactive = 'F' THEN 1 END) as active_count,
          COUNT(CASE WHEN isinactive = 'T' THEN 1 END) as inactive_count
        FROM item
      `);
      results.suiteql.activeInactive = {
        success: true,
        data: query3.items?.[0] || {},
        message: '啟用/停用統計',
      };
    } catch (error: any) {
      // 如果上面的語法有問題，改用簡單查詢
      try {
        const query3b = await netsuite.executeSuiteQL(`
          SELECT isinactive, COUNT(*) as count
          FROM item
          GROUP BY isinactive
        `);
        results.suiteql.activeInactive = {
          success: true,
          data: query3b.items || [],
          message: '啟用/停用統計（分組）',
        };
      } catch (error2: any) {
        results.suiteql.activeInactive = {
          success: false,
          error: error2.message || error2.toString(),
        };
      }
    }

    // 查詢 4: 取得前 100 筆 item 的 itemtype 和 id
    console.log('查詢 4: 取得前 100 筆 item 的詳細資訊...');
    try {
      const query4 = await netsuite.executeSuiteQL(`
        SELECT id, itemid, displayname, itemtype, isinactive
        FROM item
        ORDER BY id
        LIMIT 100
      `);
      results.suiteql.sampleItems = {
        success: true,
        count: query4.items?.length || 0,
        items: query4.items || [],
        message: '前 100 筆 items 詳細資訊',
      };
    } catch (error: any) {
      results.suiteql.sampleItems = {
        success: false,
        error: error.message || error.toString(),
      };
    }

    return NextResponse.json({
      success: true,
      message: 'SuiteQL 查詢完成',
      results,
    });
  } catch (error: any) {
    console.error('測試 SuiteQL Item 數量錯誤:', error);
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

