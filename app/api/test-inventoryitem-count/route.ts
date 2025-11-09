import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 inventoryitem 的實際數量
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 測試 1: 使用 fetchAll: false, limit: 5
    console.log('測試 1: fetchAll: false, limit: 5');
    try {
      const result1 = await netsuite.getRecordList('inventoryitem', {
        fetchAll: false,
        limit: 5,
      });
      results.test1 = {
        count: result1.items?.length || 0,
        hasMore: result1.hasMore,
        items: result1.items?.map((item: any) => ({ id: item.id, itemId: item.itemId || item.itemid })) || [],
      };
    } catch (error: any) {
      results.test1 = { error: error.message };
    }

    // 測試 2: 使用 fetchAll: true, limit: 1000
    console.log('測試 2: fetchAll: true, limit: 1000');
    try {
      const result2 = await netsuite.getRecordList('inventoryitem', {
        fetchAll: true,
        limit: 1000,
      });
      results.test2 = {
        count: result2.items?.length || 0,
        hasMore: result2.hasMore,
        sampleIds: result2.items?.slice(0, 10).map((item: any) => ({ id: item.id, itemId: item.itemId || item.itemid })) || [],
      };
    } catch (error: any) {
      results.test2 = { error: error.message };
    }

    // 測試 3: 手動分頁查詢（檢查是否有更多資料）
    console.log('測試 3: 手動分頁查詢 offset=0, limit=100');
    try {
      const result3 = await netsuite.getRecordList('inventoryitem', {
        fetchAll: false,
        limit: 100,
        offset: 0,
      });
      results.test3 = {
        count: result3.items?.length || 0,
        hasMore: result3.hasMore,
        message: result3.hasMore ? '還有更多資料' : '已取得所有資料',
      };
    } catch (error: any) {
      results.test3 = { error: error.message };
    }

    // 測試 4: 手動分頁查詢 offset=100, limit=100
    console.log('測試 4: 手動分頁查詢 offset=100, limit=100');
    try {
      const result4 = await netsuite.getRecordList('inventoryitem', {
        fetchAll: false,
        limit: 100,
        offset: 100,
      });
      results.test4 = {
        count: result4.items?.length || 0,
        hasMore: result4.hasMore,
        message: result4.items?.length > 0 ? '成功取得第 2 頁資料' : '第 2 頁無資料',
      };
    } catch (error: any) {
      results.test4 = { error: error.message };
    }

    return NextResponse.json({
      success: true,
      message: '測試完成',
      results,
    });
  } catch (error: any) {
    console.error('測試 inventoryitem 數量錯誤:', error);
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

