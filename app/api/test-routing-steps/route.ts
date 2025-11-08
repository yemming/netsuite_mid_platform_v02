import { NextResponse } from 'next/server';
import { getNetSuiteAPIClient } from '@/lib/netsuite-client';

/**
 * 測試 Manufacturing Routing Steps 的詳細資訊
 * 包括 Work Center 資訊
 */
export async function POST() {
  try {
    const netsuite = getNetSuiteAPIClient();
    const results: any = {
      timestamp: new Date().toISOString(),
      routingId: '1',
    };

    // 1. 取得 Routing Steps 列表
    console.log('查詢 Routing Steps...');
    try {
      const routingStepsList = await netsuite.request(
        '/services/rest/record/v1/manufacturingrouting/1/routingstep',
        'GET'
      );
      
      results.routingStepsList = {
        success: true,
        data: routingStepsList,
        count: routingStepsList.items?.length || 0,
        items: routingStepsList.items || [],
      };

      // 2. 如果有 Steps，取得每個 Step 的詳細資訊
      if (routingStepsList.items && routingStepsList.items.length > 0) {
        const stepDetails: any[] = [];
        
        for (const step of routingStepsList.items) {
          try {
            // 從 link 中提取 ID
            const stepId = step.links?.[0]?.href?.match(/routingStep\/(\d+)/)?.[1] || step.id;
            
            if (stepId) {
              const stepDetail = await netsuite.request(
                `/services/rest/record/v1/manufacturingrouting/1/routingStep/${stepId}`,
                'GET'
              );
              
              stepDetails.push({
                stepId: stepId,
                fields: Object.keys(stepDetail),
                fullStructure: stepDetail,
                // 提取關鍵欄位
                keyFields: {
                  operationSequence: stepDetail.operationSequence || stepDetail.operationsequence,
                  operationName: stepDetail.operationName || stepDetail.operationname,
                  manufacturingWorkCenter: stepDetail.manufacturingWorkCenter || stepDetail.manufacturingworkcenter,
                  machineResources: stepDetail.machineResources || stepDetail.machineresources,
                  laborResources: stepDetail.laborResources || stepDetail.laborresources,
                  manufacturingCostTemplate: stepDetail.manufacturingCostTemplate || stepDetail.manufacturingcosttemplate,
                  setupTime: stepDetail.setupTime || stepDetail.setuptime,
                  runRate: stepDetail.runRate || stepDetail.runrate,
                },
              });

              // 檢查 Work Center 的結構
              const workCenter = stepDetail.manufacturingWorkCenter || stepDetail.manufacturingworkcenter;
              if (workCenter) {
                stepDetails[stepDetails.length - 1].workCenterDetail = {
                  type: typeof workCenter,
                  isObject: typeof workCenter === 'object',
                  structure: workCenter,
                  id: typeof workCenter === 'object' ? workCenter.id : null,
                  refName: typeof workCenter === 'object' ? workCenter.refName : null,
                };
              }
            }
          } catch (stepError: any) {
            stepDetails.push({
              stepId: step.id || 'unknown',
              error: stepError.message,
            });
          }
        }
        
        results.stepDetails = stepDetails;
        
        // 3. 收集所有 Work Centers
        const workCenters = stepDetails
          .map((detail: any) => detail.keyFields?.manufacturingWorkCenter)
          .filter((wc: any) => wc != null);
        
        results.workCenters = {
          found: workCenters.length > 0,
          count: workCenters.length,
          workCenters: workCenters,
          uniqueWorkCenters: [...new Set(workCenters.map((wc: any) => 
            typeof wc === 'object' ? (wc.id || wc.refName) : wc
          ))],
        };
      }
    } catch (error: any) {
      results.routingStepsList = {
        success: false,
        error: error.message,
      };
    }

    // 4. 嘗試查詢 routingComponent（如果有的話）
    try {
      const routingComponents = await netsuite.request(
        '/services/rest/record/v1/manufacturingrouting/1/routingComponent',
        'GET'
      );
      results.routingComponents = {
        success: true,
        data: routingComponents,
      };
    } catch (error: any) {
      results.routingComponents = {
        success: false,
        error: error.message,
      };
    }

    return NextResponse.json({
      success: results.routingStepsList?.success || false,
      message: results.routingStepsList?.success
        ? `成功查詢到 ${results.routingStepsList.count} 個 Routing Steps`
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
    message: '請使用 POST 方法測試 Routing Steps',
    endpoint: '/api/test-routing-steps',
    method: 'POST',
  });
}

