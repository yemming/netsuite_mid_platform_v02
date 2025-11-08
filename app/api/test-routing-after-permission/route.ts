import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 Manufacturing Routing（權限開啟後）
 * 測試各種查詢方式
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 1. 測試 List API
    console.log('測試 Manufacturing Routing List API...');
    try {
      const routingList = await netsuite.getRecordList('manufacturingrouting', {
        fetchAll: true,
        limit: 100,
      });
      
      results.list = {
        success: true,
        count: routingList.items?.length || 0,
        items: routingList.items || [],
      };
    } catch (error: any) {
      results.list = {
        success: false,
        error: error.message,
      };
    }

    // 2. 測試查詢單一記錄（ID: 1，從截圖中看到）
    console.log('測試查詢 Manufacturing Routing ID 1...');
    try {
      const routingDetail = await netsuite.getRecord('manufacturingrouting', '1');
      results.detail = {
        success: true,
        fields: Object.keys(routingDetail),
        fullStructure: routingDetail,
        // 提取關鍵欄位
        keyFields: {
          id: routingDetail.id,
          name: routingDetail.name,
          billOfMaterials: routingDetail.billOfMaterials || routingDetail.billofmaterials,
          subsidiary: routingDetail.subsidiary,
          location: routingDetail.location,
          memo: routingDetail.memo,
          isDefault: routingDetail.isDefault || routingDetail.isdefault,
          isInactive: routingDetail.isInactive || routingDetail.isinactive,
          autoCalculateLag: routingDetail.autoCalculateLag || routingDetail.autocalculatelag,
          routingSteps: routingDetail.routingSteps || routingDetail.routingsteps || routingDetail.routingStep,
        },
      };

      // 如果有 routingSteps，分析其結構
      const routingSteps = routingDetail.routingSteps || routingDetail.routingsteps || routingDetail.routingStep;
      if (routingSteps) {
        if (Array.isArray(routingSteps)) {
          results.routingSteps = {
            count: routingSteps.length,
            sample: routingSteps[0] || null,
            structure: routingSteps[0] ? Object.keys(routingSteps[0]) : [],
            allSteps: routingSteps,
          };
        } else if (typeof routingSteps === 'object') {
          // 可能是 links 或物件
          results.routingSteps = {
            type: 'object',
            structure: routingSteps,
          };
        }
      }

      // 檢查是否有 Work Center 相關的資訊
      if (routingSteps && Array.isArray(routingSteps)) {
        const workCenters = routingSteps
          .map((step: any) => step.manufacturingWorkCenter || step.manufacturingworkcenter || step.workCenter || step.workcenter)
          .filter((wc: any) => wc != null);
        
        results.workCenters = {
          found: workCenters.length > 0,
          workCenters: workCenters,
          uniqueWorkCenters: [...new Set(workCenters.map((wc: any) => 
            typeof wc === 'object' ? wc.id || wc.refName : wc
          ))],
        };
      }
    } catch (error: any) {
      results.detail = {
        success: false,
        error: error.message,
      };
    }

    // 3. 測試 SuiteQL 查詢
    console.log('測試 SuiteQL 查詢...');
    try {
      const suiteqlResult = await netsuite.executeSuiteQL(
        "SELECT * FROM manufacturingrouting FETCH FIRST 5 ROWS ONLY",
        { fetchAll: false }
      );
      
      results.suiteql = {
        success: true,
        count: suiteqlResult.items?.length || 0,
        items: suiteqlResult.items || [],
      };
    } catch (error: any) {
      results.suiteql = {
        success: false,
        error: error.message,
      };
    }

    // 4. 檢查是否有 routingSteps 的子資源端點
    if (results.detail?.success) {
      console.log('檢查 routingSteps 子資源...');
      const subResourcePaths = [
        'routingstep',
        'routingsteps',
        'step',
        'steps',
      ];

      for (const path of subResourcePaths) {
        try {
          const subResource = await netsuite.request(
            `/services/rest/record/v1/manufacturingrouting/1/${path}`,
            'GET'
          );
          results[`subResource_${path}`] = {
            success: true,
            data: subResource,
          };
        } catch (error: any) {
          results[`subResource_${path}`] = {
            success: false,
            error: error.message,
          };
        }
      }
    }

    return NextResponse.json({
      success: results.list?.success || results.detail?.success || false,
      message: results.list?.success 
        ? `成功查詢到 ${results.list.count} 個 Routing`
        : results.detail?.success
        ? '成功查詢 Routing 詳細資訊'
        : '查詢失敗',
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
    message: '請使用 POST 方法測試 Manufacturing Routing（權限開啟後）',
    endpoint: '/api/test-routing-after-permission',
    method: 'POST',
  });
}

