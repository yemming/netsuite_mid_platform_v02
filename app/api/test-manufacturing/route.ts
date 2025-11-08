import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試製造模組相關的 Record Types
 * 測試：BOM、Work Center、Routing
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 1. 測試 BOM
    console.log('測試 BOM...');
    try {
      const bomResult = await netsuite.getRecordList('bom', {
        fetchAll: false,
        limit: 5,
      });
      results.bom = {
        success: true,
        count: bomResult.items?.length || 0,
        sample: bomResult.items?.[0] || null,
        message: '✅ BOM List API 成功',
      };

      // 如果有 BOM，嘗試取得詳細資訊
      if (bomResult.items && bomResult.items.length > 0) {
        try {
          const bomDetail = await netsuite.getRecord('bom', bomResult.items[0].id);
          results.bom.detail = {
            fields: Object.keys(bomDetail),
            sample: bomDetail,
          };
        } catch (detailError: any) {
          results.bom.detailError = detailError.message;
        }
      }
    } catch (error: any) {
      results.bom = {
        success: false,
        error: error.message,
        message: '❌ BOM List API 失敗',
      };
    }

    // 2. 測試 Work Center
    console.log('測試 Work Center...');
    try {
      const workCenterResult = await netsuite.getRecordList('workcenter', {
        fetchAll: false,
        limit: 5,
      });
      results.workCenter = {
        success: true,
        count: workCenterResult.items?.length || 0,
        sample: workCenterResult.items?.[0] || null,
        message: '✅ Work Center List API 成功',
      };

      // 如果有 Work Center，嘗試取得詳細資訊
      if (workCenterResult.items && workCenterResult.items.length > 0) {
        try {
          const wcDetail = await netsuite.getRecord('workcenter', workCenterResult.items[0].id);
          results.workCenter.detail = {
            fields: Object.keys(wcDetail),
            sample: wcDetail,
          };
        } catch (detailError: any) {
          results.workCenter.detailError = detailError.message;
        }
      }
    } catch (error: any) {
      results.workCenter = {
        success: false,
        error: error.message,
        message: '❌ Work Center List API 失敗',
      };
    }

    // 3. 測試 Routing
    console.log('測試 Routing...');
    const routingNames = ['routing', 'manufacturingrouting', 'routingoperation'];
    for (const routingName of routingNames) {
      try {
        const routingResult = await netsuite.getRecordList(routingName, {
          fetchAll: false,
          limit: 3,
        });
        results[`routing_${routingName}`] = {
          success: true,
          count: routingResult.items?.length || 0,
          sample: routingResult.items?.[0] || null,
          message: `✅ ${routingName} List API 成功`,
        };
      } catch (error: any) {
        results[`routing_${routingName}`] = {
          success: false,
          error: error.message,
          message: `❌ ${routingName} List API 失敗`,
        };
      }
    }

    // 4. 測試 Assembly Items（確認製造模組是否真的啟用）
    console.log('測試 Assembly Items...');
    try {
      const assemblyItems = await netsuite.getRecordList('assemblyitem', {
        fetchAll: false,
        limit: 5,
      });
      results.assemblyItems = {
        success: true,
        count: assemblyItems.items?.length || 0,
        sample: assemblyItems.items?.[0] || null,
        message: '✅ Assembly Items List API 成功',
      };
    } catch (error: any) {
      results.assemblyItems = {
        success: false,
        error: error.message,
        message: '❌ Assembly Items List API 失敗',
      };
    }

    // 總結
    const successfulTests = Object.values(results).filter(
      (r: any) => r.success === true
    ).length;
    
    results.summary = {
      total_tests: Object.keys(results).filter(k => k !== 'timestamp' && k !== 'summary').length,
      successful_tests: successfulTests,
      all_successful: successfulTests === Object.keys(results).filter(k => k !== 'timestamp' && k !== 'summary').length,
    };

    return NextResponse.json({
      success: results.summary.all_successful,
      message: `測試完成：${successfulTests} 個測試成功`,
      results,
    });
  } catch (error: any) {
    console.error('測試製造模組錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '測試失敗',
        message: error.message || '測試製造模組時發生錯誤',
        details: error,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '請使用 POST 方法測試製造模組相關功能',
    endpoint: '/api/test-manufacturing',
    method: 'POST',
  });
}

