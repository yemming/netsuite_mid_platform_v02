import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 Work Center 和 Routing 的各種可能名稱
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 測試 Work Center 的各種可能名稱
    console.log('測試 Work Center 的各種可能名稱...');
    const workCenterNames = [
      'workcenter',
      'workcenteritem',
      'manufacturingworkcenter',
      'productionworkcenter',
    ];

    for (const name of workCenterNames) {
      try {
        const result = await netsuite.getRecordList(name, {
          fetchAll: false,
          limit: 3,
        });
        results[`workcenter_${name}`] = {
          success: true,
          count: result.items?.length || 0,
          sample: result.items?.[0] || null,
          message: `✅ ${name} List API 成功`,
        };

        // 如果有資料，嘗試取得詳細資訊
        if (result.items && result.items.length > 0) {
          try {
            const detail = await netsuite.getRecord(name, result.items[0].id);
            results[`workcenter_${name}`].detail = {
              fields: Object.keys(detail),
              sample: detail,
            };
          } catch (detailError: any) {
            results[`workcenter_${name}`].detailError = detailError.message;
          }
        }
      } catch (error: any) {
        results[`workcenter_${name}`] = {
          success: false,
          error: error.message,
          message: `❌ ${name} List API 失敗`,
        };
      }
    }

    // 測試 Routing 的各種可能名稱
    console.log('測試 Routing 的各種可能名稱...');
    const routingNames = [
      'routing',
      'manufacturingrouting',
      'routingoperation',
      'routingstep',
      'manufacturingoperationtask',
    ];

    for (const name of routingNames) {
      try {
        const result = await netsuite.getRecordList(name, {
          fetchAll: false,
          limit: 3,
        });
        results[`routing_${name}`] = {
          success: true,
          count: result.items?.length || 0,
          sample: result.items?.[0] || null,
          message: `✅ ${name} List API 成功`,
        };

        // 如果有資料，嘗試取得詳細資訊
        if (result.items && result.items.length > 0) {
          try {
            const detail = await netsuite.getRecord(name, result.items[0].id);
            results[`routing_${name}`].detail = {
              fields: Object.keys(detail),
              sample: detail,
            };
          } catch (detailError: any) {
            results[`routing_${name}`].detailError = detailError.message;
          }
        }
      } catch (error: any) {
        results[`routing_${name}`] = {
          success: false,
          error: error.message,
          message: `❌ ${name} List API 失敗`,
        };
      }
    }

    // 總結
    const successfulTests = Object.values(results).filter(
      (r: any) => r.success === true
    ).length;
    
    const allTests = Object.keys(results).filter(k => k !== 'timestamp').length;
    
    results.summary = {
      total_tests: allTests,
      successful_tests: successfulTests,
      successful_record_types: Object.keys(results)
        .filter(k => results[k].success === true && k !== 'summary')
        .map(k => k.replace('workcenter_', '').replace('routing_', '')),
    };

    return NextResponse.json({
      success: successfulTests > 0,
      message: `測試完成：找到 ${successfulTests} 個可用的 Record Types`,
      results,
    });
  } catch (error: any) {
    console.error('測試錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '測試失敗',
        message: error.message || '測試時發生錯誤',
        details: error,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '請使用 POST 方法測試 Work Center 和 Routing',
    endpoint: '/api/test-workcenter-routing',
    method: 'POST',
  });
}

