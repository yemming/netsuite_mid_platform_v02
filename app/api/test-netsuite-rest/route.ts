import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 NetSuite REST API 連線和權限
 */
export async function GET() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
    };

    // 測試 1: 測試連線（取得公司資訊）
    console.log('測試 1: 測試 NetSuite 連線...');
    try {
      const connectionTest = await netsuite.testConnection();
      results.tests.connection = {
        success: connectionTest.success,
        message: connectionTest.message,
        companyName: connectionTest.companyName,
      };
    } catch (error: any) {
      results.tests.connection = {
        success: false,
        error: error.message || error.toString(),
      };
    }

    // 測試 2: 測試 Item 類型（inventoryitem）
    console.log('測試 2: 測試 inventoryitem REST API...');
    try {
      const inventoryResult = await netsuite.getRecordList('inventoryitem', {
        fetchAll: false,
        limit: 5,
      });
      results.tests.inventoryitem = {
        success: true,
        count: inventoryResult.items?.length || 0,
        sample: inventoryResult.items?.[0] || null,
        message: '成功取得 inventoryitem 資料',
      };
    } catch (error: any) {
      results.tests.inventoryitem = {
        success: false,
        error: error.message || error.toString(),
        message: '取得 inventoryitem 資料失敗',
      };
    }

    // 測試 3: 測試 noninventoryitem
    console.log('測試 3: 測試 noninventoryitem REST API...');
    try {
      const nonInventoryResult = await netsuite.getRecordList('noninventoryitem', {
        fetchAll: false,
        limit: 5,
      });
      results.tests.noninventoryitem = {
        success: true,
        count: nonInventoryResult.items?.length || 0,
        sample: nonInventoryResult.items?.[0] || null,
        message: '成功取得 noninventoryitem 資料',
      };
    } catch (error: any) {
      results.tests.noninventoryitem = {
        success: false,
        error: error.message || error.toString(),
        message: '取得 noninventoryitem 資料失敗',
      };
    }

    // 測試 4: 測試 serviceitem
    console.log('測試 4: 測試 serviceitem REST API...');
    try {
      const serviceResult = await netsuite.getRecordList('serviceitem', {
        fetchAll: false,
        limit: 5,
      });
      results.tests.serviceitem = {
        success: true,
        count: serviceResult.items?.length || 0,
        sample: serviceResult.items?.[0] || null,
        message: '成功取得 serviceitem 資料',
      };
    } catch (error: any) {
      results.tests.serviceitem = {
        success: false,
        error: error.message || error.toString(),
        message: '取得 serviceitem 資料失敗',
      };
    }

    // 測試 5: 測試 kititem
    console.log('測試 5: 測試 kititem REST API...');
    try {
      const kitResult = await netsuite.getRecordList('kititem', {
        fetchAll: false,
        limit: 5,
      });
      results.tests.kititem = {
        success: true,
        count: kitResult.items?.length || 0,
        sample: kitResult.items?.[0] || null,
        message: '成功取得 kititem 資料',
      };
    } catch (error: any) {
      results.tests.kititem = {
        success: false,
        error: error.message || error.toString(),
        message: '取得 kititem 資料失敗',
      };
    }

    // 測試 6: 測試 assemblyitem
    console.log('測試 6: 測試 assemblyitem REST API...');
    try {
      const assemblyResult = await netsuite.getRecordList('assemblyitem', {
        fetchAll: false,
        limit: 5,
      });
      results.tests.assemblyitem = {
        success: true,
        count: assemblyResult.items?.length || 0,
        sample: assemblyResult.items?.[0] || null,
        message: '成功取得 assemblyitem 資料',
      };
    } catch (error: any) {
      results.tests.assemblyitem = {
        success: false,
        error: error.message || error.toString(),
        message: '取得 assemblyitem 資料失敗',
      };
    }

    // 測試 7: 測試取得單一記錄（如果有資料）
    if (results.tests.inventoryitem?.success && results.tests.inventoryitem?.sample?.id) {
      console.log('測試 7: 測試取得單一 inventoryitem 記錄...');
      try {
        const singleItem = await netsuite.getRecord(
          'inventoryitem',
          results.tests.inventoryitem.sample.id
        );
        results.tests.singleRecord = {
          success: true,
          recordId: results.tests.inventoryitem.sample.id,
          fields: Object.keys(singleItem),
          sampleData: {
            id: singleItem.id,
            itemId: singleItem.itemId || singleItem.itemid,
            displayName: singleItem.displayName || singleItem.displayname,
            basePrice: singleItem.basePrice || singleItem.baseprice || singleItem.price,
          },
          message: '成功取得單一記錄',
        };
      } catch (error: any) {
        results.tests.singleRecord = {
          success: false,
          error: error.message || error.toString(),
          message: '取得單一記錄失敗',
        };
      }
    }

    // 總結
    const successCount = Object.values(results.tests).filter(
      (test: any) => test.success === true
    ).length;
    const totalCount = Object.keys(results.tests).length;

    results.summary = {
      totalTests: totalCount,
      successCount: successCount,
      failureCount: totalCount - successCount,
      allPassed: successCount === totalCount,
    };

    return NextResponse.json({
      success: true,
      message: `測試完成：${successCount}/${totalCount} 個測試通過`,
      results,
    });
  } catch (error: any) {
    console.error('測試 NetSuite REST API 錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '測試失敗',
        message: error.message || '測試 NetSuite REST API 時發生錯誤',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}

