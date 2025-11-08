import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試所有製造模組相關的資料
 * 包括：BOM、Manufacturing Routing、Work Center
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
      const bomList = await netsuite.getRecordList('bom', {
        fetchAll: true,
        limit: 100,
      });
      
      results.bom = {
        success: true,
        count: bomList.items?.length || 0,
        items: bomList.items || [],
      };

      // 如果有 BOM，取得第一個的詳細資訊
      if (bomList.items && bomList.items.length > 0) {
        try {
          const firstBomId = bomList.items[0].id;
          const bomDetail = await netsuite.getRecord('bom', firstBomId);
          results.bom.detail = {
            bomId: firstBomId,
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
      };
    }

    // 2. 測試 Manufacturing Routing（先嘗試 SuiteQL）
    console.log('測試 Manufacturing Routing (SuiteQL)...');
    try {
      const routingQuery = "SELECT * FROM manufacturingrouting FETCH FIRST 10 ROWS ONLY";
      const routingResult = await netsuite.executeSuiteQL(routingQuery, {
        fetchAll: false,
      });
      
      results.manufacturingRouting_suiteql = {
        success: true,
        count: routingResult.items?.length || 0,
        items: routingResult.items || [],
      };

      // 如果有資料，嘗試使用 REST API 取得詳細資訊
      if (routingResult.items && routingResult.items.length > 0) {
        try {
          const firstRoutingId = routingResult.items[0].id;
          const routingDetail = await netsuite.getRecord('manufacturingrouting', firstRoutingId.toString());
          results.manufacturingRouting_suiteql.detail = {
            routingId: firstRoutingId,
            fields: Object.keys(routingDetail),
            sample: routingDetail,
          };
        } catch (detailError: any) {
          results.manufacturingRouting_suiteql.detailError = detailError.message;
        }
      }
    } catch (error: any) {
      results.manufacturingRouting_suiteql = {
        success: false,
        error: error.message,
      };
    }

    // 3. 測試 Manufacturing Routing（REST API List）
    console.log('測試 Manufacturing Routing (REST API List)...');
    try {
      const routingList = await netsuite.getRecordList('manufacturingrouting', {
        fetchAll: true,
        limit: 100,
      });
      
      results.manufacturingRouting_rest = {
        success: true,
        count: routingList.items?.length || 0,
        items: routingList.items || [],
      };
    } catch (error: any) {
      results.manufacturingRouting_rest = {
        success: false,
        error: error.message,
      };
    }

    // 4. 測試 Work Center（多種可能的 record type）
    console.log('測試 Work Center...');
    const workCenterNames = ['workcenter', 'workcenteritem', 'manufacturingworkcenter'];
    
    for (const name of workCenterNames) {
      try {
        const wcList = await netsuite.getRecordList(name, {
          fetchAll: false,
          limit: 10,
        });
        
        results[`workCenter_${name}`] = {
          success: true,
          count: wcList.items?.length || 0,
          items: wcList.items || [],
        };

        // 如果有資料，取得詳細資訊
        if (wcList.items && wcList.items.length > 0) {
          try {
            const firstWcId = wcList.items[0].id;
            const wcDetail = await netsuite.getRecord(name, firstWcId);
            results[`workCenter_${name}`].detail = {
              wcId: firstWcId,
              fields: Object.keys(wcDetail),
              sample: wcDetail,
            };
          } catch (detailError: any) {
            results[`workCenter_${name}`].detailError = detailError.message;
          }
        }
      } catch (error: any) {
        results[`workCenter_${name}`] = {
          success: false,
          error: error.message,
        };
      }
    }

    // 5. 測試 Work Center（SuiteQL）
    console.log('測試 Work Center (SuiteQL)...');
    try {
      const wcSuiteqlQuery = "SELECT * FROM workcenter FETCH FIRST 10 ROWS ONLY";
      const wcSuiteqlResult = await netsuite.executeSuiteQL(wcSuiteqlQuery, {
        fetchAll: false,
      });
      
      results.workCenter_suiteql = {
        success: true,
        count: wcSuiteqlResult.items?.length || 0,
        items: wcSuiteqlResult.items || [],
      };
    } catch (error: any) {
      results.workCenter_suiteql = {
        success: false,
        error: error.message,
      };
    }

    // 6. 檢查 BOM 是否關聯到 Routing
    if (results.bom?.success && results.bom.items && results.bom.items.length > 0) {
      console.log('檢查 BOM 是否關聯到 Routing...');
      try {
        const firstBomId = results.bom.items[0].id;
        const bomDetail = await netsuite.getRecord('bom', firstBomId);
        
        // 檢查是否有 routing 相關欄位
        const routingFields = Object.keys(bomDetail).filter(key => 
          key.toLowerCase().includes('routing') || 
          key.toLowerCase().includes('manufacturing')
        );
        
        results.bomRoutingRelation = {
          bomId: firstBomId,
          routingFields: routingFields,
          routingData: routingFields.reduce((acc: any, key: string) => {
            acc[key] = bomDetail[key];
            return acc;
          }, {}),
        };
      } catch (error: any) {
        results.bomRoutingRelation = {
          error: error.message,
        };
      }
    }

    // 總結
    const summary: any = {
      bom: results.bom?.success ? `✅ ${results.bom.count} 個` : '❌ 無法查詢',
      manufacturingRouting: 
        results.manufacturingRouting_suiteql?.success 
          ? `✅ SuiteQL: ${results.manufacturingRouting_suiteql.count} 個`
          : results.manufacturingRouting_rest?.success
          ? `✅ REST: ${results.manufacturingRouting_rest.count} 個`
          : '❌ 無法查詢',
      workCenter: 
        Object.keys(results).filter(k => k.startsWith('workCenter_') && results[k].success).length > 0
          ? `✅ 找到`
          : results.workCenter_suiteql?.success
          ? `✅ SuiteQL: ${results.workCenter_suiteql.count} 個`
          : '❌ 無法查詢',
    };

    results.summary = summary;

    return NextResponse.json({
      success: true,
      message: '測試完成',
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
    message: '請使用 POST 方法測試所有製造模組資料',
    endpoint: '/api/test-all-manufacturing',
    method: 'POST',
  });
}

